'use client';

import type { SearchHitDTO } from '@eleicoes/election-core';
import { DOMESTIC_STATES } from '@eleicoes/election-core';
import { useRouter } from 'next/navigation';
import { type ComponentType, type SVGProps, useEffect, useId, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';
import { useSearch } from '@/lib/queries';
import { IconClose, IconFlag, IconOverview, IconPerson, IconPin, IconSearch, IconStates } from './icons';
import { useRound } from './shell';
import { StateFlag } from './ui';

const KIND: Record<
  SearchHitDTO['kind'],
  { label: string; group: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  state: { label: 'Estado', group: 'Estados', icon: IconStates },
  city: { label: 'Município', group: 'Cidades', icon: IconPin },
  candidate: { label: 'Candidato', group: 'Candidatos', icon: IconPerson },
  party: { label: 'Partido', group: 'Partidos', icon: IconFlag },
  office: { label: 'Cargo', group: 'Cargos', icon: IconOverview },
};
const ORDER: SearchHitDTO['kind'][] = ['state', 'city', 'candidate', 'party', 'office'];

/** "What are you looking for?" filters, in plain words. */
const FILTERS = [
  { value: 'all', label: 'Tudo' },
  { value: 'city', label: 'Cidades' },
  { value: 'candidate', label: 'Candidatos' },
  { value: 'state', label: 'Estados' },
] as const;
type Filter = (typeof FILTERS)[number]['value'];
const EXAMPLES = ['São Paulo', 'Curitiba', 'Bahia', 'Lula'];

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
  const [filter, setFilter] = useState<Filter>('all');
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const { data, isFetching } = useSearch(round.slug, debounced);
  const typed = debounced.trim().length >= 2;
  // Grouped by kind (states, cities, candidates…) so the list reads in sections.
  const hits = typed
    ? (data ?? [])
        .filter((h) => filter === 'all' || h.kind === filter)
        .map((h, i) => ({ h, i }))
        .sort((a, b) => ORDER.indexOf(a.h.kind) - ORDER.indexOf(b.h.kind) || a.i - b.i)
        .map(({ h }) => h)
    : [];

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

        <div
          className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2"
          role="group"
          aria-label="O que você procura"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => {
                setFilter(f.value);
                setIndex(0);
                input.current?.focus();
              }}
              className="h-10 shrink-0 rounded-full border border-line px-3.5 text-[15px] text-ink-2 hover:border-line-strong aria-pressed:border-live aria-pressed:bg-live-soft aria-pressed:font-medium aria-pressed:text-ink"
            >
              {f.label}
            </button>
          ))}
        </div>

        <div id={listId} role="listbox" aria-label="Resultados" className="flex-1 overflow-y-auto p-2">
          {hits.map((h, i) => {
            const kind = KIND[h.kind];
            const heading = i === 0 || hits[i - 1]!.kind !== h.kind;
            return (
              <div key={`${h.kind}-${h.path}-${h.label}-${i}`} role="presentation">
                {heading && (
                  <p
                    className="px-3 pb-1 pt-3 text-[13px] font-semibold uppercase tracking-wide text-muted"
                    role="presentation"
                  >
                    {kind.group}
                  </p>
                )}
                <div
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
                    <span className="block truncate text-[16px] font-medium">{h.label}</span>
                    <span className="block truncate text-[14px] text-muted">
                      <span className="sr-only">{kind.label} · </span>
                      {h.detail}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}

          {typed && !isFetching && hits.length === 0 && (
            <p className="px-3 py-10 text-center text-[15px] text-muted">
              Nada encontrado para “{debounced}”
              {filter !== 'all' && ` em ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase()}`}.
              Confira a grafia ou tente só uma parte do nome.
            </p>
          )}

          {!typed && (
            <div className="px-2 py-3">
              <p className="mb-2 text-[14px] text-muted">Por exemplo:</p>
              <div className="mb-5 flex flex-wrap gap-2">
                {EXAMPLES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setQ(e);
                      input.current?.focus();
                    }}
                    className="h-10 rounded-full bg-surface-2 px-4 text-[15px] text-ink-2 hover:text-ink"
                  >
                    {e}
                  </button>
                ))}
              </div>
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Estados</p>
              <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {DOMESTIC_STATES.map((s) => (
                  <li key={s.code}>
                    <button
                      type="button"
                      onClick={() => open(`/states/${s.code.toLowerCase()}`)}
                      className="flex min-h-12 w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-left text-[15px] leading-tight text-ink-2 hover:border-line-strong hover:text-ink"
                    >
                      <StateFlag uf={s.code} size={24} />
                      <span>{s.name}</span>
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
  const uf = hit.kind === 'state' ? /^\/states\/([a-z]{2})$/.exec(hit.path)?.[1] : undefined;
  if (uf)
    return (
      <span className="flex size-9 shrink-0 items-center justify-center" title={kind.label}>
        <StateFlag uf={uf} size={30} />
      </span>
    );
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
