import type { Sql, StoredResult } from '@eleicoes/database';
import {
  type ActivityEventDTO,
  assignColors,
  type CandidateDTO,
  type CityDetailDTO,
  type CityRowDTO,
  type CompactCandidate,
  type CompareDTO,
  type CountingProgress,
  type CycleDTO,
  candidateDeltas,
  DOMESTIC_STATES,
  type ElectionSummary,
  getState,
  type IngestionStatus,
  type LeaderDTO,
  type OfficeInfo,
  type OperationsDTO,
  type OverviewDTO,
  type Paginated,
  type ProgressDTO,
  type Provenance,
  parseAreaKey,
  type ResultDTO,
  type RoundDetail,
  rankCandidates,
  type SearchHitDTO,
  type SeriesDTO,
  STATES,
  type StateDetailDTO,
  type StateRowDTO,
  searchKey,
  sortOffices,
  stateName,
  type TimelineAtDTO,
  type TimelineDTO,
  type VoteTotals,
} from '@eleicoes/election-core';

/**
 * Read side of the API. Plain parameterised SQL (postgres.js tagged templates): the queries
 * use DISTINCT ON / window functions that read better as SQL than through a query builder.
 */

export class NotFoundError extends Error {}

interface RoundRow {
  id: string;
  slug: string;
  electionSlug: string;
  electionName: string;
  year: number;
  kind: 'general' | 'municipal';
  round: number;
  date: string;
  status: 'scheduled' | 'live' | 'final';
  environment: string | null;
  demo: boolean;
  adapter: string | null;
  adapterVersion: string | null;
}

interface OfficeRow extends OfficeInfo {
  id: string;
}

interface ResultRow {
  officeId: string;
  areaKey: string;
  result: StoredResult;
  previousCandidates: CompactCandidate[] | null;
  provenance: Provenance;
  updatedAt: string;
}

const PROPORTIONAL_DEFAULT_LIMIT = 60;
const toIso = (v: string | Date | null) => (v == null ? null : new Date(v).toISOString());

export class Queries {
  /** Candidate colours per (round, office, home area). */
  private colorCache = new Map<string, Map<string, string>>();

  constructor(private readonly sql: Sql) {}

  // ---------------------------------------------------------------- elections & rounds

  async listElections(): Promise<ElectionSummary[]> {
    const rows = await this.sql<(RoundRow & { electionDemo: boolean })[]>`
      select r.id, r.slug, e.slug as "electionSlug", e.name as "electionName", e.year, e.kind, r.round,
             r.date::text as date, r.status, r.environment, e.demo, r.adapter, r.adapter_version as "adapterVersion"
      from election_rounds r join elections e on e.id = r.election_id
      order by e.demo, e.year desc, e.slug, r.round`;
    const out = new Map<string, ElectionSummary>();
    for (const r of rows) {
      let e = out.get(r.electionSlug);
      if (!e) {
        e = {
          slug: r.electionSlug,
          name: r.electionName,
          year: r.year,
          kind: r.kind,
          demo: r.demo,
          rounds: [],
        };
        out.set(r.electionSlug, e);
      }
      e.rounds.push(this.summary(r));
    }
    return [...out.values()];
  }

  private summary(r: RoundRow) {
    return {
      slug: r.slug,
      electionSlug: r.electionSlug,
      electionName: r.electionName,
      year: r.year,
      kind: r.kind,
      round: r.round,
      date: r.date,
      status: r.status,
      environment: r.environment,
      demo: r.demo,
      adapter: r.adapter && r.adapterVersion ? `${r.adapter}@${r.adapterVersion}` : r.adapter,
    };
  }

  async round(slug: string): Promise<Omit<RoundDetail, 'offices'> & { id: string; offices: OfficeRow[] }> {
    const [r] = await this.sql<RoundRow[]>`
      select r.id, r.slug, e.slug as "electionSlug", e.name as "electionName", e.year, e.kind, r.round,
             r.date::text as date, r.status, r.environment, e.demo, r.adapter, r.adapter_version as "adapterVersion"
      from election_rounds r join elections e on e.id = r.election_id where r.slug = ${slug}`;
    if (!r) throw new NotFoundError(`election round "${slug}" not found`);
    const offices = await this.sql<OfficeRow[]>`
      select id, provider_id as code, slug, name, kind, scope, states from offices where round_id = ${r.id}`;
    return { ...this.summary(r), id: r.id, offices: sortOffices(offices) };
  }

  private publicRound(r: Awaited<ReturnType<Queries['round']>>): RoundDetail {
    const { id: _id, offices, ...rest } = r;
    return { ...rest, offices: offices.map(publicOffice) };
  }

