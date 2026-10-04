const int = new Intl.NumberFormat('pt-BR');
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const pctFmt = new Map<number, Intl.NumberFormat>();

/** "52.381.292"; "—" when the value is unknown (never a fake 0). */
export function fmtInt(v: number | null | undefined): string {
  return v == null ? '—' : int.format(v);
}

/** "31,3 mi" */
export function fmtCompact(v: number | null | undefined): string {
  return v == null ? '—' : compact.format(v);
}

/** "82,47%" */
export function fmtPct(v: number | null | undefined, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return '—';
  let f = pctFmt.get(digits);
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    pctFmt.set(digits, f);
  }
  return `${f.format(v)}%`;
}

/** "+0,04 pp" / "−1,20 pp" */
export function fmtPp(v: number | null | undefined): string | null {
  if (v == null || !Number.isFinite(v) || Math.abs(v) < 0.005) return null;
  const s = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v > 0 ? '+' : '−'}${s} pp`;
}

export function fmtSigned(v: number | null | undefined): string | null {
  if (v == null || v === 0) return null;
  return `${v > 0 ? '+' : '−'}${int.format(Math.abs(v))}`;
}

const SMALL = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

/** The TSE publishes names in upper case: "ANA EXEMPLO DA SILVA" → "Ana Exemplo da Silva". */
export function displayName(name: string): string {
  if (name !== name.toUpperCase()) return name;
  return name
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1)))
    .join(' ');
}

export function initials(name: string): string {
  const parts = displayName(name)
    .split(' ')
    .filter((p) => !SMALL.has(p));
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase();
}

/** "agora", "12 s", "3 min", "2 h" */
export function ago(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 5) return 'agora';
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86_400)} d`;
}

/**
 * The TSE sometimes stamps the national total with a time that has not happened yet (a section
 * abroad reporting its local clock). Never show a time later than when we received the data.
 */
export function shownTime(totalizedAt: string | null | undefined, receivedAt: string | null | undefined) {
  if (!totalizedAt) return null;
  if (receivedAt && Date.parse(totalizedAt) > Date.parse(receivedAt)) return receivedAt;
  return totalizedAt;
}
