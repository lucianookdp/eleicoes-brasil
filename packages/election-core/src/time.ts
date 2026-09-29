/**
 * All timestamps are stored and transported in UTC (ISO 8601). Presentation defaults to
 * Brasília time. The TSE publishes local Brasília dates without an offset; Brazil has had no
 * daylight saving time since 2019, so Brasília is a fixed UTC−03:00.
 */
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
const BRASILIA_OFFSET = '-03:00';

/** "04/10/2026" + "20:43:12" (Brasília) → "2026-10-04T23:43:12.000Z". `null` when missing/invalid. */
export function brasiliaToUtc(
  date: string | null | undefined,
  time: string | null | undefined,
): string | null {
  if (!date) return null;
  const d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date.trim());
  if (!d) return null;
  const t = /^(\d{2}):(\d{2}):(\d{2})$/.exec((time ?? '00:00:00').trim());
  if (!t) return null;
  const parsed = new Date(`${d[3]}-${d[2]}-${d[1]}T${t[1]}:${t[2]}:${t[3]}${BRASILIA_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(key: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('pt-BR', options);
    formatters.set(key, f);
  }
  return f;
}

/** "20:43:12" in the given timezone. */
export function formatClock(iso: string | null | undefined, timeZone = DEFAULT_TIMEZONE): string {
  if (!iso) return '—';
  return formatter(`clock:${timeZone}`, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

/** "04/10 20:43" in the given timezone. */
export function formatDateTime(iso: string | null | undefined, timeZone = DEFAULT_TIMEZONE): string {
  if (!iso) return '—';
  return formatter(`dt:${timeZone}`, {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function timezoneLabel(timeZone = DEFAULT_TIMEZONE): string {
  return timeZone === DEFAULT_TIMEZONE ? 'BRT' : timeZone;
}