  async ingestion(roundId: string, roundStatus: string): Promise<IngestionStatus> {
    // A cycle still running says nothing about health yet: judge by the last finished one.
    const [last] = await this.sql<{ startedAt: Date; status: string; mode: string; error: string | null }[]>`
      select started_at as "startedAt", status, mode, error from collector_cycles
      where round_id = ${roundId} and status <> 'running' order by started_at desc limit 1`;
    const [ok] = await this.sql<{ at: Date }[]>`
      select coalesce(finished_at, started_at) as at from collector_cycles
      where round_id = ${roundId} and status in ('ok', 'degraded') order by started_at desc limit 1`;
    const [issue] = await this.sql<{ message: string | null }[]>`
      select message from ingestion_events
      where round_id = ${roundId} and (type like 'source.%' or type = 'collector.error')
        and occurred_at > now() - interval '10 minutes'
      order by occurred_at desc limit 1`;
    if (!last) return { state: 'idle', mode: null, lastCycleAt: null, lastSuccessAt: null, lastError: null };
    const age = Date.now() - new Date(last.startedAt).getTime();
    const state =
      age > 120_000
        ? roundStatus === 'final' || last.mode === 'REPLAY'
          ? 'idle'
          : 'offline'
        : last.status === 'ok'
          ? 'healthy'
          : 'degraded';
    return {
      state,
      mode: last.mode,
      lastCycleAt: toIso(last.startedAt),
      lastSuccessAt: toIso(ok?.at ?? null),
      lastError: last.error ?? issue?.message ?? null,
    };
  }

  // ---------------------------------------------------------------- progress

  private async progressRows(roundId: string, filter: { keys?: string[]; type?: string; state?: string }) {
    return this.sql<
      { areaKey: string; progress: CountingProgress; countedPct: number | null; updatedAt: Date }[]
    >`
      select area_key as "areaKey", progress, counted_pct as "countedPct", updated_at as "updatedAt"
      from area_progress where round_id = ${roundId}
      ${filter.keys ? this.sql`and area_key in ${this.sql(filter.keys)}` : this.sql``}
      ${filter.type ? this.sql`and area_type = ${filter.type}` : this.sql``}
      ${filter.state ? this.sql`and state_code = ${filter.state}` : this.sql``}`;
  }

  private toProgress(row: {
    areaKey: string;
    progress: CountingProgress;
    countedPct: number | null;
    updatedAt: Date;
  }): ProgressDTO {
    return {
      ...row.progress,
      areaKey: row.areaKey,
      countedPct: row.countedPct,
      updatedAt: toIso(row.updatedAt)!,
    };
  }

  private async progressOf(roundId: string, key: string): Promise<ProgressDTO | null> {
    const [row] = await this.progressRows(roundId, { keys: [key] });
    return row ? this.toProgress(row) : null;
  }

  // ---------------------------------------------------------------- results

  private officesFor(offices: OfficeRow[], areaType: 'country' | 'state' | 'city', uf: string | null) {
    return offices.filter((o) => {
      if (areaType === 'country') return o.scope === 'country';
      if (uf === 'ZZ') return o.scope === 'country';
      if (areaType === 'state' && o.scope === 'city') return false;
      return o.states == null || o.states.includes(uf!);
    });
  }

  /** Colours come from the office's home area (Brazil for president, the state otherwise). */
  private async colorsFor(round: { id: string; slug: string }, office: OfficeRow, uf: string | null) {
    const home = office.scope === 'country' ? 'br' : (uf ?? 'br').toLowerCase();
    const key = `${round.slug}|${office.id}|${home}`;
    const cached = this.colorCache.get(key);
    if (cached) return cached;
    const [row] = await this.sql<
      { candidates: { key: string; votes: number; number: string; party: { abbreviation: string } }[] }[]
    >`
      select result->'candidates' as candidates from area_results
      where round_id = ${round.id} and office_id = ${office.id} and area_key = ${home}`;
    const map = assignColors(rankCandidates(row?.candidates ?? []));
    // Kept for the life of the process so a candidate never changes colour mid-count.
    if (map.size > 0) this.colorCache.set(key, map);
    return map;
  }

