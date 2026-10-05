import { getState } from '@eleicoes/election-core';
import type { DemoCandidate, DemoCity, DemoModel, DemoOffice } from './model';

/**
 * Renders the demo model as TSE 2026 files (EA11, EA12, EA14, EA15, EA20), following the
 * published specification: every value is text, percentages come as "48,32" and as a
 * 9-decimal number, dates as dd/mm/aaaa and hh:mm:ss in Brasília time.
 */

const p2 = (v: number) => v.toFixed(2).replace('.', ',');
const p9 = (v: number) => (v === 0 || v === 100 ? String(v) : v.toFixed(9));
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const s = (n: number) => String(Math.round(n));

function brasilia(ms: number | null): { d: string; h: string } {
  if (ms == null) return { d: '', h: '' };
  const local = new Date(ms - 3 * 3600_000);
  const iso = local.toISOString();
  return { d: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`, h: iso.slice(11, 19) };
}

interface Tally {
  sections: number;
  counted: number;
  electorate: number;
  electorateCounted: number;
  turnout: number;
  /** ms timestamp of the last change, null when nothing counted. */
  changedAt: number | null;
  complete: boolean;
}

interface VoteTally {
  tv: number;
  vb: number;
  tvn: number;
  vl: number;
  candidates: Map<string, number>;
  partyLegend: Map<string, number>;
}

export interface Clock {
  /** Elapsed fraction of the count, quantised to ticks. */
  f: number;
  /** ms timestamp of the current tick. */
  now: number;
  /** ms timestamp when counting started. */
  start: number;
  durationMs: number;
  tick: number;
}

export class DemoFiles {
  constructor(
    private readonly model: DemoModel,
    private readonly clock: () => Clock,
  ) {}

  private tallyCity(city: DemoCity, c: Clock): Tally {
    const frac = this.model.cityFraction(city, c.f);
    const counted = Math.floor(city.sections * frac);
    const electorateCounted = Math.round((city.electorate * counted) / city.sections);
    const complete = counted === city.sections;
    return {
      sections: city.sections,
      counted,
      electorate: city.electorate,
      electorateCounted,
      turnout: Math.round(electorateCounted * city.turnoutRate),
      changedAt: counted === 0 ? null : complete ? Math.min(c.now, c.start + city.end * c.durationMs) : c.now,
      complete,
    };
  }

  private sum(cities: DemoCity[], c: Clock): Tally {
    const t: Tally = {
      sections: 0,
      counted: 0,
      electorate: 0,
      electorateCounted: 0,
      turnout: 0,
      changedAt: null,
      complete: true,
    };
    for (const city of cities) {
      const x = this.tallyCity(city, c);
      t.sections += x.sections;
      t.counted += x.counted;
      t.electorate += x.electorate;
      t.electorateCounted += x.electorateCounted;
      t.turnout += x.turnout;
      t.complete &&= x.complete;
      if (x.changedAt != null) t.changedAt = Math.max(t.changedAt ?? 0, x.changedAt);
    }
    return t;
  }

  private votes(office: DemoOffice, cities: DemoCity[], c: Clock): VoteTally {
    const v: VoteTally = { tv: 0, vb: 0, tvn: 0, vl: 0, candidates: new Map(), partyLegend: new Map() };
    for (const city of cities) {
      const t = this.tallyCity(city, c);
      const tv = t.turnout * office.votesPerVoter;
      const vb = Math.round(tv * office.blankRate);
      const tvn = Math.round(tv * office.nullRate);
      const vv = tv - vb - tvn;
      const vl = Math.round(vv * office.legendRate);
      const nominal = vv - vl;
      const list = this.model.candidatesFor(office, city.uf);
      const shares = this.model.shares(office, city);
      let assigned = 0;
      list.forEach((cand, i) => {
        const n = Math.floor(nominal * shares[i]!);
        assigned += n;
        v.candidates.set(cand.key, (v.candidates.get(cand.key) ?? 0) + n);
      });
      const top = list[shares.indexOf(Math.max(...shares))]!;
      v.candidates.set(top.key, v.candidates.get(top.key)! + (nominal - assigned));
      if (vl > 0) {
        const byParty = new Map<string, number>();
        list.forEach((cand, i) => {
          byParty.set(cand.party, (byParty.get(cand.party) ?? 0) + shares[i]!);
        });
        let legendAssigned = 0;
        const entries = [...byParty.entries()];
        entries.forEach(([party, share], i) => {
          const n = i === entries.length - 1 ? vl - legendAssigned : Math.floor(vl * share);
          legendAssigned += n;
          v.partyLegend.set(party, (v.partyLegend.get(party) ?? 0) + n);
        });
      }
      v.tv += tv;
      v.vb += vb;
      v.tvn += tvn;
      v.vl += vl;
    }
    return v;
  }

  private sectionsBlock(t: Tally) {
    const snt = t.sections - t.counted;
    return {
      ts: s(t.sections),
      st: s(t.counted),
      pst: p2(pct(t.counted, t.sections)),
      pstn: p9(pct(t.counted, t.sections)),
      snt: s(snt),
      psnt: p2(pct(snt, t.sections)),
      psntn: p9(pct(snt, t.sections)),
      si: s(t.counted),
      psi: p2(t.counted ? 100 : 0),
      psin: p9(t.counted ? 100 : 0),
      sni: '0',
      psni: '0,00',
      psnin: '0',
      sa: s(t.counted),
      psa: p2(t.counted ? 100 : 0),
      psan: p9(t.counted ? 100 : 0),
      sna: '0',
      psna: '0,00',
      psnan: '0',
    };
  }

  private electorateBlock(t: Tally) {
    const a = t.electorateCounted - t.turnout;
    return {
      te: s(t.electorate),
      est: s(t.electorateCounted),
      pest: p2(pct(t.electorateCounted, t.electorate)),
      pestn: p9(pct(t.electorateCounted, t.electorate)),
      esnt: s(t.electorate - t.electorateCounted),
      esi: s(t.electorateCounted),
      esni: '0',
      esa: s(t.electorateCounted),
      esna: '0',
      c: s(t.turnout),
      pc: p2(pct(t.turnout, t.electorateCounted)),
      pcn: p9(pct(t.turnout, t.electorateCounted)),
      a: s(a),
      pa: p2(pct(a, t.electorateCounted)),
      pan: p9(pct(a, t.electorateCounted)),
    };
  }

  private header(c: Clock) {
    const g = brasilia(c.now);
    return { f: 's', dg: g.d, hg: g.h, idg: String(900_000_000 + c.tick) };
  }

  private status(t: Tally, final: boolean) {
    return final ? 'f' : t.counted === 0 ? 'n' : t.complete ? 'f' : 'p';
  }

  // ------------------------------------------------------------------ EA11 / EA12

  electionConfig() {
    const { pleito, cycle, date, elections } = this.model.fixture;
    const dir = '<base>/<ambiente>/<ciclo>/<cd_eleicao>/dados/<uf>';
    return {
      dg: date,
      hg: '08:00:00',
      idg: '900000001',
      f: 's',
      arq: [
        { tp: 'u', dir },
        { tp: 'ab', dir },
        { tp: 'cm', dir: '<base>/<ambiente>/<ciclo>/<cd_eleicao>/config' },
      ],
      pl: [
        {
          cd: pleito,
          cdpr: '9000',
          c: cycle,
          dt: date,
          dtlim: '31/12/2026',
          e: [
            {
              cd: elections.federal,
              sqele: '1',
              nm: 'Eleição Demonstrativa Federal',
              t: String(this.model.round),
              tp: '8',
              abr: [{ cd: 'br', cp: [{ cd: '1', ds: 'Presidente', tp: '1' }] }],
            },
            {
              cd: elections.state,
              sqele: '2',
              nm: 'Eleição Demonstrativa Estadual',
              t: String(this.model.round),
              tp: '1',
              // Like the real TSE: the 1st round lists state offices once for 'br'; the runoff
              // lists them state by state, only where there is a runoff.
              abr:
                this.model.round === 2
                  ? this.model
                      .statesWithCities()
                      .filter((uf) => uf !== 'ZZ')
                      .flatMap((uf) => {
                        const cp = this.model.offices
                          .filter((o) => o.election === elections.state && o.appliesTo(uf))
                          .map((o) => ({ cd: o.code, ds: o.name, tp: '1' }));
                        return cp.length ? [{ cd: uf.toLowerCase(), cp }] : [];
                      })
                  : [
                      {
                        cd: 'br',
                        cp: this.model.offices
                          .filter((o) => o.election === elections.state)
                          .map((o) => ({
                            cd: o.code,
                            ds: o.name,
                            tp: o.kind === 'majoritarian' ? '1' : '2',
                          })),
                      },
                    ],
            },
          ],
        },
      ],
    };
  }

  cityConfig() {
    return {
      dg: this.model.fixture.date,
      hg: '08:00:00',
      idg: '900000002',
      f: 's',
      abr: this.model.statesWithCities().map((uf) => ({
        cd: uf.toLowerCase(),
        ds: getState(uf)!.name.toUpperCase(),
        mu: this.model.cities
          .filter((c) => c.uf === uf)
          .map((c) => ({ cd: c.code, cdi: '', nm: c.name, c: c.capital ? 's' : 'n', z: ['0001'] })),
      })),
    };
  }

  // ------------------------------------------------------------------ EA14 / EA15

  countryProgress(ele: string) {
    const c = this.clock();
    const entry = (tpabr: string, cdabr: string, t: Tally) => {
      const when = brasilia(t.changedAt);
      return {
        and: this.status(t, false),
        tpabr,
        cdabr,
        dt: when.d,
        ht: when.h,
        s: this.sectionsBlock(t),
        e: this.electorateBlock(t),
      };
    };
    return {
      ele,
      t: String(this.model.round),
      ...this.header(c),
      abr: [
        entry('br', 'br', this.sum(this.model.cities, c)),
        ...this.model.statesWithCities().map((uf) =>
          entry(
            'uf',
            uf.toLowerCase(),
            this.sum(
              this.model.cities.filter((x) => x.uf === uf),
              c,
            ),
          ),
        ),
      ],
    };
  }

  stateProgress(ele: string, uf: string) {
    const c = this.clock();
    const cities = this.model.cities.filter((x) => x.uf === uf.toUpperCase());
    if (cities.length === 0) return null;
    const entry = (tpabr: string, cdabr: string, t: Tally) => {
      const when = brasilia(t.changedAt);
      return {
        and: this.status(t, false),
        tpabr,
        cdabr,
        dt: when.d,
        ht: when.h,
        s: this.sectionsBlock(t),
        e: this.electorateBlock(t),
      };
    };
    return {
      ele,
      t: String(this.model.round),
      ...this.header(c),
      abr: [
        entry('uf', uf, this.sum(cities, c)),
        ...cities.map((x) => entry('mu', x.code, this.sum([x], c))),
      ],
    };
  }

  // ------------------------------------------------------------------ EA20

  result(ele: string, officeCode: string, scope: { uf: string | null; city: string | null }) {
    const office = this.model.officeByCode(officeCode);
    if (!office || office.election !== ele) return null;
    const c = this.clock();
    const uf = scope.uf?.toUpperCase() ?? null;
    if (uf && !office.appliesTo(uf)) return null;
    if (!uf && office.code !== '1') return null;
    const cities = this.model.cities.filter(
      (x) => (!uf || x.uf === uf) && (!scope.city || x.code === scope.city),
    );
    if (cities.length === 0) return null;

    const t = this.sum(cities, c);
    // The race is decided in its "home" area: Brazil for president, the state otherwise.
    const home = office.code === '1' ? this.model.cities : this.model.cities.filter((x) => x.uf === uf);
    const homeTally = this.sum(home, c);
    const final = homeTally.complete && c.now - (homeTally.changedAt ?? c.now) >= 10_000;
    const areaFinal = final && !scope.city;
    const v = this.votes(office, cities, c);
    const vv = v.tv - v.vb - v.tvn;
    const homeVotes = final ? this.votes(office, home, c) : null;
    const elected = homeVotes ? this.electedKeys(office, uf ?? '', homeVotes) : null;

    const list = this.model.candidatesFor(office, uf ?? 'BR');
    const byParty = new Map<string, DemoCandidate[]>();
    for (const cand of list) byParty.set(cand.party, [...(byParty.get(cand.party) ?? []), cand]);
    const seats = office.seats(uf ?? '');

    const when = brasilia(t.changedAt);
    const g = this.header(c);
    return {
      ele,
      t: String(this.model.round),
      ...g,
      sup: 'n',
      tpabr: scope.city ? 'mu' : uf ? 'uf' : 'br',
      cdabr: scope.city ?? (uf ? uf.toLowerCase() : 'br'),
      dv: 's',
      dt: when.d,
      ht: when.h,
      tf: areaFinal ? 's' : 'n',
      and: this.status(t, areaFinal),
      md: 'n',
      esae: 'n',
      mnae: [],
      carg: [
        {
          cd: office.code,
          nmn: office.name,
          nmm: office.name,
          nmf: office.name === 'Presidente' ? 'Presidenta' : office.name,
          nv: String(seats),
          ...(office.kind === 'proportional' && !scope.city && vv > 0 ? { qe: s(vv / seats) } : {}),
          fed: [],
          agr: [...byParty.entries()].map(([partyNumber, cands]) => {
            const party = this.model.fixture.parties.find((p) => p.n === partyNumber)!;
            const nominal = cands.reduce((sum, x) => sum + (v.candidates.get(x.key) ?? 0), 0);
            const legend = v.partyLegend.get(partyNumber) ?? 0;
            return {
              n: party.n,
              nm: party.nm,
              tp: 'i',
              vag:
                office.kind === 'proportional' && elected
                  ? s(cands.filter((x) => elected.has(x.key)).length)
                  : undefined,
              par: [
                {
                  n: party.n,
                  sg: party.sg,
                  nm: party.nm,
                  dvt: 'Válido (legenda)',
                  tvtn: s(nominal),
                  tvan: s(nominal),
                  ...(office.kind === 'proportional' ? { tvtl: s(legend), tval: s(legend) } : {}),
                  cand: cands.map((x, i) => {
                    const votes = v.candidates.get(x.key) ?? 0;
                    const isElected = elected?.has(x.key) ?? false;
                    return {
                      n: x.n,
                      sqcand: x.key,
                      nm: x.name.toUpperCase(),
                      nmu: x.name.toUpperCase(),
                      dt: '01/01/1970',
                      dvt: 'Válido',
                      seq: String(i + 1),
                      e: isElected ? 's' : 'n',
                      st: final ? this.situation(office, isElected, elected!) : '',
                      vap: s(votes),
                      pvap: p2(pct(votes, vv)),
                      pvapn: p9(pct(votes, vv)),
                      vs: x.vice
                        ? [
                            {
                              tp: office.code === '5' ? 's1' : 'v',
                              sqcand: `${x.key}1`,
                              nm: x.vice.toUpperCase(),
                              nmu: x.vice.toUpperCase(),
                              sgp: party.sg,
                            },
                          ]
                        : [],
                    };
                  }),
                },
              ],
            };
          }),
        },
      ],
      s: this.sectionsBlock(t),
      e: this.electorateBlock(t),
      v: {
        tv: s(v.tv),
        vvc: s(vv),
        pvvc: p2(pct(vv, v.tv)),
        pvvcn: p9(pct(vv, v.tv)),
        vv: s(vv),
        pvv: p2(vv ? 100 : 0),
        pvvn: p9(vv ? 100 : 0),
        vnom: s(vv - v.vl),
        pvnom: p2(pct(vv - v.vl, vv)),
        pvnomn: p9(pct(vv - v.vl, vv)),
        ...(office.kind === 'proportional'
          ? { vl: s(v.vl), pvl: p2(pct(v.vl, vv)), pvln: p9(pct(v.vl, vv)) }
          : {}),
        van: '0',
        pvan: '0,00',
        pvann: '0',
        vansj: '0',
        pvansj: '0,00',
        pvansjn: '0',
        vscv: '0',
        vb: s(v.vb),
        pvb: p2(pct(v.vb, v.tv)),
        pvbn: p9(pct(v.vb, v.tv)),
        tvn: s(v.tvn),
        ptvn: p2(pct(v.tvn, v.tv)),
        ptvnn: p9(pct(v.tvn, v.tv)),
        vn: s(v.tvn),
        pvn: p2(v.tvn ? 100 : 0),
        pvnn: p9(v.tvn ? 100 : 0),
        vnt: '0',
        pvnt: '0,00',
        pvntn: '0',
      },
    };
  }

  /** Majoritarian: absolute majority elects, otherwise top two go to a runoff. Proportional: top N. */
  private electedKeys(office: DemoOffice, uf: string, v: VoteTally): Set<string> & { runoff?: boolean } {
    const ranked = [...v.candidates.entries()].sort((a, b) => b[1] - a[1]);
    const seats = office.seats(uf);
    if (office.code === '1' || office.code === '3') {
      const valid = v.tv - v.vb - v.tvn;
      const top = ranked[0]!;
      if (top[1] * 2 > valid) return new Set([top[0]]);
      const set: Set<string> & { runoff?: boolean } = new Set(ranked.slice(0, 2).map((r) => r[0]));
      set.runoff = true;
      return set;
    }
    return new Set(ranked.slice(0, seats).map((r) => r[0]));
  }

  private situation(office: DemoOffice, isElected: boolean, elected: Set<string> & { runoff?: boolean }) {
    if (elected.runoff) return isElected ? '2º turno' : 'Não eleito';
    if (office.kind === 'proportional') return isElected ? 'Eleito por QP' : 'Suplente';
    return isElected ? 'Eleito' : 'Não eleito';
  }
}
