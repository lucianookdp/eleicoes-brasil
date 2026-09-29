import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATES, type StateCode } from '@eleicoes/election-core';

/**
 * Deterministic model of a FICTITIOUS election used by the demo TSE server. Every number is a
 * pure function of (seed, elapsed fraction), so restarts and multiple readers agree.
 */

interface Fixture {
  pleito: string;
  cycle: string;
  date: string;
  elections: { federal: string; state: string };
  seed: number;
  parties: { n: string; sg: string; nm: string }[];
  president: {
    n: string;
    party: string;
    name: string;
    vice: string;
    base: number;
    bias: Record<string, number>;
    capital: number;
  }[];
  names: { first: string[]; last: string[] };
  states: Record<string, [string, number][]>;
}

export interface DemoCity {
  uf: StateCode;
  region: string;
  code: string;
  name: string;
  capital: boolean;
  electorate: number;
  sections: number;
  turnoutRate: number;
  start: number;
  end: number;
}

export interface DemoCandidate {
  key: string;
  n: string;
  name: string;
  party: string;
  vice: string | null;
  /** Relative weight before per-city noise. */
  weight: number;
  bias: Record<string, number>;
  capitalBias: number;
}

export interface DemoOffice {
  code: string;
  name: string;
  election: string;
  kind: 'majoritarian' | 'proportional';
  /** Votes per voter (senators: 2 in 2026). */
  votesPerVoter: number;
  seats: (uf: string) => number;
  appliesTo: (uf: string) => boolean;
  blankRate: number;
  nullRate: number;
  legendRate: number;
}

