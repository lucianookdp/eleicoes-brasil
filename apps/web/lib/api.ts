/** Browser → our API. Never the TSE. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
/** Server components may reach the API through an internal address (Docker network). */
const SERVER_API_URL = process.env.API_URL ?? API_URL;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Latest data version announced by the realtime stream. Appended as `?v=` to round requests so
 * every reader asks for the same URL after an update and a CDN can serve it (see docs/architecture.md).
 */
let dataVersion: { round: string; v: number } | null = null;
export function setDataVersion(round: string, v: number) {
  if (v > 0) dataVersion = { round, v };
}

function withVersion(path: string) {
  if (!dataVersion || !path.startsWith(`/api/elections/${dataVersion.round}/`)) return path;
  return `${path}${path.includes('?') ? '&' : '?'}v=${dataVersion.v}`;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${withVersion(path)}`, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new ApiError(res.status, body?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Server-side fetch for the first render. Returns null instead of throwing so a page can still
 * render (and fetch on the client) when the API is briefly unreachable.
 */
export async function serverApi<T>(path: string, revalidate = 5): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Private visitor counter: a random id kept in this browser, sent once per page load (the API
 * counts it once a day). No cookie and nothing personal; failures are ignored.
 */
export function countVisit() {
  try {
    let id = localStorage.getItem('eleicoes:visitor');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('eleicoes:visitor', id);
    }
    navigator.sendBeacon?.(`${API_URL}/api/visit`, id);
  } catch {
    // Private mode or an old browser: just not counted.
  }
}
