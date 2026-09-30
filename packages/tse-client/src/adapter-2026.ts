import {
  type AreaProgressEntry,
  type AreaRef,
  type AreaResult,
  area,
  brasiliaToUtc,
  type CandidatePhoto,
  type CandidateResult,
  type City,
  type CitySections,
  type CountingProgress,
  type CountingStatus,
  type CountryProgress,
  DOMESTIC_STATES,
  type ElectionConfig,
  type ElectionProvider,
  type Fetched,
  isStateCode,
  type Office,
  type OfficeKind,
  type OfficeScope,
  type PartyResult,
  ProviderPayloadError,
  type ProviderSource,
  pad,
  type ResultQuery,
  type RoundDefinition,
  type RunningMate,
  type StateCode,
  type StateProgress,
  slugify,
} from '@eleicoes/election-core';
import type { z } from 'zod';
import type { Priority, TseHttpClient } from './http';
import {
  type CityConfigFile,
  cityConfigFileSchema,
  type ElectionConfigFile,
  electionConfigFileSchema,
  type ProgressEntry,
  progressFileSchema,
  type ResultFile,
  resultFileSchema,
  sectionConfigFileSchema,
  toDec,
  toInt,
} from './schemas';

/** TSE office codes (EA20 §2). Anything else is mapped generically from ele-c.json. */
const KNOWN_OFFICES: Record<
  string,
  { slug: string; kind: OfficeKind; scope: OfficeScope; states?: StateCode[] }
> = {
  '1': { slug: 'presidente', kind: 'majoritarian', scope: 'country' },
  '3': { slug: 'governador', kind: 'majoritarian', scope: 'state' },
  '5': { slug: 'senador', kind: 'majoritarian', scope: 'state' },
  '6': { slug: 'deputado-federal', kind: 'proportional', scope: 'state' },
  '7': {
    slug: 'deputado-estadual',
    kind: 'proportional',
    scope: 'state',
    states: DOMESTIC_STATES.map((s) => s.code).filter((c) => c !== 'DF'),
  },
  '8': { slug: 'deputado-distrital', kind: 'proportional', scope: 'state', states: ['DF'] },
  '11': { slug: 'prefeito', kind: 'majoritarian', scope: 'city' },
  '13': { slug: 'vereador', kind: 'proportional', scope: 'city' },
};

/** EA11 `e.tp` → scope of offices without a known code. */
const ELECTION_TYPE_SCOPE: Record<string, OfficeScope> = {
  '1': 'state',
  '2': 'state',
  '3': 'city',
  '4': 'city',
  '8': 'country',
  '9': 'country',
};

const STATUS: Record<string, CountingStatus> = { n: 'not-started', p: 'in-progress', f: 'finished' };

const DEFAULT_DIRS: Record<string, string> = {
  u: '<base>/<ambiente>/<ciclo>/<cd_eleicao>/dados/<uf>',
  ab: '<base>/<ambiente>/<ciclo>/<cd_eleicao>/dados/<uf>',
  cm: '<base>/<ambiente>/<ciclo>/<cd_eleicao>/config',
  cs: '<base>/<ambiente>/<ciclo>/<cd_pleito>/config/<uf>',
};

interface Context {
  cycle: string;
  pleito: string;
  dirs: Map<string, string>;
  config: ElectionConfig;
}

/**
 * Reads the TSE "Divulgação de Resultados" JSON files as specified for the 2026 general
 * elections (EA11, EA12, EA14, EA15, EA16, EA20). The only module that knows TSE field names.
 */
export class TSEAdapter2026 implements ElectionProvider {
  readonly id = 'tse-2026';
  readonly version = '2026-v1';
  private context: Context | null = null;

  constructor(
    private readonly http: TseHttpClient,
    private readonly source: ProviderSource,
    private readonly round: Pick<RoundDefinition, 'round' | 'date'>,
  ) {}

  resetConditionalCache() {
    this.http.resetValidators();
  }

  // ---------------------------------------------------------------- configuration (EA11, EA12)