const DEP_FED_SEATS: Record<string, number> = {
  SP: 70,
  MG: 53,
  RJ: 46,
  BA: 39,
  RS: 31,
  PR: 30,
  PE: 25,
  CE: 22,
  MA: 18,
  GO: 17,
  PA: 17,
  SC: 16,
  PB: 12,
  ES: 10,
  PI: 10,
  AL: 9,
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Stable pseudo-random number in [0, 1) for a label. */
export const noise = (label: string) => mulberry32(hash(label))();

export class DemoModel {
  readonly fixture: Fixture;
  readonly cities: DemoCity[] = [];
  readonly offices: DemoOffice[];
  private readonly candidates = new Map<string, DemoCandidate[]>();

  constructor(
    fixturePath = process.env.DEMO_FIXTURE ??
      join(import.meta.dirname, '../../../../fixtures/election-demo/election.json'),
  ) {
    this.fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as Fixture;
    const { federal, state } = this.fixture.elections;

    STATES.forEach((s, si) => {
      const list = this.fixture.states[s.code];
      if (!list) return;
      list.forEach(([name, thousands], ci) => {
        const label = `${s.code}:${name}`;
        const capital = ci === 0;
        // Capitals report early; the interior trickles in later.
        const start = capital ? noise(`${label}:s`) * 0.08 : 0.05 + noise(`${label}:s`) * 0.35;
        const electorate = Math.round(thousands * 1000 * (0.97 + noise(`${label}:e`) * 0.06));
        this.cities.push({
          uf: s.code,
          region: s.region,
          code: String(10000 + si * 1000 + ci * 10).padStart(5, '0'),
          name: name.toUpperCase(),
          capital,
          electorate,
          sections: Math.max(1, Math.round(electorate / 330)),
          turnoutRate: 0.74 + noise(`${label}:t`) * 0.12,
          start,
          end: Math.min(1, start + 0.45 + noise(`${label}:d`) * 0.3),
        });
      });
    });

    const all = () => true;
    this.offices = [
      {
        code: '1',
        name: 'Presidente',
        election: federal,
        kind: 'majoritarian',
        votesPerVoter: 1,
        seats: () => 1,
        appliesTo: all,
        blankRate: 0.02,
        nullRate: 0.035,
        legendRate: 0,
      },
      {
        code: '3',
        name: 'Governador',
        election: state,
        kind: 'majoritarian',
        votesPerVoter: 1,
        seats: () => 1,
        appliesTo: all,
        blankRate: 0.03,
        nullRate: 0.05,
        legendRate: 0,
      },
      {
        code: '5',
        name: 'Senador',
        election: state,
        kind: 'majoritarian',
        votesPerVoter: 2,
        seats: () => 2,
        appliesTo: all,
        blankRate: 0.06,
        nullRate: 0.06,
        legendRate: 0,
      },
      {
        code: '6',
        name: 'Deputado Federal',
        election: state,
        kind: 'proportional',
        votesPerVoter: 1,
        seats: (uf) => Math.min(8, DEP_FED_SEATS[uf] ?? 8),
        appliesTo: all,
        blankRate: 0.04,
        nullRate: 0.05,
        legendRate: 0.08,
      },
      {
        code: '7',
        name: 'Deputado Estadual',
        election: state,
        kind: 'proportional',
        votesPerVoter: 1,
        seats: () => 8,
        appliesTo: (uf) => uf !== 'DF',
        blankRate: 0.04,
        nullRate: 0.05,
        legendRate: 0.07,
      },
      {
        code: '8',
        name: 'Deputado Distrital',
        election: state,
        kind: 'proportional',
        votesPerVoter: 1,
        seats: () => 8,
        appliesTo: (uf) => uf === 'DF',
        blankRate: 0.04,
        nullRate: 0.05,
        legendRate: 0.07,
      },
    ];
  }

  statesWithCities(): StateCode[] {
    return [...new Set(this.cities.map((c) => c.uf))];
  }

  officeByCode(code: string) {
    return this.offices.find((o) => o.code === String(Number(code)));
  }

  /** Candidates of an office in a state (president: same list everywhere). */
  candidatesFor(office: DemoOffice, uf: string): DemoCandidate[] {
    const key = office.code === '1' ? '1' : `${office.code}:${uf}`;
    let list = this.candidates.get(key);
    if (!list) {
      list = office.code === '1' ? this.presidentCandidates() : this.generated(office, uf);
      this.candidates.set(key, list);
    }
    return list;
  }

  private presidentCandidates(): DemoCandidate[] {
    return this.fixture.president.map((p) => ({
      key: `9000${p.n}`,
      n: p.n,
      name: p.name,
      party: p.party,
      vice: p.vice,
      weight: p.base,
      bias: p.bias,
      capitalBias: p.capital,
    }));
  }

  private generated(office: DemoOffice, uf: string): DemoCandidate[] {
    const rand = mulberry32(hash(`${this.fixture.seed}:${office.code}:${uf}`));
    const count =
      office.code === '3'
        ? 3 + Math.floor(rand() * 2)
        : office.code === '5'
          ? 4 + Math.floor(rand() * 2)
          : 18;
    const { first, last } = this.fixture.names;
    const out: DemoCandidate[] = [];
    const usedNumbers = new Set<string>();
    for (let i = 0; i < count; i++) {
      const party = this.fixture.parties[(i + Math.floor(rand() * 6)) % 6]!;
      let n: string;
      if (office.code === '3') n = party.n;
      else if (office.code === '5') n = `${party.n}${i + 1}`;
      else n = `${party.n}${String(i + 1).padStart(office.code === '6' ? 2 : 3, '0')}`;
      if (usedNumbers.has(n)) n = `${n.slice(0, -1)}${(i + 5) % 10}`;
      usedNumbers.add(n);
      const name = `${first[Math.floor(rand() * first.length)]} ${last[Math.floor(rand() * last.length)]}`;
      out.push({
        key: `9${String(hash(`${office.code}:${uf}:${i}`))
          .padStart(10, '0')
          .slice(0, 10)}`,
        n,
        name,
        party: party.n,
        vice:
          office.kind === 'majoritarian'
            ? `${first[Math.floor(rand() * first.length)]} ${last[Math.floor(rand() * last.length)]}`
            : null,
        weight: office.kind === 'proportional' ? 1 / (1 + i * 0.35) + rand() * 0.3 : 10 + rand() * 30,
        bias: {},
        capitalBias: (rand() - 0.5) * 6,
      });
    }
    // Governors: the same party cannot run twice in a state.
    if (office.code === '3') return [...new Map(out.map((c) => [c.party, c])).values()];
    return out;
  }

  /** Final vote shares of each candidate in a city (sum 1). */
  shares(office: DemoOffice, city: DemoCity): number[] {
    const list = this.candidatesFor(office, city.uf);
    const w = list.map((c) =>
      Math.max(
        0.2,
        c.weight * (office.kind === 'proportional' ? 10 : 1) +
          (c.bias[city.region] ?? 0) +
          (city.capital ? c.capitalBias : 0) +
          (noise(`${office.code}:${city.code}:${c.key}`) - 0.5) * (office.kind === 'proportional' ? 4 : 6),
      ),
    );
    const sum = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / sum);
  }

  /** Fraction [0, 1] of the city's sections counted at elapsed fraction f of the count. */
  cityFraction(city: DemoCity, f: number): number {
    if (f <= city.start) return 0;
    if (f >= city.end) return 1;
    const x = (f - city.start) / (city.end - city.start);
    // Ease-out: most ballot boxes arrive early, the last ones trickle in.
    return 1 - (1 - x) ** 1.6;
  }
}
