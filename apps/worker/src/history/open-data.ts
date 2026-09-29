import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import {
  type AreaRef,
  area,
  type CandidateResult,
  type CountingProgress,
  emptyProgress,
  isStateCode,
  type Office,
  type OfficeKind,
  type OfficeScope,
  type PartyResult,
  percent,
  type StateCode,
  slugify,
  type VoteTotals,
} from '@eleicoes/election-core';

/**
 * Reads final results of past elections from the TSE Open Data Portal
 * (https://dadosabertos.tse.jus.br): "Votação nominal por município e zona"
 * (votacao_candidato_munzona_<ANO>_<UF>.csv) and "Detalhe da apuração por município e zona"
 * (detalhe_votacao_munzona_<ANO>_<UF>.csv). Files are ";"-separated, quoted, Latin-1.
 *
 * Only final numbers exist in these files: an imported election has one snapshot per area.
 * Columns are read by name, so the importer tolerates column additions between years.
 */

const OFFICES: Record<string, { slug: string; kind: OfficeKind; scope: OfficeScope }> = {
  '1': { slug: 'presidente', kind: 'majoritarian', scope: 'country' },
  '3': { slug: 'governador', kind: 'majoritarian', scope: 'state' },
  '5': { slug: 'senador', kind: 'majoritarian', scope: 'state' },
  '6': { slug: 'deputado-federal', kind: 'proportional', scope: 'state' },
  '7': { slug: 'deputado-estadual', kind: 'proportional', scope: 'state' },
  '8': { slug: 'deputado-distrital', kind: 'proportional', scope: 'state' },
  '11': { slug: 'prefeito', kind: 'majoritarian', scope: 'city' },
  '13': { slug: 'vereador', kind: 'proportional', scope: 'city' },
};

/** Splits one CSV line with ";" separators and '"' quotes (no embedded newlines in these files). */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ';') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export async function* readCsv(path: string): AsyncGenerator<Record<string, string>> {
  const lines = createInterface({
    input: createReadStream(path, { encoding: 'latin1' }),
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  let header: string[] | null = null;
  for await (const line of lines) {
    if (!line.trim()) continue;
    const cells = splitCsvLine(line);
    if (!header) {
      header = cells.map((h) => h.trim().toUpperCase());
      continue;
    }
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim();
    });
    yield row;
  }
}

const int = (v: string | undefined) => {
  if (v == null || v === '' || v === '#NULO#' || v === '#NE#') return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const first = (row: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) if (row[k] != null && row[k] !== '') return row[k];
  return undefined;
};
const isOrdinary = (row: Record<string, string>) =>
  !/suplementar/i.test(row.NM_TIPO_ELEICAO ?? '') && row.CD_TIPO_ELEICAO !== '1';

interface CandidateAgg {
  key: string;
  number: string;
  name: string;
  ballotName: string;
  party: { number: string; abbreviation: string; name: string };
  coalition: string | null;
  status: string | null;
  votesByArea: Map<string, number>;
}

interface DetailAgg {
  electorate: number | null;
  turnout: number | null;
  abstention: number | null;
  sections: number | null;
  blank: number | null;
  null: number | null;
  valid: number | null;
  legend: number | null;
}

export interface ImportedRound {
  year: number;
  /** ISO date of election day, from DT_ELEICAO. */
  date: string | null;
  round: 1 | 2;
  kind: 'general' | 'municipal';
  offices: Office[];
  cities: Map<string, { state: StateCode; code: string; name: string }>;
  /** Final progress per area key. */
  progress: Map<string, { area: AreaRef; progress: CountingProgress }>;
  /** Final results per `${officeCode}|${areaKey}`. */
  results: Map<
    string,
    {
      office: Office;
      area: AreaRef;
      votes: VoteTotals;
      candidates: CandidateResult[];
      parties: PartyResult[];
    }
  >;
}

const ELECTED = /^(eleito|eleito por qp|eleito por m[eé]dia|2[ºo°] turno)$/i;

/**
 * Aggregates zone-level rows into city, state and country totals.
 * Returns one ImportedRound per turno found in the files.
 */