  async getElectionConfig(): Promise<ElectionConfig> {
    const url = `${this.source.baseUrl}/${this.source.environment}/comum/config/ele-c.json`;
    const res = await this.http.get(url, { conditional: this.context != null });
    if (res.notModified && this.context) return this.context.config;
    if (res.notModified) throw new ProviderPayloadError('unexpected 304 for first config fetch', url, null);

    const file = this.parse(electionConfigFileSchema, res.body, url);
    const pleito = this.pickPleito(file, url);
    const dirs = new Map((file.arq ?? []).map((a) => [a.tp, a.dir]));
    const cycle = pleito.c ?? `ele${this.round.date.slice(0, 4)}`;

    const offices: Office[] = [];
    for (const election of pleito.e) {
      for (const abr of election.abr) {
        for (const cp of abr.cp ?? []) {
          if (cp.tp === '3') continue; // popular consultation questions: out of scope
          const existing = offices.find((o) => o.code === cp.cd && o.providerElectionCode === election.cd);
          const uf = abr.cd.toUpperCase();
          if (existing) {
            if (existing.states && isStateCode(uf) && !existing.states.includes(uf)) existing.states.push(uf);
            continue;
          }
          offices.push(this.toOffice(cp, election, uf));
        }
      }
    }

    const progressElection =
      pleito.e.find((e) => e.tp === '8') ?? pleito.e.find((e) => e.tp === '1' || e.tp === '3') ?? pleito.e[0];
    if (!progressElection) throw new ProviderPayloadError('pleito without elections', url, null);

    const partial: Context = {
      cycle,
      pleito: pleito.cd,
      dirs,
      config: {
        providerRoundId: pleito.cd,
        date: isoDate(pleito.dt),
        round: this.round.round,
        offices,
        cities: [],
        progressElectionCode: progressElection.cd,
        providerElectionCodes: pleito.e.map((e) => e.cd),
      },
    };
    partial.config.cities = await this.fetchCities(partial, progressElection.cd);
    this.context = partial;
    return partial.config;
  }

  private pickPleito(file: ElectionConfigFile, url: string) {
    const wanted = this.source.providerRoundId;
    const byCode = wanted ? file.pl.find((p) => p.cd === wanted) : undefined;
    const round = String(this.round.round);
    const byDate = file.pl.find((p) => isoDate(p.dt) === this.round.date && p.e.some((e) => e.t === round));
    const pleito = byCode ?? byDate ?? file.pl.find((p) => p.e.some((e) => e.t === round));
    if (!pleito)
      throw new ProviderPayloadError(`no pleito for round ${round} (${wanted ?? 'any'})`, url, null);
    return pleito;
  }

  private toOffice(
    cp: { cd: string; ds: string; tp: string },
    election: ElectionConfigFile['pl'][number]['e'][number],
    uf: string,
  ): Office {
    const known = KNOWN_OFFICES[cp.cd];
    const scope = known?.scope ?? ELECTION_TYPE_SCOPE[election.tp] ?? 'state';
    let states: StateCode[] | null = null;
    if (known?.states) states = [...known.states];
    else if (scope !== 'country' && isStateCode(uf)) states = [uf];
    return {
      code: cp.cd,
      slug: known?.slug ?? slugify(cp.ds),
      name: cp.ds,
      kind: known?.kind ?? (cp.tp === '2' ? 'proportional' : 'majoritarian'),
      scope,
      providerElectionCode: election.cd,
      states,
    };
  }

  private async fetchCities(ctx: Context, electionCode: string): Promise<City[]> {
    const url = `${this.dir(ctx, 'cm', electionCode, '')}/mun-e${pad(electionCode, 6)}-cm.json`;
    const res = await this.http.get(url, { conditional: false });
    if (res.notModified) return this.context?.config.cities ?? [];
    const file: CityConfigFile = this.parse(cityConfigFileSchema, res.body, url);
    const cities: City[] = [];
    for (const abr of file.abr) {
      const uf = abr.cd.toUpperCase();
      if (!isStateCode(uf)) continue;
      for (const mu of abr.mu) {
        cities.push({
          state: uf,
          code: pad(mu.cd, 5),
          ibgeCode: mu.cdi == null ? null : String(mu.cdi),
          name: mu.nm,
          isCapital: mu.c === 's',
          zones: (mu.z ?? []).map((z) => pad(z, 4)),
        });
      }
    }
    return cities;
  }

  // ---------------------------------------------------------------- progress (EA14, EA15)

