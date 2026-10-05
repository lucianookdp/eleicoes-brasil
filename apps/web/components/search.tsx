'use client';

import type { SearchHitDTO } from '@eleicoes/election-core';
import { DOMESTIC_STATES } from '@eleicoes/election-core';
import { useRouter } from 'next/navigation';
import { type ComponentType, type SVGProps, useEffect, useId, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';
import { useSearch } from '@/lib/queries';
import { IconClose, IconFlag, IconOverview, IconPerson, IconPin, IconSearch, IconStates } from './icons';
import { useRound } from './shell';

const KIND: Record<SearchHitDTO['kind'], { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  state: { label: 'Estado', icon: IconStates },
  city: { label: 'Município', icon: IconPin },
  candidate: { label: 'Candidato', icon: IconPerson },
  party: { label: 'Partido', icon: IconFlag },
  office: { label: 'Cargo', icon: IconOverview },
};

/**
 * Global search: states, cities, candidates, parties and offices.
 * Full screen on phones (with the 27 states as shortcuts before typing), a centred panel on
 * larger screens. Arrow keys and Enter work too.
 */
export function SearchPalette({ onClose }: { onClose: () => void }) {
  const { round, href } = useRound();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const { data, isFetching } = useSearch(round.slug, debounced);
  const typed = debounced.trim().length >= 2;
  const hits = typed ? (data ?? []) : [];

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q);
      setIndex(0);
    }, 150);
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

  const open = (path: string, params?: Record<string, string>) => {
    onClose();
    router.push(href(path, params));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center sm:items-start sm:p-4 sm:pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar"
    >
      <button
        type="button"
        className="absolute inset-0 hidden bg-black/55 sm:block"
        aria-label="Fechar busca"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full flex-col bg-ground sm:h-auto sm:max-h-[75vh] sm:max-w-xl sm:overflow-hidden sm:rounded-2xl sm:border sm:border-line-strong sm:bg-surface sm:shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 focus-within:border-live">
            <IconSearch className="shrink-0 text-muted" />
            <span className="sr-only">Buscar</span>
            <input
              ref={input}
              type="search"
              enterKeyHint="search"
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
                } else if (e.key === 'Enter' && hits[index]) open(hits[index].path, hits[index].params);
              }}
              placeholder="Cidade, estado ou candidato"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
              style={{ outline: 'none' }}
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls={listId}
              aria-activedescendant={hits[index] ? `${listId}-${index}` : undefined}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  input.current?.focus();
                }}
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-line text-ink-2"
                aria-label="Limpar busca"
              >
                <IconClose width={14} height={14} />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={onClose}
            className="h-12 shrink-0 px-2 text-[15px] font-medium text-info sm:hidden"
          >
            Cancelar
          </button>
        </div>

        <div id={listId} role="listbox" aria-label="Resultados" className="flex-1 overflow-y-auto p-2">
          {hits.map((h, i) => {
            const kind = KIND[h.kind];
            return (
              <div
                key={`${h.kind}-${h.path}-${h.label}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                tabIndex={-1}
                aria-selected={i === index}
                onMouseEnter={() => setIndex(i)}
                onClick={() => open(h.path, h.params)}
                onKeyDown={() => {}}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 aria-selected:bg-surface-2"
              >
                <HitIcon hit={h} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{h.label}</span>
                  <span className="block truncate text-[13px] text-muted">
                    <span className="sr-only">{kind.label} · </span>
                    {h.detail}
                  </span>
                </span>
              </div>
            );
          })}

          {typed && !isFetching && hits.length === 0 && (
            <p className="px-3 py-10 text-center text-[15px] text-muted">
              Nada encontrado para “{debounced}”.
            </p>
          )}

          {!typed && (
            <div className="px-2 py-3">
              <p className="mb-3 text-[13px] font-medium text-muted">Estados</p>
              <ul className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
                {DOMESTIC_STATES.map((s) => (
                  <li key={s.code}>
                    <button
                      type="button"
                      onClick={() => open(`/states/${s.code.toLowerCase()}`)}
                      title={s.name}
                      aria-label={s.name}
                      className="h-11 w-full rounded-lg border border-line bg-surface text-[14px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
                    >
                      {s.code}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 hidden text-[12.5px] text-muted sm:block">
                Use ↑ ↓ para escolher e Enter para abrir. Esc fecha.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Kind icon, or the candidate's official photo when there is one. */
function HitIcon({ hit }: { hit: SearchHitDTO }) {
  const { round } = useRound();
  const [failed, setFailed] = useState(false);
  const kind = KIND[hit.kind];
  return (
    <span
      className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-ink-2"
      title={kind.label}
    >
      <kind.icon />
      {hit.photo && !failed && (
        // biome-ignore lint/performance/noImgElement: static export, no image optimisation server
        <img
          src={`${API_URL}/api/elections/${round.slug}/photos/${hit.photo}`}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover object-[center_22%]"
        />
      )}
    </span>
  );
}
