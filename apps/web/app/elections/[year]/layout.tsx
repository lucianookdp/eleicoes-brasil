import type { ApiMeta, ElectionSummary } from '@eleicoes/election-core';
import { type ReactNode, Suspense } from 'react';
import { ElectionShell } from '@/components/shell';
import { serverApi } from '@/lib/api';

export default async function ElectionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const [elections, meta] = await Promise.all([
    serverApi<ElectionSummary[]>('/api/elections', 15),
    serverApi<ApiMeta>('/api/meta', 300),
  ]);
  if (!elections) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24">
        <h1 className="text-2xl font-semibold">API indisponível</h1>
        <p className="mt-2 text-ink-2">
          Não foi possível carregar as eleições agora. Tente novamente em alguns instantes.
        </p>
      </main>
    );
  }
  return (
    <Suspense>
      <ElectionShell electionSlug={year} elections={elections} meta={meta}>
        {children}
      </ElectionShell>
    </Suspense>
  );
}