  async getCountryProgress(electionCode: string): Promise<Fetched<CountryProgress>> {
    const ctx = await this.ctx();
    const url = `${this.dir(ctx, 'ab', electionCode, 'br')}/br-e${pad(electionCode, 6)}-ab.json`;
    return this.fetch(url, progressFileSchema, (file) => {
      let country: CountingProgress | null = null;
      const states: AreaProgressEntry[] = [];
      for (const entry of file.abr) {
        if (entry.tpabr === 'br') country = toProgress(entry);
        else if (entry.tpabr === 'uf') {
          const uf = String(entry.cdabr).toUpperCase();
          if (isStateCode(uf)) states.push({ area: area.state(uf), progress: toProgress(entry) });
        }
      }
      if (!country) throw new ProviderPayloadError('EA14 without a "br" entry', url, null);
      return { progress: country, states };
    });
  }

  async getStateProgress(
    electionCode: string,
    state: StateCode,
    { background = false }: { background?: boolean } = {},
  ): Promise<Fetched<StateProgress>> {
    const ctx = await this.ctx();
    const uf = state.toLowerCase();
    const url = `${this.dir(ctx, 'ab', electionCode, uf)}/${uf}-e${pad(electionCode, 6)}-ab.json`;
    return this.fetch(
      url,
      progressFileSchema,
      (file) => {
        let progress: CountingProgress | null = null;
        const cities: AreaProgressEntry[] = [];
        for (const entry of file.abr) {
          if (entry.tpabr === 'uf') progress = toProgress(entry);
          // The spec uses both "mu" and "mun" for municipality entries.
          else if (entry.tpabr === 'mu' || entry.tpabr === 'mun') {
            cities.push({ area: area.city(state, String(entry.cdabr)), progress: toProgress(entry) });
          }
        }
        if (!progress) throw new ProviderPayloadError('EA15 without a "uf" entry', url, null);
        return { state, progress, cities };
      },
      background ? 'low' : 'high',
    );
  }

  // ---------------------------------------------------------------- results (EA20)

  async getResult({ office, area: target, background }: ResultQuery): Promise<Fetched<AreaResult>> {
    const ctx = await this.ctx();
    const url = this.resultUrl(ctx, office, target);
    return this.fetch(
      url,
      resultFileSchema,
      (file) => this.toResult(file, office, target, url),
      background ? 'low' : 'high',
    );
  }

  private resultUrl(ctx: Context, office: Office, target: AreaRef): string {
    const ele = office.providerElectionCode;
    const suffix = `-c${pad(office.code, 4)}-e${pad(ele, 6)}-u.json`;
    const uf = target.state?.toLowerCase() ?? 'br';
    const dir = this.dir(ctx, 'u', ele, uf);
    switch (target.type) {
      case 'country':
        return `${dir}/br${suffix}`;
      case 'state':
        return `${dir}/${uf}${suffix}`;
      case 'city':
        return `${dir}/${uf}${target.cityCode}${suffix}`;
      case 'zone':
        return `${dir}/${uf}${target.cityCode}-z${target.zone}${suffix}`;
    }
  }

