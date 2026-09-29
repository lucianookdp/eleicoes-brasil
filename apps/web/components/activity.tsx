'use client';

import type { ActivityEventDTO } from '@eleicoes/election-core';
import { formatClock } from '@eleicoes/election-core';
import { useEffect, useRef } from 'react';
import { fmtInt, fmtPct } from '@/lib/format';

const ISSUE: Record<string, string> = {
  'source.schema': 'Formato inesperado de arquivo',
  'source.unavailable': 'Fonte indisponível',
  'collector.error': 'Erro na coleta',
  'quality.issue': 'Inconsistência nos dados',
};

/** Live log of what changed, newest first. Rows that arrive after mount slide in. */
export function ActivityFeed({
  events,
  max = 30,
  dense = false,
}: {
  events: ActivityEventDTO[];
  max?: number;
  dense?: boolean;
}) {
  const seen = useRef<Set<string> | null>(null);
  const first = seen.current == null;
  const fresh = (id: string) => !first && !seen.current!.has(id);
  useEffect(() => {
    seen.current = new Set(events.map((e) => e.id));
  }, [events]);

  const list = events.slice(0, max);
  if (list.length === 0)
    return <p className="py-6 text-center text-[14px] text-muted">Nenhuma atualização recebida ainda.</p>;
  return (
    <ol className="font-mono text-[12.5px]" aria-live="polite" aria-relevant="additions">
      {list.map((e) => {
        const issue = ISSUE[e.type];
        return (
          <li
            key={e.id}
            className={`grid grid-cols-[4.6rem_minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-line/60 ${dense ? 'py-1' : 'py-1.5'} ${fresh(e.id) ? 'enter-row' : ''}`}
          >
            <time dateTime={e.occurredAt} className="text-muted">
              {formatClock(e.occurredAt)}
            </time>
            <span className="truncate font-sans text-[13.5px]">
              {issue ? <span className="text-warn">{issue}</span> : (e.areaName ?? e.areaKey)}
              {issue && e.areaName && <span className="text-muted"> · {e.areaName}</span>}
            </span>
            <span className="text-right">
              {issue ? (
                <span className="text-muted" title={e.message ?? ''}>
                  ver log
                </span>
              ) : e.sectionsAdded && e.sectionsAdded > 0 ? (
                <span className="text-live">+{fmtInt(e.sectionsAdded)} seções</span>
              ) : (
                <span className="text-muted">{fmtPct(e.countedPct, 1)}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