  private async toResultDTO(
    round: { id: string; slug: string },
    office: OfficeRow,
    row: ResultRow,
    areaName: string,
    limit: number | null,
  ): Promise<ResultDTO> {
    const a = parseAreaKey(row.areaKey)!;
    const colors = await this.colorsFor(round, office, a.state);
    const ranked = rankCandidates(row.result.candidates);
    const deltas = candidateDeltas(
      row.previousCandidates,
      ranked.map((c) => [c.key, c.votes, c.percent]),
    );
    const max = limit ?? (office.kind === 'proportional' ? PROPORTIONAL_DEFAULT_LIMIT : ranked.length);
    const candidates: CandidateDTO[] = ranked.slice(0, max).map((c) => ({
      ...c,
      color: colors.get(c.key) ?? '#8A9A93',
      deltaVotes: deltas.get(c.key)?.votes ?? null,
      deltaPp: deltas.get(c.key)?.pp ?? null,
    }));
    return {
      office: publicOffice(office),
      areaKey: row.areaKey,
      areaName,
      progress: {
        ...row.result.progress,
        areaKey: row.areaKey,
        countedPct: row.result.progress.sectionsCountedPct,
        updatedAt: toIso(row.updatedAt)!,
      },
      votes: row.result.votes,
      candidates,
      candidatesTotal: ranked.length,
      parties: row.result.parties,
      seats: row.result.seats,
      final: row.result.final,
      mathematicallyDecided: row.result.mathematicallyDecided,
      votesPublishable: row.result.votesPublishable,
      updatedAt: toIso(row.updatedAt)!,
      provenance: {
        provider: row.provenance.provider,
        adapter: row.provenance.adapter,
        sourceFile: row.provenance.sourceFile,
        retrievedAt: row.provenance.retrievedAt,
        sourceGeneratedAt: row.provenance.sourceGeneratedAt,
      },
    };
  }

  private async resultRows(roundId: string, officeIds: string[], areaKeys: string[]) {
    if (officeIds.length === 0 || areaKeys.length === 0) return [];
    return this.sql<ResultRow[]>`
      select office_id as "officeId", area_key as "areaKey", result, previous_candidates as "previousCandidates",
             provenance, updated_at as "updatedAt"
      from area_results
      where round_id = ${roundId} and office_id in ${this.sql(officeIds)} and area_key in ${this.sql(areaKeys)}`;
  }

  private async areaName(areaKey: string): Promise<string> {
    const a = parseAreaKey(areaKey);
    if (!a) return areaKey;
    if (a.type === 'country') return 'Brasil';
    if (a.type === 'state') return stateName(a.state!);
    const [c] = await this.sql<{ name: string }[]>`
      select name from cities where state_code = ${a.state} and provider_id = ${a.cityCode}`;
    const city = c ? titleCase(c.name) : a.cityCode!;
    return a.type === 'zone' ? `${city} — Zona ${a.zone}` : city;
  }

  async result(
    slug: string,
    officeSlug: string | undefined,
    areaKey: string,
    limit: number | null,
  ): Promise<ResultDTO | null> {
    const round = await this.round(slug);
    const a = parseAreaKey(areaKey);
    if (!a) throw new NotFoundError(`invalid area "${areaKey}"`);
    const applicable = this.officesFor(round.offices, a.type === 'zone' ? 'city' : a.type, a.state);
    const office = officeSlug ? applicable.find((o) => o.slug === officeSlug) : applicable[0];
    if (!office) throw new NotFoundError(`office "${officeSlug}" is not disputed in "${areaKey}"`);
    const [row] = await this.resultRows(round.id, [office.id], [a.key]);
    return row ? this.toResultDTO(round, office, row, await this.areaName(a.key), limit) : null;
  }

  // ---------------------------------------------------------------- pages

  async overview(slug: string): Promise<OverviewDTO> {
    const round = await this.round(slug);
    const headlineOffice = round.offices.find((o) => o.scope === 'country') ?? null;
    const [progress, ingestion, states] = await Promise.all([
      this.progressOf(round.id, 'br'),
      this.ingestion(round.id, round.status),
      this.stateRows(round, headlineOffice),
    ]);
    let headline: ResultDTO | null = null;
    if (headlineOffice) {
      const [row] = await this.resultRows(round.id, [headlineOffice.id], ['br']);
      if (row) headline = await this.toResultDTO(round, headlineOffice, row, 'Brasil', null);
    }
    return { round: this.publicRound(round), progress, ingestion, headline, states };
  }

  async states(slug: string) {
    const round = await this.round(slug);
    return this.stateRows(round, round.offices.find((o) => o.scope === 'country') ?? null);
  }