  private toResult(file: ResultFile, office: Office, target: AreaRef, url: string): AreaResult {
    const expected =
      target.type === 'country'
        ? 'br'
        : target.type === 'state'
          ? target.state!
          : target.type === 'city'
            ? target.cityCode!
            : target.zone!;
    if (sameCode(String(file.cdabr), expected) === false) {
      throw new ProviderPayloadError(`cdabr ${file.cdabr} does not match ${expected}`, url, null);
    }
    const publishable = file.dv !== 'n';
    const final = file.tf === 's';
    const carg = file.carg?.find((c) => sameCode(c.cd, office.code)) ?? file.carg?.[0];
    const federations = new Map((carg?.fed ?? []).map((f) => [String(f.n), f.sg ?? f.nm ?? null]));

    const candidates: CandidateResult[] = [];
    const parties: PartyResult[] = [];
    for (const agr of carg?.agr ?? []) {
      const coalition = agr.tp && agr.tp !== 'i' ? (agr.com ?? agr.nm ?? null) : null;
      for (const par of agr.par ?? []) {
        const partyRef = { number: par.n, abbreviation: cleanParty(par.sg), name: par.nm ?? '' };
        parties.push({
          ...partyRef,
          nominalVotes: toInt(par.tvtn),
          legendVotes: toInt(par.tvtl),
          seats: toInt(par.vag) ?? (agr.tp === 'i' ? toInt(agr.vag) : null),
          federation: par.nfed != null ? (federations.get(String(par.nfed)) ?? null) : null,
        });
        for (const c of par.cand ?? []) {
          candidates.push({
            key: c.sqcand != null ? String(c.sqcand) : `${office.code}-${c.n}`,
            number: c.n,
            name: c.nm ?? c.nmu ?? c.n,
            ballotName: c.nmu ?? c.nm ?? c.n,
            party: partyRef,
            coalition,
            runningMates: (c.vs ?? []).map(toRunningMate),
            votes: toInt(c.vap) ?? 0,
            percent: publishable ? (toDec(c.pvapn) ?? toDec(c.pvap)) : null,
            elected: c.e === 's' ? true : final ? false : null,
            status: c.st || null,
            voteDestination: c.dvt || null,
          });
        }
      }
    }

    const v = file.v ?? {};
    const vn = toInt(v.vn);
    const vnt = toInt(v.vnt);
    return {
      officeCode: office.code,
      area: target,
      progress: toProgress({ ...file, s: file.s, e: file.e }),
      votes: {
        total: toInt(v.tv),
        valid: toInt(v.vv),
        nominal: toInt(v.vnom),
        legend: toInt(v.vl),
        blank: toInt(v.vb),
        null: toInt(v.tvn) ?? (vn == null && vnt == null ? null : (vn ?? 0) + (vnt ?? 0)),
        annulled: toInt(v.van),
        annulledSubJudice: toInt(v.vansj),
      },
      candidates,
      parties,
      seats: toInt(carg?.nv),
      final,
      mathematicallyDecided: file.md === 'e' ? 'elected' : file.md === 's' ? 'runoff' : null,
      votesPublishable: publishable,
      noElectedReasons: file.esae === 's' ? (file.mnae ?? []) : [],
    };
  }

  // ---------------------------------------------------------------- photos ("ft" directory)

  /** "<base>/<ambiente>/<ciclo>/<cd_eleicao>/fotos/<uf>/<sqcand>.jpeg" (confirmed on the 2026 simulation). */
  async getCandidatePhoto(
    office: Office,
    state: StateCode | null,
    candidateKey: string,
  ): Promise<CandidatePhoto | null> {
    // The fictitious demo election has no photos.
    if (!/^\d{1,20}$/.test(candidateKey) || this.source.environment === 'demo') return null;
    const ctx = await this.ctx();
    const template = ctx.dirs.get('ft');
    const dir = (
      template?.startsWith('<base>') ? template : '<base>/<ambiente>/<ciclo>/<cd_eleicao>/fotos/<uf>'
    )
      .replace('<base>', this.source.baseUrl)
      .replace('<ambiente>', this.source.environment)
      .replace('<ciclo>', ctx.cycle)
      .replace('<cd_eleicao>', office.providerElectionCode)
      .replace('<uf>', office.scope === 'country' || !state ? 'br' : state.toLowerCase());
    const photo = await this.http.getBytes(`${dir}/${candidateKey}.jpeg`);
    return photo?.contentType.startsWith('image/') ? photo : null;
  }

  // ---------------------------------------------------------------- sections (EA16)

  async getSections(state: StateCode): Promise<Fetched<CitySections[]>> {
    const ctx = await this.ctx();
    const uf = state.toLowerCase();
    const url = `${this.dir(ctx, 'cs', ctx.config.progressElectionCode, uf)}/${uf}-p${pad(ctx.pleito, 6)}-cs.json`;
    return this.fetch(url, sectionConfigFileSchema, (file) =>
      file.abr.flatMap((abr) =>
        abr.mu.map((mu) => ({
          cityCode: pad(mu.cd, 5),
          sections: mu.zon.flatMap((zon) =>
            zon.sec.map((s) => ({
              zone: pad(zon.cd, 4),
              number: pad(s.ns, 4),
              mainSection: s.nsp != null ? pad(String(s.nsp), 4) : null,
              aggregated: (s.nsa ?? []).map((x) => pad(x, 4)),
              receivedAt: brasiliaToUtc(s.da, s.ha),
            })),
          ),
        })),
      ),
    );
  }

