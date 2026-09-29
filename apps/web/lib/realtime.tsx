'use client';

import type { RealtimeEvent } from '@eleicoes/election-core';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { API_URL } from './api';

export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'offline';

interface RealtimeValue {
  connection: ConnectionState;
  lastEventAt: number | null;
  /** Area keys ("sp", "br") → time of their latest update, for highlighting what changed. */
  recent: Map<string, number>;
}

const Ctx = createContext<RealtimeValue>({ connection: 'connecting', lastEventAt: null, recent: new Map() });

/**
 * One EventSource per round. Events invalidate the round's TanStack Query cache (debounced,
 * since one collector cycle emits several events), so every visible view refetches the
 * small payload it needs instead of the server pushing full documents.
 */
export function RealtimeProvider({ roundSlug, children }: { roundSlug: string; children: ReactNode }) {
  const client = useQueryClient();
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [recent, setRecent] = useState<Map<string, number>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const source = new EventSource(`${API_URL}/api/realtime/elections/${roundSlug}`);
    const pending = new Set<string>();
    const flush = () => {
      timer.current = null;
      client.invalidateQueries({ queryKey: [roundSlug] });
      const now = Date.now();
      setRecent((prev) => {
        const next = new Map([...prev].filter(([, t]) => now - t < 10_000));
        for (const k of pending) next.set(k, now);
        pending.clear();
        return next;
      });
    };
    const onEvent = (e: MessageEvent<string>) => {
      setLastEventAt(Date.now());
      try {
        const event = JSON.parse(e.data) as RealtimeEvent;
        if (event.areaKey) pending.add(event.areaKey);
        if (event.state) pending.add(event.state.toLowerCase());
      } catch {
        // Heartbeats and malformed frames are ignored.
      }
      if (!timer.current) timer.current = setTimeout(flush, 800);
    };
    source.onopen = () => setConnection(navigator.onLine ? 'live' : 'offline');
    source.onerror = () => setConnection(navigator.onLine ? 'reconnecting' : 'offline');
    for (const type of [
      'country.updated',
      'state.updated',
      'city.updated',
      'result.updated',
      'counting.updated',
      'ingestion.status',
    ]) {
      source.addEventListener(type, onEvent as EventListener);
    }
    const offline = () => setConnection('offline');
    const online = () => setConnection('reconnecting');
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    return () => {
      source.close();
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
    };
  }, [roundSlug, client]);

  return <Ctx.Provider value={{ connection, lastEventAt, recent }}>{children}</Ctx.Provider>;
}

export const useRealtime = () => useContext(Ctx);

/** True for a few seconds after the area received an update. */
export function useJustUpdated(areaKey: string | undefined): boolean {
  const { recent } = useRealtime();
  const t = areaKey ? recent.get(areaKey.toLowerCase()) : undefined;
  return t != null && Date.now() - t < 3000;
}
