'use client';

import type { ApiMeta, ElectionSummary } from '@eleicoes/election-core';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { type ReactNode, Suspense } from 'react';
import { ElectionShell } from '@/components/shell';
import { Skeleton } from '@/components/ui';
import { api } from '@/lib/api';

function Shell({ children }: { children: ReactNode }) {
  const params = useSearchParams();
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
  if (elections.error) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24">
        <h1 className="text-2xl font-semibold">API indisponível</h1>
        <p className="mt-2 text-ink-2">
          Não foi possível carregar as eleições agora. Tente novamente em alguns instantes.
        </p>
      </main>
    );
  }
  if (!elections.data) {
    return (
      <main className="mx-auto grid max-w-[1320px] gap-4 px-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56" />
      </main>
    );
  }
  return (
    <ElectionShell electionSlug={params.get('e') ?? ''} elections={elections.data} meta={meta.data ?? null}>
      {children}
    </ElectionShell>
  );
}

export default function ElectionLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
