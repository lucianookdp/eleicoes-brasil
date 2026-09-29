import type { OfficeInfo } from './contracts';

/** Display order for offices; unknown slugs go last in provider order. */
const ORDER = [
  'presidente',
  'governador',
  'senador',
  'deputado-federal',
  'deputado-estadual',
  'deputado-distrital',
  'conselheiro-distrital',
  'prefeito',
  'vereador',
];

export function sortOffices<T extends Pick<OfficeInfo, 'slug'>>(offices: T[]): T[] {
  const rank = (s: string) => {
    const i = ORDER.indexOf(s);
    return i === -1 ? ORDER.length : i;
  };
  return [...offices].sort((a, b) => rank(a.slug) - rank(b.slug));
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Case- and accent-insensitive comparison key for search. */
export const searchKey = (text: string) => slugify(text).replace(/-/g, ' ');
