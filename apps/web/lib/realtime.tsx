'use client';

import type { RealtimeEvent } from '@eleicoes/election-core';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { API_URL, setDataVersion } from './api';

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
    let source: EventSource | null = null;
    let reopen: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;
    let opened = false;
    let disposed = false;
    const pending = new Set<string>();
    let version = 0;
    const flush = () => {
      timer.current = null;
      setDataVersion(roundSlug, version);
      client.invalidateQueries({ queryKey: [roundSlug] });
      const now = Date.now();
      setRecent((prev) => {
        const next = new Map([...prev].filter(([, t]) => now - t < 10_000));
        for (const k of pending) next.set(k, now);
        pending.clear();
        return next;
      });
    };
    // The refetch is spread over ~1 s so thousands of readers do not hit the API in the same
    // millisecond.
    const scheduleFlush = () => {
      if (!timer.current) timer.current = setTimeout(flush, 250 + Math.random() * 1000);
    };

    const connect = () => {
      reopen = null;
      const es = new EventSource(`${API_URL}/api/realtime/elections/${roundSlug}`);
      source = es;
      es.addEventListener('ready', ((e: MessageEvent<string>) => {
        try {
          const ready = (JSON.parse(e.data) as { version?: number }).version ?? 0;
          // Back after a gap: what is on screen may be behind, so refresh it now instead of
          // waiting for the next update.
          const behind = opened && ready > version;
          version = Math.max(version, ready);
          setDataVersion(roundSlug, version);
          if (behind) scheduleFlush();
        } catch {}
        opened = true;
      }) as EventListener);
      // One frame per update, with every area that changed.
      es.addEventListener('batch', ((e: MessageEvent<string>) => {
        setLastEventAt(Date.now());
        try {
          const batch = JSON.parse(e.data) as { version: number; events: RealtimeEvent[] };
          version = Math.max(version, batch.version);
          for (const event of batch.events) {
            if (event.areaKey) pending.add(event.areaKey);
            if (event.state) pending.add(event.state.toLowerCase());
          }
        } catch {
          return;
        }
        scheduleFlush();
      }) as EventListener);
      es.onopen = () => {
        failures = 0;
        setConnection(navigator.onLine ? 'live' : 'offline');
      };
      es.onerror = () => {
        setConnection(navigator.onLine ? 'reconnecting' : 'offline');
        // The browser retries by itself after a network error, but gives up for good after an
        // HTTP error, e.g. a 502 while the API restarts. Reopen it ourselves: 1–3 s at first,
        // then longer, at random, so every reader does not come back in the same second.
        if (es.readyState === EventSource.CLOSED && !disposed && !reopen) {
          es.close();
          const delay = Math.min(30_000, 2000 * 2 ** failures) * (0.5 + Math.random());
          failures = Math.min(failures + 1, 6);
          reopen = setTimeout(connect, delay);
        }
      };
    };
    connect();

    const offline = () => setConnection('offline');
    const online = () => {
      setConnection('reconnecting');
      // Back online: reopen a stream the browser gave up on right away.
      if (reopen) {
        clearTimeout(reopen);
        connect();
      }
    };
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    return () => {
      disposed = true;
      source?.close();
      if (reopen) clearTimeout(reopen);
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
