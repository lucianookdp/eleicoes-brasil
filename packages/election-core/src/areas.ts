import { isStateCode, type StateCode } from './geo';

export type AreaType = 'country' | 'state' | 'city' | 'zone';

export interface AreaRef {
  /** Stable key: "br", "sp", "sp-71072", "sp-71072-z0001". Never a name. */
  key: string;
  type: AreaType;
  state: StateCode | null;
  /** Official TSE municipality code, 5 digits. */
  cityCode: string | null;
  /** Electoral zone number, 4 digits. */
  zone: string | null;
}

export const COUNTRY: AreaRef = { key: 'br', type: 'country', state: null, cityCode: null, zone: null };

export const area = {
  country: (): AreaRef => COUNTRY,
  state: (uf: StateCode): AreaRef => ({
    key: uf.toLowerCase(),
    type: 'state',
    state: uf,
    cityCode: null,
    zone: null,
  }),
  city: (uf: StateCode, cityCode: string): AreaRef => ({
    key: `${uf.toLowerCase()}-${pad(cityCode, 5)}`,
    type: 'city',
    state: uf,
    cityCode: pad(cityCode, 5),
    zone: null,
  }),
  zone: (uf: StateCode, cityCode: string, zone: string): AreaRef => ({
    key: `${uf.toLowerCase()}-${pad(cityCode, 5)}-z${pad(zone, 4)}`,
    type: 'zone',
    state: uf,
    cityCode: pad(cityCode, 5),
    zone: pad(zone, 4),
  }),
};

const AREA_KEY = /^(?:(br)|([a-z]{2})(?:-(\d{5})(?:-z(\d{4}))?)?)$/;

export function parseAreaKey(key: string): AreaRef | null {
  const m = AREA_KEY.exec(key);
  if (!m) return null;
  if (m[1]) return COUNTRY;
  const uf = m[2]!.toUpperCase();
  if (!isStateCode(uf)) return null;
  if (m[4]) return area.zone(uf, m[3]!, m[4]);
  if (m[3]) return area.city(uf, m[3]);
  return area.state(uf);
}

export function pad(value: string | number, size: number): string {
  return String(value).padStart(size, '0');
}
