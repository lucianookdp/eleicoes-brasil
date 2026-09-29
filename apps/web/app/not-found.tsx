'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { electionHref } from '@/lib/rounds';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * On GitHub Pages this is the page served for any unknown path. Links in the older
 * "/elections/2026/states/sp/cities/71072" format are translated to the current routes.
 */
function legacyTarget(pathname: string, search: string): string | null {
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  const m = /^\/elections\/([a-z0-9-]+)(\/.*?)?\/?$/.exec(path);
  if (!m) return null;
  const q = new URLSearchParams(search);
  const extra = q.get('cargo') ? { cargo: q.get('cargo')! } : undefined;
  const rest = m[2] ?? '';
  return electionHref({ electionSlug: m[1]!, round: Number(q.get('turno') ?? 1) }, rest, extra);
}

export default function NotFound() {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const target = legacyTarget(window.location.pathname, window.location.search);
    if (target) window.location.replace(`${BASE}${target}`);
    else setChecked(true);
  }, []);
  if (!checked) return null;
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
