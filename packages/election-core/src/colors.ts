/**
 * Colours for candidate series in charts and bars. They identify a candidate consistently
 * across the app; the UI chrome never uses them (status colours are separate).
 * Keyed by party abbreviation as published by the provider.
 */
const PARTY_COLORS: Record<string, string> = {
  PT: '#E5383B',
  PL: '#2F6BFF',
  // Official colours are yellow and black; amber keeps it apart from NOVO's orange.
  MISSÃO: '#F5A400',
  MISSAO: '#F5A400',
  NOVO: '#F26522',
  PSD: '#E0B43A',
  PRTB: '#C569D8',
  AVANTE: '#29B6F6',
  DC: '#3557A8',
  PCB: '#B23A48',
  PSTU: '#D9534F',
  PCO: '#C0392B',
  UP: '#FF7F50',
  DEMOCRATA: '#7986CB',
  MDB: '#43A047',
  UNIÃO: '#1E88E5',
  UNIAO: '#1E88E5',
  PP: '#3F8EFC',
  REPUBLICANOS: '#1F4E9E',
  PSDB: '#4A90D9',
  PDT: '#EF6F6C',
  PSB: '#F4A259',
  PSOL: '#F6C85F',
  PODE: '#5DAE8B',
  PV: '#3E9B4F',
  REDE: '#26A69A',
  SOLIDARIEDADE: '#FFA000',
  CIDADANIA: '#EC6FA0',
  PCdoB: '#C62828',
  PRD: '#34558B',
  AGIR: '#5C6BC0',
  MOBILIZA: '#A93226',
  PMB: '#D81B60',
  // Fictitious parties used by the demo election.
  PEX: '#E5383B',
  PMD: '#2F6BFF',
  PTS: '#F28C28',
  PAM: '#14B8A6',
  PPR: '#E0B43A',
  PSM: '#C569D8',
};

/** Distinct colours for parties missing from the table above. */
const FALLBACK = ['#5AA9E6', '#FF9F1C', '#2EC4B6', '#E71D36', '#B388EB', '#8AC926', '#F15BB5', '#00BBF9'];
const NEUTRAL = '#8A9A93';

export function partyColor(abbreviation: string | null | undefined): string | null {
  if (!abbreviation) return null;
  return (
    PARTY_COLORS[abbreviation.replace(/\*+$/, '').trim()] ?? PARTY_COLORS[abbreviation.toUpperCase()] ?? null
  );
}

/** Mixes a #RRGGBB colour with white (amount > 0) or black (amount < 0). */
function shade(hex: string, amount: number): string {
  const target = amount > 0 ? 255 : 0;
  const k = Math.abs(amount);
  const channel = (i: number) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16);
    return Math.round(v + (target - v) * k)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`.toUpperCase();
}

/**
 * Every candidate wears their party's colour, whatever their position in the count. A second
 * candidate of the same party in the same race (two Senate seats, for example) gets a lighter
 * shade and a third a darker one, so the bar segments stay distinguishable. Parties without a
 * known colour take a fallback, and grey once those run out.
 */
export function assignColors<T extends { key: string; party: { abbreviation: string } }>(
  ranked: T[],
): Map<string, string> {
  const perParty = new Map<string, number>();
  const usedFallbacks = new Set<string>();
  const out = new Map<string, string>();
  for (const c of ranked) {
    const base = partyColor(c.party.abbreviation);
    if (base) {
      const n = perParty.get(base) ?? 0;
      perParty.set(base, n + 1);
      out.set(c.key, n === 0 ? base : n === 1 ? shade(base, 0.4) : shade(base, -0.3));
      continue;
    }
    const free = FALLBACK.find((f) => !usedFallbacks.has(f));
    if (free) usedFallbacks.add(free);
    out.set(c.key, free ?? NEUTRAL);
  }
  return out;
}