  // ---------------------------------------------------------------- plumbing

  private async ctx(): Promise<Context> {
    if (!this.context) await this.getElectionConfig();
    return this.context!;
  }

  /**
   * Builds a directory from the templates published in ele-c.json (`arq`), falling back to the
   * documented layout. Hosts inside templates are ignored: we only talk to the configured base.
   */
  private dir(ctx: Context, type: string, electionCode: string, uf: string): string {
    const template = ctx.dirs.get(type);
    const usable = template?.startsWith('<base>') ? template : DEFAULT_DIRS[type]!;
    return usable
      .replace('<base>', this.source.baseUrl)
      .replace('<ambiente>', this.source.environment)
      .replace('<ciclo>', ctx.cycle)
      .replace('<cd_eleicao>', electionCode)
      .replace('<cd_pleito>', ctx.pleito)
      .replace('<uf>', uf);
  }

  private async fetch<S extends z.ZodType, T>(
    url: string,
    schema: S,
    map: (file: z.infer<S>) => T,
    priority: Priority = 'high',
  ): Promise<Fetched<T>> {
    const res = await this.http.get(url, { priority });
    if (res.notModified) return { changed: false };
    const file = this.parse(schema, res.body, url);
    const data = map(file);
    const raw = file as { idg?: unknown; dg?: string | null; hg?: string | null };
    return {
      changed: true,
      data,
      provenance: {
        provider: 'TSE',
        adapter: `${this.id}@${this.version}`,
        sourceFile: url.slice(this.source.baseUrl.length),
        sourceId: raw.idg == null ? null : String(raw.idg),
        retrievedAt: new Date().toISOString(),
        sourceGeneratedAt: brasiliaToUtc(raw.dg, raw.hg),
        etag: res.etag,
        checksum: res.checksum,
      },
    };
  }

  private parse<S extends z.ZodType>(schema: S, body: string, url: string): z.infer<S> {
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      throw new ProviderPayloadError('invalid JSON', url, body.slice(0, 200));
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success)
      throw new ProviderPayloadError('payload does not match schema', url, parsed.error.issues.slice(0, 10));
    return parsed.data;
  }
}

function toProgress(entry: Pick<ProgressEntry, 'and' | 'dt' | 'ht' | 's' | 'e'>): CountingProgress {
  const s = entry.s ?? {};
  const e = entry.e ?? {};
  return {
    status: STATUS[entry.and ?? ''] ?? 'not-started',
    sectionsTotal: toInt(s.ts),
    sectionsCounted: toInt(s.st),
    sectionsCountedPct: toDec(s.pstn) ?? toDec(s.pst),
    sectionsInstalled: toInt(s.si),
    sectionsNotInstalled: toInt(s.sni),
    electorateTotal: toInt(e.te),
    electorateCounted: toInt(e.est),
    turnout: toInt(e.c),
    turnoutPct: toDec(e.pcn) ?? toDec(e.pc),
    abstention: toInt(e.a),
    abstentionPct: toDec(e.pan) ?? toDec(e.pa),
    totalizedAt: brasiliaToUtc(entry.dt, entry.ht),
  };
}

function toRunningMate(vs: {
  tp?: string | null;
  nm?: string | null;
  nmu?: string | null;
  sgp?: string | null;
}): RunningMate {
  return {
    role: vs.tp === 's1' ? 'first-alternate' : vs.tp === 's2' ? 'second-alternate' : 'vice',
    name: vs.nm ?? vs.nmu ?? '',
    ballotName: vs.nmu ?? vs.nm ?? '',
    party: cleanParty(vs.sgp) || null,
  };
}

/** "0001" equals "1"; letters compare case-insensitively. */
function sameCode(a: string, b: string): boolean {
  const norm = (x: string) => (/^\d+$/.test(x) ? String(Number(x)) : x.toLowerCase());
  return norm(a) === norm(b);
}

/** Parties "inaptos" come with a trailing "**". */
function cleanParty(sg: string | null | undefined): string {
  return (sg ?? '').replace(/\*+$/, '').trim();
}

function isoDate(ddmmyyyy: string | null | undefined): string | null {
  const m = ddmmyyyy ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy) : null;
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
