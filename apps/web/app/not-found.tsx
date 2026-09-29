import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-ink-2">O endereço não existe ou a área pedida não faz parte desta eleição.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-10 items-center text-info underline underline-offset-2"
      >
        Ir para a apuração
      </Link>
    </main>
  );
}
