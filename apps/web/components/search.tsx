'use client';

import type { SearchHitDTO } from '@eleicoes/election-core';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useSearch } from '@/lib/queries';
import { IconSearch } from './icons';
import { useRound } from './shell';

const KIND: Record<SearchHitDTO['kind'], string> = {
  state: 'Estado',
  city: 'Município',
  candidate: 'Candidato',
  party: 'Partido',
  office: 'Cargo',
};

/** Global search: states, cities, candidates, parties and offices. Keyboard first. */
export function SearchPalette({ onClose }: { onClose: () => void }) {
  const { round } = useRound();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const { data, isFetching } = useSearch(round.slug, debounced);
  const hits = debounced.trim().length >= 2 ? (data ?? []) : [];

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q);
      setIndex(0);
    }, 180);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const go = (hit: SearchHitDTO | undefined) => {
    if (!hit) return;
    onClose();
    router.push(hit.href);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Fechar busca"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line px-3">
          <IconSearch className="text-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, hits.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') go(hits[index]);
            }}
            placeholder="Estado, município, candidato, partido ou cargo"
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls={listId}
            aria-activedescendant={hits[index] ? `${listId}-${index}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border border-line px-1.5 font-mono text-[11px] text-muted">Esc</kbd>
        </div>
        <div
          id={listId}
          role="listbox"
          aria-label="Resultados"
          className="max-h-[60vh] overflow-y-auto p-1.5"
        >
          {hits.map((h, i) => (
            <div
              key={`${h.kind}-${h.href}-${h.label}`}
              id={`${listId}-${i}`}
              role="option"
              tabIndex={-1}
              aria-selected={i === index}
              onMouseEnter={() => setIndex(i)}
              onClick={() => go(h)}
              onKeyDown={() => {}}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 aria-selected:bg-surface-2"
            >
              <span className="w-20 shrink-0 text-[12px] text-muted">{KIND[h.kind]}</span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{h.label}</span>
                <span className="block truncate text-[13px] text-muted">{h.detail}</span>
              </span>
            </div>
          ))}
          {debounced.trim().length >= 2 && !isFetching && hits.length === 0 && (
            <p className="px-3 py-6 text-center text-[14px] text-muted">
              Nada encontrado para “{debounced}”.
            </p>
          )}
          {debounced.trim().length < 2 && (
            <p className="px-3 py-5 text-[13px] text-muted">
              Digite ao menos 2 letras. Use ↑ ↓ para navegar e Enter para abrir.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