  private async stateRows(
    round: { id: string; slug: string },
    headlineOffice: OfficeRow | null,
  ): Promise<StateRowDTO[]> {
    const progress = await this.progressRows(round.id, { type: 'state' });
    const activity = await this.sql<{ state: string; sections: number; updates: number }[]>`
      select state_code as state, coalesce(sum(sections_added) filter (where type = 'state.updated'), 0)::int as sections,
             count(*)::int as updates
      from ingestion_events
      where round_id = ${round.id} and type in ('state.updated', 'city.updated') and occurred_at > now() - interval '5 minutes'
      group by state_code`;
    const leaders = new Map<string, LeaderDTO>();
    if (headlineOffice) {
      const colors = await this.colorsFor(round, headlineOffice, null);
      const rows = await this.sql<
        {
          areaKey: string;
          top: {
            key: string;
            ballotName: string;
            party: { abbreviation: string };
            percent: number | null;
            votes: number;
          } | null;
        }[]
      >`
        select area_key as "areaKey",
               (select c from jsonb_array_elements(result->'candidates') c order by (c->>'votes')::bigint desc limit 1) as top
        from area_results where round_id = ${round.id} and office_id = ${headlineOffice.id} and area_type = 'state'`;
      for (const r of rows) {
        if (!r.top || r.top.votes === 0) continue;
        leaders.set(r.areaKey.toUpperCase(), {
          name: r.top.ballotName,
          party: r.top.party.abbreviation,
          color: colors.get(r.top.key) ?? '#8A9A93',
          percent: r.top.percent,
        });
      }
    }
    const byState = new Map(progress.map((p) => [p.areaKey.toUpperCase(), p]));
    const act = new Map(activity.map((a) => [a.state, a]));
    const list = STATES.filter((s) => s.code !== 'ZZ' || byState.has('ZZ'));
    return list.map((s) => {
      const p = byState.get(s.code);
      return {
        uf: s.code,
        name: s.name,
        region: s.region,
        progress: p ? this.toProgress(p) : null,
        sectionsLast5m: act.get(s.code)?.sections ?? 0,
        updatesLast5m: act.get(s.code)?.updates ?? 0,
        leader: leaders.get(s.code) ?? null,
      };
    });
  }

  async state(slug: string, uf: string): Promise<StateDetailDTO> {
    const round = await this.round(slug);
    const [progress, ingestion, [count]] = await Promise.all([
      this.progressOf(round.id, uf.toLowerCase()),
      this.ingestion(round.id, round.status),
      this.sql<{ n: number }[]>`select count(*)::int as n from cities where state_code = ${uf}`,
    ]);
    return {
      round: this.publicRound(round),
      uf,
      name: stateName(uf),
      progress,
      offices: this.officesFor(round.offices, 'state', uf).map(publicOffice),
      ingestion,
      cityCount: count?.n ?? 0,
    };
  }

