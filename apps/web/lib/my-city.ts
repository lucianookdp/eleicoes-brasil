'use client';

import { useSyncExternalStore } from 'react';

/** The reader's own city, kept in this browser only. */
export interface MyCity {
  uf: string;
  code: string;
  name: string;
  state: string;
}

type Stored = { city: MyCity | null; dismissed: boolean };

const KEY = 'eleicoes:my-city:v1';
const EMPTY: Stored = { city: null, dismissed: false };
const listeners = new Set<() => void>();
let cache: Stored | null = null;

function read(): Stored {
  if (cache) return cache;
  try {
    cache = { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY) ?? 'null') as Stored | null) };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Stored) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage full: the choice lasts until the page closes.
  }
  for (const l of listeners) l();
}

export function useMyCity() {
  const stored = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
  return {
    ...stored,
    choose: (city: MyCity) => write({ city, dismissed: false }),
    clear: () => write({ city: null, dismissed: false }),
    dismiss: () => write({ ...read(), dismissed: true }),
  };
}
