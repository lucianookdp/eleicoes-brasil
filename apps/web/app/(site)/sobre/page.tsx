'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/** "Sobre os dados" is now a section of "Como funciona": old links land there. */
export default function AboutPage() {
  useEffect(() => {
    window.location.replace('/como-funciona/#dados');
  }, []);
  return (
    <div className="pb-8 pt-3">
      <h1 className="text-[24px] font-semibold">Sobre os dados</h1>
      <p className="mt-2 text-ink-2">
        Esta página agora faz parte de{' '}
        <Link href="/como-funciona/#dados" className="text-info underline underline-offset-2">
          Como funciona
        </Link>
        .
      </p>
    </div>
  );
}