export async function aggregateOpenData(
  candidateFiles: string[],
  detailFiles: string[],
): Promise<ImportedRound[]> {
  const rounds = new Map<string, ImportedRound>();
  const candidates = new Map<string, Map<string, CandidateAgg>>(); // turno → key → agg
  const details = new Map<string, Map<string, DetailAgg>>(); // turno → office|area → totals

  const roundFor = (row: Record<string, string>) => {
    const turno = row.NR_TURNO === '2' ? 2 : 1;
    const year = Number(row.ANO_ELEICAO);
    let r = rounds.get(String(turno));
    if (!r) {
      const d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(row.DT_ELEICAO ?? '');
      r = {
        year,
        date: d ? `${d[3]}-${d[2]}-${d[1]}` : null,
        round: turno,
        kind: 'general',
        offices: [],
        cities: new Map(),
        progress: new Map(),
        results: new Map(),
      };
      rounds.set(String(turno), r);
      candidates.set(String(turno), new Map());
      details.set(String(turno), new Map());
    }
    return r;
  };
  const officeFor = (r: ImportedRound, row: Record<string, string>): Office | null => {
    const code = String(Number(row.CD_CARGO));
    if (!code || code === 'NaN') return null;
    let o = r.offices.find((x) => x.code === code);
    if (!o) {
      const known = OFFICES[code];
      const name = titleOffice(row.DS_CARGO ?? code);
      o = {
        code,
        slug: known?.slug ?? slugify(name),
        name,
        kind: known?.kind ?? 'majoritarian',
        scope: known?.scope ?? 'state',
        providerElectionCode: row.CD_ELEICAO ?? code,
        states: code === '8' ? ['DF'] : null,
      };
      r.offices.push(o);
      if (o.scope === 'city') r.kind = 'municipal';
    }
    return o;
  };
  /** Areas a candidate's votes roll up to: no state totals for mayors, no national totals for governors. */
  const areasFor = (office: Office, uf: StateCode, city: string) => {
    const list: AreaRef[] = [area.city(uf, city)];
    if (office.scope !== 'city') list.push(area.state(uf));
    if (office.scope === 'country') list.push(area.country());
    return list;
  };
  /** Turnout and blank/null totals always roll up to every level (they drive progress). */
  const allAreas = (uf: StateCode, city: string) => [area.city(uf, city), area.state(uf), area.country()];

  for (const file of candidateFiles) {
    for await (const row of readCsv(file)) {
      if (!isOrdinary(row)) continue;
      const uf = (row.SG_UF ?? '').toUpperCase();
      if (!isStateCode(uf)) continue;
      const r = roundFor(row);
      const office = officeFor(r, row);
      if (!office) continue;
      const cityCode = (row.CD_MUNICIPIO ?? '').padStart(5, '0');
      r.cities.set(`${uf}-${cityCode}`, { state: uf, code: cityCode, name: row.NM_MUNICIPIO ?? cityCode });
      const key = row.SQ_CANDIDATO || `${office.code}-${uf}-${row.NR_CANDIDATO}`;
      const bucket = candidates.get(String(r.round))!;
      const aggKey = `${office.code}|${key}`;
      let c = bucket.get(aggKey);
      if (!c) {
        c = {
          key,
          number: row.NR_CANDIDATO ?? '',
          name: row.NM_CANDIDATO ?? row.NM_URNA_CANDIDATO ?? '',
          ballotName: row.NM_URNA_CANDIDATO ?? row.NM_CANDIDATO ?? '',
          party: {
            number: row.NR_PARTIDO ?? '',
            abbreviation: row.SG_PARTIDO ?? '',
            name: row.NM_PARTIDO ?? '',
          },
          coalition: first(row, 'DS_COMPOSICAO_COLIGACAO', 'DS_COMPOSICAO_FEDERACAO', 'NM_COLIGACAO') ?? null,
          status: row.DS_SIT_TOT_TURNO ?? null,
          votesByArea: new Map(),
        };
        bucket.set(aggKey, c);
      }
      const votes = int(first(row, 'QT_VOTOS_NOMINAIS_VALIDOS', 'QT_VOTOS_NOMINAIS')) ?? 0;
      for (const a of areasFor(office, uf, cityCode))
        c.votesByArea.set(a.key, (c.votesByArea.get(a.key) ?? 0) + votes);
    }
  }

  for (const file of detailFiles) {
    for await (const row of readCsv(file)) {
      if (!isOrdinary(row)) continue;
      const uf = (row.SG_UF ?? '').toUpperCase();
      if (!isStateCode(uf)) continue;
      const r = roundFor(row);
      const office = officeFor(r, row);
      if (!office) continue;
      const cityCode = (row.CD_MUNICIPIO ?? '').padStart(5, '0');
      const bucket = details.get(String(r.round))!;
      const add = (a: number | null, b: number | null) =>
        a == null && b == null ? null : (a ?? 0) + (b ?? 0);
      for (const a of allAreas(uf, cityCode)) {
        const k = `${office.code}|${a.key}`;
        const prev = bucket.get(k) ?? {
          electorate: null,
          turnout: null,
          abstention: null,
          sections: null,
          blank: null,
          null: null,
          valid: null,
          legend: null,
        };
        bucket.set(k, {
          electorate: add(prev.electorate, int(row.QT_APTOS)),
          turnout: add(prev.turnout, int(row.QT_COMPARECIMENTO)),
          abstention: add(prev.abstention, int(row.QT_ABSTENCOES)),
          sections: add(prev.sections, int(first(row, 'QT_SECOES', 'QT_SECOES_PRINCIPAIS'))),
          blank: add(prev.blank, int(row.QT_VOTOS_BRANCOS)),
          null: add(prev.null, int(first(row, 'QT_TOTAL_VOTOS_NULOS', 'QT_VOTOS_NULOS'))),
          valid: add(prev.valid, int(row.QT_VOTOS_VALIDOS)),
          legend: add(prev.legend, int(first(row, 'QT_VOTOS_LEGENDA_VALIDOS', 'QT_VOTOS_LEGENDA'))),
        });
      }
    }
  }

  for (const r of rounds.values()) {
    const bucket = candidates.get(String(r.round))!;
    const det = details.get(String(r.round))!;
    // Progress: from the office that every voter votes for (president / mayor), else the first.
    const progressOffice =
      r.offices.find((o) => o.code === '1') ?? r.offices.find((o) => o.code === '11') ?? r.offices[0];
    for (const [k, d] of det) {
      const [code, areaKey] = k.split('|') as [string, string];
      if (code !== progressOffice?.code) continue;
      const a = parseKey(areaKey);
      if (!a) continue;
      r.progress.set(areaKey, {
        area: a,
        progress: {
          ...emptyProgress(),
          status: 'finished',
          sectionsTotal: d.sections,
          sectionsCounted: d.sections,
          sectionsCountedPct: 100,
          electorateTotal: d.electorate,
          electorateCounted: d.electorate,
          turnout: d.turnout,
          turnoutPct: percent(d.turnout, d.electorate),
          abstention: d.abstention,
          abstentionPct: percent(d.abstention, d.electorate),
        },
      });
    }

    for (const office of r.offices) {
      const mine = [...bucket.entries()].filter(([k]) => k.startsWith(`${office.code}|`)).map(([, v]) => v);
      const areaKeys = new Set(mine.flatMap((c) => [...c.votesByArea.keys()]));
      for (const areaKey of areaKeys) {
        const a = parseKey(areaKey);
        if (!a) continue;
        const d = det.get(`${office.code}|${areaKey}`);
        const nominal = mine.reduce((s, c) => s + (c.votesByArea.get(areaKey) ?? 0), 0);
        const valid =
          d?.valid ?? (office.kind === 'proportional' && d?.legend != null ? nominal + d.legend : nominal);
        const results: CandidateResult[] = mine
          .filter((c) => c.votesByArea.has(areaKey))
          .map((c) => {
            const votes = c.votesByArea.get(areaKey) ?? 0;
            return {
              key: c.key,
              number: c.number,
              name: c.name,
              ballotName: c.ballotName,
              party: c.party,
              coalition: c.coalition,
              runningMates: [],
              votes,
              percent: percent(votes, valid),
              elected: c.status ? ELECTED.test(c.status) : null,
              status: c.status ? titleOffice(c.status) : null,
              voteDestination: 'Válido',
            };
          });
        const partyMap = new Map<string, PartyResult>();
        for (const c of results) {
          const p = partyMap.get(c.party.number) ?? {
            ...c.party,
            nominalVotes: 0,
            legendVotes: null,
            seats: null,
            federation: null,
          };
          p.nominalVotes = (p.nominalVotes ?? 0) + c.votes;
          if (c.elected && office.kind === 'proportional') p.seats = (p.seats ?? 0) + 1;
          partyMap.set(c.party.number, p);
        }
        const total = d?.blank != null || d?.null != null ? valid + (d?.blank ?? 0) + (d?.null ?? 0) : null;
        r.results.set(`${office.code}|${areaKey}`, {
          office,
          area: a,
          votes: {
            total,
            valid,
            nominal,
            legend: office.kind === 'proportional' ? (d?.legend ?? null) : null,
            blank: d?.blank ?? null,
            null: d?.null ?? null,
            annulled: null,
            annulledSubJudice: null,
          },
          candidates: results,
          parties: [...partyMap.values()],
        });
      }
    }
  }
  return [...rounds.values()].sort((a, b) => a.round - b.round);
}

function parseKey(key: string): AreaRef | null {
  if (key === 'br') return area.country();
  const m = /^([a-z]{2})(?:-(\d{5}))?$/.exec(key);
  if (!m) return null;
  const uf = m[1]!.toUpperCase();
  if (!isStateCode(uf)) return null;
  return m[2] ? area.city(uf, m[2]) : area.state(uf);
}

/** "DEPUTADO FEDERAL" → "Deputado Federal"; "ELEITO POR QP" → "Eleito por QP". */
function titleOffice(text: string): string {
  return text
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((w, i) =>
      w === 'qp'
        ? 'QP'
        : i > 0 && ['por', 'de', 'da', 'do'].includes(w)
          ? w
          : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1),
    )
    .join(' ');
}
