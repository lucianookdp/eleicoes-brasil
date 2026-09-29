/**
 * Colours for candidate series in charts and bars. They identify a candidate consistently
 * across the app; the UI chrome never uses them (status colours are separate).
 * Keyed by party abbreviation as published by the provider.
 */
const PARTY_COLORS: Record<string, string> = {
  PT: '#E5383B',
  PL: '#2F6BFF',
  NOVO: '#F28C28',
  PSD: '#E0B43A',
  MISSÃO: '#14B8A6',
  MISSAO: '#14B8A6',
  PRTB: '#C569D8',
  AVANTE: '#29B6F6',
  DC: '#A1887F',
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
  // Fictitious parties used by the demo election.
  PEX: '#E5383B',
  PMD: '#2F6BFF',
  PTS: '#F28C28',
  PAM: '#14B8A6',
  PPR: '#E0B43A',
  PSM: '#C569D8',
};

/** Distinct fallbacks for parties without a colour or when two candidates collide. */
const FALLBACK = ['#5AA9E6', '#FF9F1C', '#2EC4B6', '#E71D36', '#B388EB', '#8AC926', '#F15BB5', '#00BBF9'];
const NEUTRAL = '#8A9A93';

export function partyColor(abbreviation: string | null | undefined): string | null {
  if (!abbreviation) return null;
  return (
    PARTY_COLORS[abbreviation.replace(/\*+$/, '').trim()] ?? PARTY_COLORS[abbreviation.toUpperCase()] ?? null
  );
}

/**
 * Assigns colours to an already ranked list. The top `highlight` candidates get distinct
 * colours (party colour when free, fallback otherwise); the rest share a neutral grey.
 */
export function assignColors<T extends { key: string; party: { abbreviation: string } }>(
  ranked: T[],
  highlight = 8,
): Map<string, string> {
  const used = new Set<string>();
  const out = new Map<string, string>();
  let fb = 0;
  ranked.forEach((c, i) => {
    if (i >= highlight) {
      out.set(c.key, NEUTRAL);
      return;
    }
    let color = partyColor(c.party.abbreviation);
    if (!color || used.has(color)) {
      while (used.has(FALLBACK[fb % FALLBACK.length]!) && fb < FALLBACK.length * 2) fb++;
      color = FALLBACK[fb++ % FALLBACK.length]!;
    }
    used.add(color);
    out.set(c.key, color);
  });
  return out;
}
