'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <h1 className="text-2xl font-semibold">Algo deu errado ao montar esta página</h1>
      <p className="mt-2 text-ink-2">Os dados continuam sendo coletados. Tente carregar de novo.</p>
      <button type="button" onClick={reset} className="mt-6 h-10 rounded-lg border border-line-strong px-4">
        Tentar de novo
      </button>
    </main>
  );
}
