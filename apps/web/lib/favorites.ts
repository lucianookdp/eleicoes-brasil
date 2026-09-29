'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Saved places, in this browser only. No account needed. */
export interface Favorite {
  key: string;
  label: string;
  detail: string;
  /** Path inside an election, e.g. "/states/sp", so favourites work for any election. */
  path: string;
}

const KEY = 'eleicoes:favorites:v1';
const listeners = new Set<() => void>();
let cache: Favorite[] | null = null;

function read(): Favorite[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Favorite[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(list: Favorite[]) {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private mode or storage full: favourites just will not persist.
  }
  for (const l of listeners) l();
}

const EMPTY: Favorite[] = [];

export function useFavorites() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
  const toggle = useCallback((f: Favorite) => {
    const current = read();
    write(current.some((x) => x.key === f.key) ? current.filter((x) => x.key !== f.key) : [...current, f]);
  }, []);
  return { favorites: list, toggle, has: (key: string) => list.some((f) => f.key === key) };
}
