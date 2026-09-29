'use client';

import type { ApiMeta, ElectionSummary } from '@eleicoes/election-core';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import { type ReactNode, Suspense } from 'react';
import { api } from '@/lib/api';
import { defaultElection } from '@/lib/rounds';
import { BasicShell, ElectionShell } from './shell';
import { Skeleton } from './ui';

/**
 * Every page gets the same header, footer and phone navigation. Election pages take the
 * election from `?e=`; the other pages (about, how it works, 404) show the default election in
 * the header so the navigation keeps working everywhere.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StaticFallback>{children}</StaticFallback>}>
      <Inner>{children}</Inner>
    </Suspense>
  );
}

/**
 * What the static HTML contains before the browser takes over: plain pages (about, how it
 * works) render fully; election pages depend on the URL and the API, so they show a skeleton.
 */
function StaticFallback({ children }: { children: ReactNode }) {
  const onElectionPage = usePathname().startsWith('/eleicao');
  return (
    <BasicShell>
      {onElectionPage ? (
        <div className="grid gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-56" />
        </div>
      ) : (
        children
      )}
    </BasicShell>
  );
}

function Inner({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const onElectionPage = usePathname().startsWith('/eleicao');
  const elections = useQuery({
    queryKey: ['elections'],
    queryFn: () => api<ElectionSummary[]>('/api/elections'),
    refetchInterval: 60_000,
  });
  const meta = useQuery({
    queryKey: ['meta'],
    queryFn: () => api<ApiMeta>('/api/meta'),
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (!elections.data) {
    if (!onElectionPage) return <BasicShell>{children}</BasicShell>;
    return (
      <BasicShell>
        {elections.error ? (
          <div className="max-w-xl py-16">
            <h1 className="text-2xl font-semibold">API indisponível</h1>
            <p className="mt-2 text-ink-2">
              Não foi possível carregar as eleições agora. Tente novamente em alguns instantes.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-56" />
          </div>
        )}
      </BasicShell>
    );
  }

  const slug = params.get('e') ?? defaultElection(elections.data)?.slug ?? '';
  return (
    <ElectionShell electionSlug={slug} elections={elections.data} meta={meta.data ?? null}>
      {children}
    </ElectionShell>
  );
}
