'use client';

import { hasValidVotes, type OverviewDTO } from '@eleicoes/election-core';
import Link from 'next/link';
import { type Favorite, useFavorites } from '@/lib/favorites';
import { displayName, fmtPct } from '@/lib/format';
import { useCity, useOverview } from '@/lib/queries';
import { IconStar } from './icons';
import { useRound } from './shell';
import { EmptyState, ErrorNotice, Skeleton, StateFlag } from './ui';

const CITY = /^\/states\/([a-z]{2})\/cities\/(\d{5})$/;

/**
 * The reader's saved places, live: for each, who leads the headline race there and how far the
 * count went. States come with the overview; each city asks for its own result.
 */
export function FavoriteCards({
  data,
  limit,
  removable = false,
}: {
  data: OverviewDTO;
  limit?: number;
  removable?: boolean;
}) {
  const { favorites } = useFavorites();
  const shown = limit ? favorites.slice(0, limit) : favorites;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {shown.map((f) => (
        <li key={f.key}>
          <Card favorite={f} data={data} removable={removable} />
        </li>
      ))}
    </ul>
  );
}

function Card({ favorite, data, removable }: { favorite: Favorite; data: OverviewDTO; removable: boolean }) {
  const { href } = useRound();
  const { toggle } = useFavorites();
  const city = CITY.exec(favorite.path);
  const office = data.round.offices.find((o) => o.scope === 'country')?.slug;
  return (
    <div className="relative rounded-xl border border-line bg-surface hover:border-line-strong">
      <Link href={href(favorite.path)} className="block p-3 pr-10">
        <span className="flex items-center gap-2">
          <StateFlag uf={city ? city[1]! : favorite.key} size={18} />
          <span className="min-w-0 truncate font-medium">{favorite.label}</span>
          {city && <span className="shrink-0 text-[12.5px] text-muted">{city[1]!.toUpperCase()}</span>}
        </span>
        {city ? (
          <CityLine uf={city[1]!} code={city[2]!} office={office} />
        ) : (
          <StateLine data={data} uf={favorite.key} />
        )}
      </Link>
      {removable && (
        <button
          type="button"
          onClick={() => toggle(favorite)}
          aria-label={`Tirar ${favorite.label} dos favoritos`}
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md text-warn hover:bg-surface-2"
        >
          <IconStar filled width={16} height={16} />
        </button>
      )}
    </div>
  );
}

function Line({
  leader,
  counted,
}: {
  leader: { name: string; color: string; percent: number | null } | null;
  counted: number | null | undefined;
}) {
  return (
    <span className="mt-1.5 flex items-center justify-between gap-3 text-[13.5px]">
      {leader ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: leader.color }} aria-hidden />
          <span className="truncate">{displayName(leader.name)}</span>
          <span className="numeral shrink-0 font-semibold">{fmtPct(leader.percent, 1)}</span>
        </span>
      ) : (
        <span className="text-muted">Ainda sem votos apurados</span>
      )}
      <span className="numeral shrink-0 text-[12.5px] text-muted">
        {counted != null ? `${fmtPct(counted, 1)} apurado` : '—'}
      </span>
    </span>
  );
}

function StateLine({ data, uf }: { data: OverviewDTO; uf: string }) {
  const s = data.states.find((x) => x.uf.toLowerCase() === uf);
  return <Line leader={s?.leader ?? null} counted={s?.progress?.countedPct} />;
}

function CityLine({ uf, code, office }: { uf: string; code: string; office: string | undefined }) {
  const { round } = useRound();
  const { data } = useCity(round.slug, uf, code);
  const result = data?.results.find((r) => r.office.slug === office) ?? data?.results[0];
  const top = result?.candidates.filter(hasValidVotes)[0];
  if (!data) return <span className="mt-1.5 block h-5 animate-pulse rounded bg-surface-2" />;
  return (
    <Line
      leader={
        top && (top.votes ?? 0) > 0 ? { name: top.ballotName, color: top.color, percent: top.percent } : null
      }
      counted={data.progress?.countedPct}
    />
  );
}

/** "Favoritos": every saved place, live, with how to add more. */
export function FavoritesView() {
  const { round, href } = useRound();
  const { data, error, refetch } = useOverview(round.slug);
  const { favorites } = useFavorites();
  return (
    <>
      <div className="mb-5">
        <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">Favoritos</h1>
        <p className="text-[13.5px] text-muted">
          Os estados e cidades que você salvou, com quem está na frente e quanto já foi apurado. Ficam só
          neste navegador.
        </p>
      </div>
      {error && <ErrorNotice error={error} retry={() => refetch()} />}
      {!data && !error && <Skeleton className="h-48" />}
      {data &&
        (favorites.length === 0 ? (
          <EmptyState title="Você ainda não salvou nenhum lugar.">
            Na página de um estado ou de uma cidade, toque em <strong>Favoritar</strong>: ele aparece aqui e
            na página inicial.{' '}
            <Link href={href('/states')} className="text-info underline underline-offset-2">
              Ver estados e cidades
            </Link>
          </EmptyState>
        ) : (
          <FavoriteCards data={data} removable />
        ))}
    </>
  );
}