  async cities(
    slug: string,
    uf: string,
    opts: { q?: string; sort: string; page: number; pageSize: number },
  ): Promise<Paginated<CityRowDTO>> {
    const round = await this.round(slug);
    const like = opts.q ? `%${searchKey(opts.q)}%` : null;
    const order =
      {
        name: this.sql`c.search_name asc`,
        'counted-desc': this.sql`p.counted_pct desc nulls last, c.search_name`,
        'counted-asc': this.sql`p.counted_pct asc nulls first, c.search_name`,
        turnout: this.sql`p.turnout desc nulls last, c.search_name`,
        updated: this.sql`p.updated_at desc nulls last, c.search_name`,
      }[opts.sort] ?? this.sql`c.is_capital desc, c.search_name`;
    const rows = await this.sql<
      {
        code: string;
        name: string;
        isCapital: boolean;
        areaKey: string | null;
        progress: CountingProgress | null;
        countedPct: number | null;
        updatedAt: Date | null;
        total: number;
      }[]
    >`
      select c.provider_id as code, c.name, c.is_capital as "isCapital", p.area_key as "areaKey", p.progress,
             p.counted_pct as "countedPct", p.updated_at as "updatedAt", count(*) over ()::int as total
      from cities c
      left join area_progress p on p.round_id = ${round.id} and p.area_key = lower(c.state_code) || '-' || c.provider_id
      where c.state_code = ${uf} ${like ? this.sql`and c.search_name like ${like}` : this.sql``}
      order by ${order}
      limit ${opts.pageSize} offset ${(opts.page - 1) * opts.pageSize}`;
    return {
      items: rows.map((r) => ({
        code: r.code,
        name: titleCase(r.name),
        isCapital: r.isCapital,
        progress:
          r.progress && r.areaKey
            ? this.toProgress({
                areaKey: r.areaKey,
                progress: r.progress,
                countedPct: r.countedPct,
                updatedAt: r.updatedAt!,
              })
            : null,
      })),
      total: rows[0]?.total ?? 0,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  }

  async city(slug: string, uf: string, code: string): Promise<CityDetailDTO> {
    const round = await this.round(slug);
    const [city] = await this.sql<
      { code: string; name: string; isCapital: boolean; ibgeCode: string | null; zones: string[] }[]
    >`
      select provider_id as code, name, is_capital as "isCapital", ibge_code as "ibgeCode", zones
      from cities where state_code = ${uf} and provider_id = ${code}`;
    if (!city) throw new NotFoundError(`city ${uf}/${code} not found`);
    const key = `${uf.toLowerCase()}-${code}`;
    const offices = this.officesFor(round.offices, 'city', uf);
    const rows = await this.resultRows(
      round.id,
      offices.map((o) => o.id),
      [key],
    );
    const name = titleCase(city.name);
    const results = await Promise.all(
      offices.flatMap((o) => {
        const row = rows.find((r) => r.officeId === o.id);
        return row ? [this.toResultDTO(round, o, row, name, null)] : [];
      }),
    );
    return {
      round: this.publicRound(round),
      uf,
      stateName: stateName(uf),
      city: { ...city, name },
      progress: await this.progressOf(round.id, key),
      results,
    };
  }

  // ---------------------------------------------------------------- history

  async timeline(slug: string): Promise<TimelineDTO> {
    const round = await this.round(slug);
    const rows = await this.sql<{ at: Date; countedPct: number | null }[]>`
      select captured_at as at, counted_pct as "countedPct" from progress_snapshots
      where round_id = ${round.id} and area_key = 'br' order by captured_at`;
    const points = downsample(rows, 300).map((r) => ({ at: toIso(r.at)!, countedPct: r.countedPct }));
    return { start: points[0]?.at ?? null, end: points.at(-1)?.at ?? null, points };
  }

  async timelineAt(slug: string, at: string): Promise<TimelineAtDTO> {
    const round = await this.round(slug);
    const headlineOffice = round.offices.find((o) => o.scope === 'country') ?? null;
    const progressAt = await this.sql<
      { areaKey: string; progress: CountingProgress; countedPct: number | null; capturedAt: Date }[]
    >`
      select distinct on (area_key) area_key as "areaKey", progress, counted_pct as "countedPct", captured_at as "capturedAt"
      from progress_snapshots
      where round_id = ${round.id} and area_type in ('country', 'state') and captured_at <= ${at}
      order by area_key, captured_at desc`;
    const br = progressAt.find((p) => p.areaKey === 'br');

    let headline: ResultDTO | null = null;
    const leaders = new Map<string, LeaderDTO>();
    if (headlineOffice) {
      const snaps = await this.sql<
        {
          areaKey: string;
          votes: VoteTotals;
          candidates: CompactCandidate[] | null;
          capturedAt: Date;
          countedPct: number | null;
        }[]
      >`
        select distinct on (area_key) area_key as "areaKey", votes, candidates, captured_at as "capturedAt", counted_pct as "countedPct"
        from result_snapshots
        where round_id = ${round.id} and office_id = ${headlineOffice.id} and area_type in ('country', 'state')
          and captured_at <= ${at}
        order by area_key, captured_at desc`;
      const [current] = await this.resultRows(round.id, [headlineOffice.id], ['br']);
      const colors = await this.colorsFor(round, headlineOffice, null);
      const names = new Map((current?.result.candidates ?? []).map((c) => [c.key, c]));
      for (const s of snaps) {
        if (!s.candidates) continue;
        const top = [...s.candidates].sort((x, y) => y[1] - x[1])[0];
        const cand = top && names.get(top[0]);
        if (s.areaKey !== 'br' && cand && top[1] > 0) {
          leaders.set(s.areaKey.toUpperCase(), {
            name: cand.ballotName,
            party: cand.party.abbreviation,
            color: colors.get(cand.key) ?? '#8A9A93',
            percent: top[2],
          });
        }
      }
      const brSnap = snaps.find((s) => s.areaKey === 'br');
      if (current && brSnap?.candidates) {
        // Rebuild the result as it was: names from the current row, numbers from the snapshot.
        const byKey = new Map(brSnap.candidates.map((c) => [c[0], c]));
        const prevRow: ResultRow = {
          ...current,
          previousCandidates: null,
          updatedAt: toIso(brSnap.capturedAt)!,
          result: {
            ...current.result,
            votes: brSnap.votes,
            final: false,
            mathematicallyDecided: null,
            progress: br?.progress ?? current.result.progress,
            candidates: current.result.candidates.map((c) => ({
              ...c,
              votes: byKey.get(c.key)?.[1] ?? 0,
              percent: byKey.get(c.key)?.[2] ?? null,
              elected: null,
              status: null,
            })),
          },
        };
        headline = await this.toResultDTO(round, headlineOffice, prevRow, 'Brasil', null);
      }
    }
    return {
      at,
      progress: br ? { ...this.toProgress({ ...br, updatedAt: br.capturedAt }) } : null,
      headline,
      states: DOMESTIC_STATES.map((s) => ({
        uf: s.code,
        countedPct: progressAt.find((p) => p.areaKey === s.code.toLowerCase())?.countedPct ?? null,
        leader: leaders.get(s.code) ?? null,
      })),
    };
  }

  async series(slug: string, officeSlug: string, areaKey: string): Promise<SeriesDTO> {
    const round = await this.round(slug);
    const office = round.offices.find((o) => o.slug === officeSlug);
    const a = parseAreaKey(areaKey);
    if (!office || !a) throw new NotFoundError('unknown office or area');
    const [current] = await this.resultRows(round.id, [office.id], [a.key]);
    const colors = await this.colorsFor(round, office, a.state);
    const top = rankCandidates(current?.result.candidates ?? []).slice(0, 6);
    const rows = await this.sql<{ at: Date; countedPct: number | null; candidates: CompactCandidate[] }[]>`
      select captured_at as at, counted_pct as "countedPct", candidates from result_snapshots
      where round_id = ${round.id} and office_id = ${office.id} and area_key = ${a.key} and candidates is not null
      order by captured_at`;
    return {
      office: publicOffice(office),
      areaKey: a.key,
      candidates: top.map((c) => ({
        key: c.key,
        name: c.ballotName,
        party: c.party.abbreviation,
        color: colors.get(c.key) ?? '#8A9A93',
      })),
      points: downsample(rows, 300).map((r) => {
        const byKey = new Map(r.candidates.map((c) => [c[0], c[2]]));
        return {
          at: toIso(r.at)!,
          countedPct: r.countedPct,
          values: Object.fromEntries(top.map((c) => [c.key, byKey.get(c.key) ?? null])),
        };
      }),
    };
  }

  // ---------------------------------------------------------------- operations

  async events(slug: string, limit: number, before?: number): Promise<ActivityEventDTO[]> {
    const round = await this.round(slug);
    return this.eventRows(round.id, limit, before);
  }

  private async eventRows(roundId: string, limit: number, before?: number): Promise<ActivityEventDTO[]> {
    const rows = await this.sql<
      {
        id: string;
        type: string;
        occurredAt: Date;
        areaKey: string | null;
        state: string | null;
        sectionsAdded: number | null;
        votesAdded: number | null;
        countedPct: number | null;
        message: string | null;
        cityName: string | null;
      }[]
    >`
      select e.id::text, e.type, e.occurred_at as "occurredAt", e.area_key as "areaKey", e.state_code as state,
             e.sections_added as "sectionsAdded", e.votes_added as "votesAdded", e.counted_pct as "countedPct", e.message,
             c.name as "cityName"
      from ingestion_events e
      left join cities c on e.area_key like '%-_____' and c.state_code = e.state_code and c.provider_id = right(e.area_key, 5)
      where e.round_id = ${roundId} ${before ? this.sql`and e.id < ${before}` : this.sql``}
        and (e.type <> 'city.updated' or coalesce(e.sections_added, 0) > 0)
      order by e.id desc limit ${limit}`;
    return rows.map((r) => ({
      ...r,
      occurredAt: toIso(r.occurredAt)!,
      areaName:
        r.areaKey === 'br'
          ? 'Brasil'
          : r.cityName
            ? titleCase(r.cityName)
            : r.state
              ? stateName(r.state)
              : null,
    }));
  }

  async operations(slug: string): Promise<OperationsDTO> {
    const round = await this.round(slug);
    const [ingestion, [rates], [req], freshness, heat, cycles, events, [delay]] = await Promise.all([
      this.ingestion(round.id, round.status),
      this.sql<{ sections: number; votes: number; states: number; cities: number }[]>`
        select coalesce(sum(sections_added) filter (where type = 'country.updated'), 0)::float8 / 5 as sections,
               coalesce(sum(votes_added) filter (where type = 'country.updated'), 0)::float8 / 5 as votes,
               count(*) filter (where type = 'state.updated')::float8 / 5 as states,
               count(*) filter (where type = 'city.updated')::float8 / 5 as cities
        from ingestion_events where round_id = ${round.id} and occurred_at > now() - interval '5 minutes'`,
      this.sql<
        {
          total: number;
          ok: number;
          notModified: number;
          errors: number;
          avg: number | null;
          p95: number | null;
        }[]
      >`
        select coalesce(sum(requests), 0)::int as total, coalesce(sum(ok), 0)::int as ok,
               coalesce(sum(not_modified), 0)::int as "notModified", coalesce(sum(errors), 0)::int as errors,
               sum(avg_latency_ms * requests) / nullif(sum(requests), 0) as avg, max(p95_latency_ms) as p95
        from collector_cycles where round_id = ${round.id} and started_at > now() - interval '15 minutes'`,
      this.sql<{ areaKey: string; updatedAt: Date; totalizedAt: Date | null }[]>`
        select area_key as "areaKey", updated_at as "updatedAt", totalized_at as "totalizedAt"
        from area_progress where round_id = ${round.id} and area_type in ('country', 'state')`,
      this.sql<{ uf: string; sections: number; votes: number; updates: number }[]>`
        select state_code as uf,
               coalesce(sum(sections_added) filter (where type = 'state.updated'), 0)::int as sections,
               coalesce(sum(votes_added) filter (where type = 'state.updated'), 0)::float8 as votes,
               count(*)::int as updates
        from ingestion_events
        where round_id = ${round.id} and type in ('state.updated', 'city.updated') and occurred_at > now() - interval '5 minutes'
        group by state_code`,
      this.sql<CycleDTO[]>`
        select id::text, started_at as "startedAt",
               (extract(epoch from finished_at - started_at) * 1000)::int as "durationMs",
               requests, ok, not_modified as "notModified", errors, p95_latency_ms as "p95LatencyMs", status
        from collector_cycles where round_id = ${round.id} order by started_at desc limit 40`,
      this.eventRows(round.id, 60),
      this.sql<{ avg: number | null; p95: number | null; samples: number }[]>`
        select avg(d)::float8 as avg, percentile_cont(0.95) within group (order by d) as p95, count(*)::int as samples
        from (
          select extract(epoch from ((provenance->>'retrievedAt')::timestamptz - (provenance->>'sourceGeneratedAt')::timestamptz)) as d
          from result_snapshots
          where round_id = ${round.id} and area_type in ('country', 'state')
            and captured_at > now() - interval '15 minutes' and provenance->>'sourceGeneratedAt' is not null
        ) x where d >= 0`,
    ]);
    const fresh = new Map(freshness.map((f) => [f.areaKey, f]));
    return {
      ingestion,
      processing: {
        sectionsPerMinute: rates?.sections ?? 0,
        votesPerMinute: rates?.votes ?? 0,
        statesPerMinute: rates?.states ?? 0,
        citiesPerMinute: rates?.cities ?? 0,
      },
      requests: {
        windowMinutes: 15,
        total: req?.total ?? 0,
        ok: req?.ok ?? 0,
        notModified: req?.notModified ?? 0,
        errors: req?.errors ?? 0,
        avgLatencyMs: req?.avg ?? null,
        p95LatencyMs: req?.p95 ?? null,
      },
      delay: { avgSeconds: delay?.avg ?? null, p95Seconds: delay?.p95 ?? null, samples: delay?.samples ?? 0 },
      freshness: [
        { key: 'br', name: 'Brasil' },
        ...DOMESTIC_STATES.map((s) => ({ key: s.code.toLowerCase(), name: s.name })),
      ].map((a) => ({
        areaKey: a.key,
        name: a.name,
        updatedAt: toIso(fresh.get(a.key)?.updatedAt ?? null),
        totalizedAt: toIso(fresh.get(a.key)?.totalizedAt ?? null),
      })),
      heat: DOMESTIC_STATES.map((s) => {
        const h = heat.find((x) => x.uf === s.code);
        return { uf: s.code, sections: h?.sections ?? 0, votes: h?.votes ?? 0, updates: h?.updates ?? 0 };
      }),
      cycles: cycles.map((c) => ({ ...c, startedAt: toIso(c.startedAt)! })),
      events,
    };
  }

  // ---------------------------------------------------------------- search & compare

  async search(slug: string, q: string): Promise<SearchHitDTO[]> {
    const round = await this.round(slug);
    const key = searchKey(q);
    if (key.length < 2) return [];
    const base = `/elections/${round.electionSlug}`;
    const turno = `?turno=${round.round}`;
    const hits: SearchHitDTO[] = [];
    for (const s of DOMESTIC_STATES) {
      if (searchKey(s.name).includes(key) || s.code.toLowerCase() === key) {
        hits.push({
          kind: 'state',
          label: s.name,
          detail: s.code,
          href: `${base}/states/${s.code.toLowerCase()}${turno}`,
        });
      }
    }
    for (const o of round.offices) {
      if (searchKey(o.name).includes(key))
        hits.push({
          kind: 'office',
          label: o.name,
          detail: 'Cargo',
          href: `${base}${turno}&cargo=${o.slug}`,
        });
    }
    const like = `%${key}%`;
    const [cityRows, candidateRows, partyRows] = await Promise.all([
      this.sql<{ uf: string; code: string; name: string }[]>`
        select state_code as uf, provider_id as code, name from cities
        where search_name like ${like} and state_code <> 'ZZ'
        order by is_capital desc, length(search_name), search_name limit 8`,
      this.sql<
        {
          ballotName: string;
          number: string;
          party: string;
          uf: string | null;
          office: string;
          officeSlug: string;
          scope: string;
        }[]
      >`
        select c.ballot_name as "ballotName", c.number, c.party_abbreviation as party, c.state_code as uf,
               o.name as office, o.slug as "officeSlug", o.scope
        from candidates c join offices o on o.id = c.office_id
        where c.round_id = ${round.id} and (c.search_name like ${like} or c.number = ${q.trim()})
        order by o.scope = 'country' desc, length(c.search_name) limit 8`,
      this.sql<{ number: string; abbreviation: string; name: string }[]>`
        select number, abbreviation, name from parties
        where round_id = ${round.id} and (lower(abbreviation) = ${key} or lower(name) like ${like}) limit 5`,
    ]);
    for (const c of cityRows) {
      hits.push({
        kind: 'city',
        label: titleCase(c.name),
        detail: stateName(c.uf),
        href: `${base}/states/${c.uf.toLowerCase()}/cities/${c.code}${turno}`,
      });
    }
    for (const c of candidateRows) {
      const where = c.uf ? `/states/${c.uf.toLowerCase()}` : '';
      hits.push({
        kind: 'candidate',
        label: titleCase(c.ballotName),
        detail: `${c.number} · ${c.party} · ${c.office}${c.uf ? ` · ${c.uf}` : ''}`,
        href: `${base}${where}${turno}&cargo=${c.officeSlug}`,
      });
    }
    for (const p of partyRows) {
      hits.push({
        kind: 'party',
        label: p.abbreviation,
        detail: `${p.number} · ${p.name}`,
        href: `${base}/compare${turno}`,
      });
    }
    return hits.slice(0, 20);
  }

  async compare(slug: string, ufs: string[], officeSlug?: string): Promise<CompareDTO> {
    const round = await this.round(slug);
    const office = officeSlug
      ? round.offices.find((o) => o.slug === officeSlug)
      : (round.offices.find((o) => o.scope === 'country') ?? round.offices[0]);
    const keys = ufs.map((u) => u.toLowerCase());
    const progress = await this.progressRows(round.id, { keys });
    const rows = office ? await this.resultRows(round.id, [office.id], keys) : [];
    const colors = office
      ? await this.colorsFor(round, office, office.scope === 'country' ? null : (ufs[0] ?? null))
      : new Map();
    return {
      office: office ? publicOffice(office) : null,
      states: ufs.map((uf) => {
        const p = progress.find((x) => x.areaKey === uf.toLowerCase());
        const r = rows.find((x) => x.areaKey === uf.toLowerCase());
        return {
          uf,
          name: getState(uf)?.name ?? uf,
          progress: p ? this.toProgress(p) : null,
          votes: r?.result.votes ?? null,
          candidates: rankCandidates(r?.result.candidates ?? [])
            .slice(0, 6)
            .map((c) => ({
              key: c.key,
              name: c.ballotName,
              color: colors.get(c.key) ?? '#8A9A93',
              percent: c.percent,
            })),
        };
      }),
    };
  }
}

function publicOffice(o: OfficeRow): OfficeInfo {
  return { code: o.code, slug: o.slug, name: o.name, kind: o.kind, scope: o.scope, states: o.states };
}

/** Evenly thins a series, always keeping the first and last points. */
export function downsample<T>(rows: T[], max: number): T[] {
  if (rows.length <= max) return rows;
  const step = (rows.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => rows[Math.round(i * step)]!);
}

/** "SÃO JOSÉ DOS CAMPOS" → "São José dos Campos". The TSE publishes names in upper case. */
export function titleCase(name: string): string {
  const small = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);
  return name
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1)))
    .join(' ')
    .replace(/-(\p{L})/gu, (_, c: string) => `-${c.toLocaleUpperCase('pt-BR')}`);
}
