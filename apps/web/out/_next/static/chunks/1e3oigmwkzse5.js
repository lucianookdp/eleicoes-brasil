(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  34584,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(98460),
      s = e.i(78071),
      l = e.i(1856),
      i = e.i(33533),
      n = e.i(49725),
      r = e.i(97026),
      o = e.i(91739);
    function d({ uf: e, city: a, initial: s }) {
      const { round: c, href: m } = (0, r.useRound)(),
        {
          data: u,
          error: x,
          refetch: p,
        } = (0, l.useCity)(c.slug, e.toLowerCase(), a, s?.round.slug === c.slug ? s : null),
        f = `${e.toLowerCase()}-${a}`,
        h = u?.results.map((e) => e.office) ?? [],
        [g] = (0, n.useOfficeParam)(h),
        b = (0, l.useResult)(c.slug, f, g?.slug);
      if (!u)
        return x
          ? (0, t.jsx)(o.ErrorNotice, { error: x, retry: () => p() })
          : (0, t.jsx)(o.Skeleton, { className: 'h-96' });
      const j = u.results.find((e) => e.office.slug === g?.slug) ?? null;
      return (0, t.jsxs)(t.Fragment, {
        children: [
          (0, t.jsx)(o.Breadcrumbs, {
            items: [
              { label: 'Brasil', href: m() },
              { label: u.stateName, href: m(`/states/${e.toLowerCase()}`) },
              { label: u.city.name },
            ],
          }),
          (0, t.jsxs)('div', {
            className: 'mb-6 flex flex-wrap items-center justify-between gap-3',
            children: [
              (0, t.jsxs)('div', {
                children: [
                  (0, t.jsx)('h1', {
                    className: 'text-[28px] font-semibold tracking-tight sm:text-[32px]',
                    children: u.city.name,
                  }),
                  (0, t.jsxs)('p', {
                    className: 'text-[13px] text-muted',
                    children: [
                      u.city.isCapital ? `Capital \xb7 ${u.stateName}` : u.stateName,
                      ' · código TSE',
                      ' ',
                      u.city.code,
                      u.city.ibgeCode && ` \xb7 IBGE ${u.city.ibgeCode}`,
                    ],
                  }),
                ],
              }),
              (0, t.jsx)(o.FavoriteButton, {
                favorite: {
                  key: f,
                  label: u.city.name,
                  detail: e,
                  path: `/states/${e.toLowerCase()}/cities/${a}`,
                },
              }),
            ],
          }),
          (0, t.jsx)(i.CountingHero, {
            progress: u.progress,
            votes: (b.data ?? j)?.votes,
            votesFor: g?.name,
            title: `Totaliza\xe7\xe3o em ${u.city.name}`,
          }),
          (0, t.jsxs)('section', {
            'aria-labelledby': 'resultados',
            className: 'mt-8 max-w-3xl',
            children: [
              (0, t.jsx)(o.SectionTitle, { id: 'resultados', title: 'Resultados por cargo' }),
              (0, t.jsx)(n.ResultPanel, { roundSlug: c.slug, areaKey: f, offices: h, initial: j }),
            ],
          }),
          u.city.zones.length > 0 &&
            (0, t.jsxs)('section', {
              'aria-labelledby': 'zonas',
              className: 'mt-12 max-w-3xl',
              children: [
                (0, t.jsx)(o.SectionTitle, {
                  id: 'zonas',
                  title: 'Zonas eleitorais',
                  children: 'Zonas que atendem este município segundo o cadastro da Justiça Eleitoral.',
                }),
                (0, t.jsx)('ul', {
                  className: 'flex flex-wrap gap-2',
                  children: u.city.zones.map((e) =>
                    (0, t.jsxs)(
                      'li',
                      {
                        className: 'rounded-md border border-line px-2.5 py-1 font-mono text-[13px]',
                        children: ['Zona ', e],
                      },
                      e,
                    ),
                  ),
                }),
                (0, t.jsx)('p', {
                  className: 'mt-3 text-[13px] text-muted',
                  children:
                    'Resultados por zona e a lista de seções serão exibidos quando essa coleta for ativada. Esta versão mostra apenas o que já é coletado.',
                }),
              ],
            }),
        ],
      });
    }
    e.s(
      [
        'default',
        0,
        () => {
          const e = (0, s.useSearchParams)(),
            l = (e.get('uf') ?? '').toUpperCase(),
            i = e.get('c') ?? '';
          return (0, a.isStateCode)(l) && /^\d{5}$/.test(i)
            ? (0, t.jsx)(d, { uf: l, city: i, initial: null }, `${l}-${i}`)
            : (0, t.jsx)(o.EmptyState, { title: 'Município não encontrado.' });
        },
      ],
      34584,
    );
  },
  33533,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(3485),
      s = e.i(38824),
      l = e.i(70837),
      i = e.i(39242),
      n = e.i(56324),
      r = e.i(97026),
      o = e.i(91739);
    const d = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul', 'Exterior'];
    function c({ states: e }) {
      const { href: a } = (0, r.useRound)(),
        s = e.filter((e) => e.progress?.sectionsTotal),
        i = s.reduce((e, t) => e + (t.progress?.sectionsTotal ?? 0), 0);
      if (0 === i) return null;
      const o = [...s].sort(
        (e, t) => d.indexOf(e.region) - d.indexOf(t.region) || e.name.localeCompare(t.name, 'pt-BR'),
      );
      return (0, t.jsxs)('div', {
        className: 'mt-4',
        children: [
          (0, t.jsx)('div', {
            className: 'flex h-7 gap-[2px] sm:h-8',
            role: 'list',
            'aria-label': 'Apuração por estado, agrupada por região',
            children: o.map((e) => {
              const s = (e.progress.sectionsTotal / i) * 100,
                r = e.progress.countedPct ?? 0;
              return (0, t.jsxs)(
                l.default,
                {
                  role: 'listitem',
                  href: a(`/states/${e.uf.toLowerCase()}`),
                  title: `${e.name}: ${(0, n.fmtPct)(r)} apurado`,
                  'aria-label': `${e.name}: ${(0, n.fmtPct)(r)} apurado`,
                  className: 'group relative flex min-w-[3px] overflow-hidden rounded-[3px] bg-line',
                  style: { flexBasis: `${s}%`, flexGrow: 0, flexShrink: 1 },
                  children: [
                    (0, t.jsx)('span', {
                      className: 'bar absolute inset-y-0 left-0 bg-live/80 group-hover:bg-live',
                      style: { width: `${r}%` },
                    }),
                    s > 4 &&
                      (0, t.jsx)('span', {
                        className:
                          'relative z-10 m-auto hidden text-[10.5px] font-semibold text-ink sm:inline',
                        children: e.uf,
                      }),
                  ],
                },
                e.uf,
              );
            }),
          }),
          (0, t.jsx)('div', {
            className: 'mt-1 flex gap-[2px] text-[11.5px] text-muted',
            'aria-hidden': !0,
            children: d.map((e) => {
              const a = o.filter((t) => t.region === e).reduce((e, t) => e + t.progress.sectionsTotal, 0) / i;
              return 0 === a
                ? null
                : (0, t.jsx)(
                    'span',
                    {
                      className: 'truncate border-l border-line-strong pl-1',
                      style: { flexBasis: `${100 * a}%` },
                      children: a > 0.1 ? e : '',
                    },
                    e,
                  );
            }),
          }),
        ],
      });
    }
    e.s([
      'CountingHero',
      0,
      ({ progress: e, states: l, votes: r, votesFor: d, title: m = 'Apuração' }) => {
        const [u, x] = (0, i.useState)(!1),
          p = e && 'not-started' !== e.status,
          f =
            e?.sectionsTotal != null && null != e.sectionsCounted
              ? e.sectionsTotal - e.sectionsCounted
              : null;
        return (0, t.jsxs)('section', {
          'aria-labelledby': 'apuracao',
          children: [
            (0, t.jsx)('h2', {
              id: 'apuracao',
              className: 'text-[13px] font-medium text-muted',
              children: m,
            }),
            (0, t.jsxs)('div', {
              className: 'flex flex-wrap items-end justify-between gap-x-6 gap-y-1',
              children: [
                (0, t.jsx)('p', {
                  className: 'numeral text-[clamp(48px,14vw,84px)] leading-[0.95]',
                  'aria-live': 'polite',
                  children: p ? (0, n.fmtPct)(e.countedPct) : '—',
                }),
                p &&
                  e.totalizedAt &&
                  (0, t.jsxs)('p', {
                    className: 'pb-1.5 text-right text-[13px] text-ink-2',
                    children: [
                      'atualizado às ',
                      (0, t.jsx)('span', {
                        className: 'font-medium text-ink',
                        children: (0, a.formatClock)(e.totalizedAt),
                      }),
                      ' ',
                      'BRT',
                    ],
                  }),
              ],
            }),
            (0, t.jsx)('p', {
              className: 'mt-1 text-[14px] text-ink-2',
              children: e
                ? p
                  ? 'finished' === e.status
                    ? `Todas as ${(0, n.fmtInt)(e.sectionsTotal)} se\xe7\xf5es totalizadas.`
                    : `das se\xe7\xf5es totalizadas \xb7 ${(0, n.fmtInt)(e.sectionsCounted)} de ${(0, n.fmtInt)(e.sectionsTotal)} (faltam ${(0, n.fmtInt)(f)})`
                  : 'A apuração ainda não começou. Os números aparecem aqui assim que o TSE publicar a primeira parcial.'
                : 'Aguardando os primeiros dados do TSE.',
            }),
            l && l.length > 0 && p && (0, t.jsx)(c, { states: l }),
            (0, t.jsx)('button', {
              type: 'button',
              onClick: () => x((e) => !e),
              'aria-expanded': u,
              className: 'mt-3 flex min-h-10 items-center gap-1 text-[13px] text-info sm:hidden',
              children: u ? 'Ocultar comparecimento e votos' : 'Ver comparecimento e votos',
            }),
            (0, t.jsxs)('dl', {
              className: `${u ? 'grid' : 'hidden'} mt-3 grid-cols-3 gap-x-4 gap-y-3 border-t border-line pt-3 sm:mt-4 sm:grid sm:grid-cols-3 lg:grid-cols-6`,
              children: [
                (0, t.jsx)(o.Stat, { label: 'Eleitorado', value: (0, n.fmtCompact)(e?.electorateTotal) }),
                (0, t.jsx)(o.Stat, {
                  label: 'Comparecimento',
                  value: p ? (0, n.fmtPct)(e?.turnoutPct, 1) : '—',
                  detail: p ? (0, n.fmtCompact)(e?.turnout) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: 'Abstenção',
                  value: p ? (0, n.fmtPct)(e?.abstentionPct, 1) : '—',
                  detail: p ? (0, n.fmtCompact)(e?.abstention) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: d ? `V\xe1lidos (${d})` : 'Válidos',
                  value: p && r ? (0, n.fmtPct)((0, s.percent)(r.valid, r.total), 1) : '—',
                  detail: r ? (0, n.fmtCompact)(r.valid) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: 'Brancos',
                  value: p && r ? (0, n.fmtPct)((0, s.percent)(r.blank, r.total), 1) : '—',
                  detail: r ? (0, n.fmtCompact)(r.blank) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: 'Nulos',
                  value: p && r ? (0, n.fmtPct)((0, s.percent)(r.null, r.total), 1) : '—',
                  detail: r ? (0, n.fmtCompact)(r.null) : void 0,
                }),
              ],
            }),
          ],
        });
      },
    ]);
  },
  49725,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(3485),
      s = e.i(38824),
      l = e.i(78071),
      i = e.i(39242),
      n = e.i(56324),
      r = e.i(1856),
      o = e.i(91739);
    function d({ result: e, top: a = 6 }) {
      const l = e.candidates
          .filter(s.hasValidVotes)
          .slice(0, a)
          .filter((e) => (e.percent ?? 0) > 0),
        i = 100 - l.reduce((e, t) => e + (t.percent ?? 0), 0);
      return 0 === l.length
        ? null
        : (0, t.jsxs)('div', {
            className: 'relative pt-5',
            children: [
              'majoritarian' === e.office.kind &&
                1 === e.seats &&
                (0, t.jsxs)('div', {
                  className:
                    'pointer-events-none absolute inset-y-0 left-1/2 z-10 flex flex-col items-center',
                  'aria-hidden': !0,
                  children: [
                    (0, t.jsx)('span', {
                      className: '-translate-y-0.5 whitespace-nowrap text-[11px] text-muted',
                      children: '50% dos válidos',
                    }),
                    (0, t.jsx)('span', { className: 'w-px flex-1 bg-ink/70' }),
                  ],
                }),
              (0, t.jsxs)('div', {
                className: 'flex h-4 gap-[2px] overflow-hidden rounded-[4px]',
                role: 'img',
                'aria-label': l
                  .map((e) => `${(0, n.displayName)(e.ballotName)} ${(0, n.fmtPct)(e.percent)}`)
                  .join(', '),
                children: [
                  l.map((e) =>
                    (0, t.jsx)(
                      'span',
                      {
                        className: 'bar h-full first:rounded-l-[4px]',
                        style: { width: `${e.percent}%`, background: e.color },
                      },
                      e.key,
                    ),
                  ),
                  i > 0.05 && (0, t.jsx)('span', { className: 'bar h-full flex-1 rounded-r-[4px] bg-line' }),
                ],
              }),
            ],
          });
    }
    function c({ c: e, result: a }) {
      let s = e.status || null;
      if (
        (!s &&
          e.elected &&
          (a.final || a.mathematicallyDecided) &&
          (s = 'runoff' === a.mathematicallyDecided ? '2º turno' : 'Eleito'),
        !s)
      )
        return null;
      const l =
        /eleit/i.test(s) && !/não/i.test(s)
          ? 'bg-live-soft text-live'
          : /2º|segundo/i.test(s)
            ? 'bg-surface-2 text-info'
            : 'bg-surface-2 text-muted';
      return (0, t.jsx)('span', {
        className: `rounded px-1.5 py-0.5 text-[11.5px] font-medium ${l}`,
        children: s,
      });
    }
    function m({ c: e, result: a, rank: l }) {
      const i = (0, n.fmtPp)(e.deltaPp),
        r = (0, n.fmtSigned)(e.deltaVotes),
        o = e.runningMates.filter((e) => e.name);
      return (0, t.jsxs)('li', {
        className: 'grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-3',
        children: [
          (0, t.jsx)('span', {
            className: 'flex size-9 items-center justify-center rounded-full text-[12px] font-semibold',
            style: {
              background: `color-mix(in srgb, ${e.color} 18%, transparent)`,
              color: e.color,
              boxShadow: `inset 0 0 0 1.5px ${e.color}`,
            },
            'aria-hidden': !0,
            children: (0, n.initials)(e.ballotName),
          }),
          (0, t.jsxs)('div', {
            className: 'min-w-0',
            children: [
              (0, t.jsxs)('p', {
                className: 'flex items-center gap-2 truncate font-medium',
                children: [
                  (0, t.jsxs)('span', { className: 'sr-only', children: [l, 'º. '] }),
                  (0, t.jsx)('span', { className: 'truncate', children: (0, n.displayName)(e.ballotName) }),
                  (0, t.jsx)(c, { c: e, result: a }),
                  !(0, s.hasValidVotes)(e) &&
                    (0, t.jsx)('span', {
                      className: 'rounded bg-warn-soft px-1.5 py-0.5 text-[11.5px] font-medium text-warn',
                      title: 'Destinação dos votos informada pelo TSE',
                      children: e.voteDestination,
                    }),
                ],
              }),
              (0, t.jsxs)('p', {
                className: 'truncate text-[12.5px] text-muted',
                children: [
                  e.number,
                  ' · ',
                  e.party.abbreviation,
                  e.coalition &&
                    e.coalition !== e.party.abbreviation &&
                    (0, t.jsxs)(t.Fragment, { children: [' · ', e.coalition] }),
                  o.length > 0 &&
                    (0, t.jsxs)('span', {
                      className: 'hidden sm:inline',
                      children: [
                        ' ',
                        '· ',
                        'vice' === o[0].role ? 'Vice' : 'Suplente',
                        ': ',
                        (0, n.displayName)(o[0].ballotName),
                      ],
                    }),
                ],
              }),
            ],
          }),
          (0, t.jsxs)('div', {
            className: 'text-right',
            children: [
              (0, t.jsx)('p', {
                className: 'numeral text-[20px] leading-none',
                children: a.votesPublishable ? (0, n.fmtPct)(e.percent) : '—',
              }),
              (0, t.jsx)('p', {
                className: 'mt-1 text-[12px] text-muted',
                children: a.votesPublishable ? `${(0, n.fmtInt)(e.votes)} votos` : 'não divulgado',
              }),
            ],
          }),
          (0, t.jsx)('div', {
            className: 'col-start-2 h-1.5 overflow-hidden rounded-full bg-line',
            children: (0, t.jsx)('div', {
              className: 'bar h-full rounded-full',
              style: { width: `${e.percent ?? 0}%`, background: e.color },
            }),
          }),
          (0, t.jsxs)('p', {
            className: 'col-start-3 whitespace-nowrap text-right text-[11.5px] leading-none text-muted',
            title: 'Variação desde a atualização anterior',
            children: [
              i ?? r ?? ' ',
              i && r && (0, t.jsxs)('span', { className: 'sr-only', children: [' (', r, ' votos)'] }),
            ],
          }),
        ],
      });
    }
    function u({ result: e, collapsed: a }) {
      const [s, l] = (0, i.useState)(!1),
        n = a && !s ? e.candidates.slice(0, a) : e.candidates;
      return (0, t.jsxs)(t.Fragment, {
        children: [
          (0, t.jsx)('ol', {
            className: 'divide-y divide-line',
            children: n.map((a, s) => (0, t.jsx)(m, { c: a, result: e, rank: s + 1 }, a.key)),
          }),
          a &&
            e.candidates.length > a &&
            (0, t.jsx)('button', {
              type: 'button',
              onClick: () => l((e) => !e),
              'aria-expanded': s,
              className: 'mt-1 min-h-10 w-full rounded-lg text-[13.5px] text-info hover:bg-surface-2',
              children: s ? 'Mostrar menos' : `Ver todos os ${e.candidates.length} candidatos`,
            }),
        ],
      });
    }
    function x({ result: e }) {
      const a = e.votes.valid,
        l = [...e.parties]
          .map((e) => ({ ...e, total: (e.nominalVotes ?? 0) + (e.legendVotes ?? 0) }))
          .sort((e, t) => t.total - e.total);
      return (0, t.jsxs)('div', {
        className: 'scroll-x',
        children: [
          (0, t.jsxs)('table', {
            className: 'w-full min-w-[520px] text-[14px]',
            children: [
              (0, t.jsx)('caption', { className: 'sr-only', children: 'Votação por partido' }),
              (0, t.jsx)('thead', {
                className: 'text-left text-[12.5px] text-muted',
                children: (0, t.jsxs)('tr', {
                  className: 'border-b border-line',
                  children: [
                    (0, t.jsx)('th', { className: 'py-2 font-normal', children: 'Partido' }),
                    (0, t.jsx)('th', { className: 'py-2 text-right font-normal', children: 'Nominais' }),
                    (0, t.jsx)('th', { className: 'py-2 text-right font-normal', children: 'Legenda' }),
                    (0, t.jsx)('th', { className: 'py-2 text-right font-normal', children: 'Total' }),
                    (0, t.jsx)('th', { className: 'py-2 text-right font-normal', children: '% válidos' }),
                    (0, t.jsx)('th', { className: 'py-2 text-right font-normal', children: 'Vagas' }),
                  ],
                }),
              }),
              (0, t.jsx)('tbody', {
                children: l.map((l) =>
                  (0, t.jsxs)(
                    'tr',
                    {
                      className: 'border-b border-line/70',
                      children: [
                        (0, t.jsxs)('td', {
                          className: 'py-2',
                          children: [
                            (0, t.jsx)('span', { className: 'font-medium', children: l.abbreviation }),
                            ' ',
                            (0, t.jsx)('span', { className: 'text-muted', children: l.number }),
                            l.federation &&
                              (0, t.jsxs)('span', {
                                className: 'ml-1 text-[12px] text-muted',
                                children: ['(', l.federation, ')'],
                              }),
                          ],
                        }),
                        (0, t.jsx)('td', {
                          className: 'py-2 text-right',
                          children: (0, n.fmtInt)(l.nominalVotes),
                        }),
                        (0, t.jsx)('td', {
                          className: 'py-2 text-right',
                          children: (0, n.fmtInt)(l.legendVotes),
                        }),
                        (0, t.jsx)('td', { className: 'py-2 text-right', children: (0, n.fmtInt)(l.total) }),
                        (0, t.jsx)('td', {
                          className: 'py-2 text-right',
                          children: (0, n.fmtPct)((0, s.percent)(l.total, a)),
                        }),
                        (0, t.jsx)('td', {
                          className: 'py-2 text-right',
                          children: e.final ? (0, n.fmtInt)(l.seats) : '—',
                        }),
                      ],
                    },
                    l.number,
                  ),
                ),
              }),
            ],
          }),
          !e.final &&
            (0, t.jsx)('p', {
              className: 'mt-2 text-[12.5px] text-muted',
              children: 'As vagas só são definidas após a totalização final.',
            }),
        ],
      });
    }
    function p(e) {
      const t = (0, l.useSearchParams)(),
        a = (0, l.useRouter)(),
        s = (0, l.usePathname)(),
        i = t.get('cargo');
      return [
        e.find((e) => e.slug === i) ?? e[0],
        (e) => {
          const l = new URLSearchParams(t);
          l.set('cargo', e), a.replace(`${s}?${l}`, { scroll: !1 });
        },
      ];
    }
    function f({ offices: e, value: a, onChange: s }) {
      return e.length <= 1
        ? null
        : (0, t.jsx)('div', {
            className: 'scroll-x -mx-1 mb-3',
            children: (0, t.jsx)('div', {
              role: 'tablist',
              'aria-label': 'Cargo',
              className: 'flex w-max gap-1 px-1',
              children: e.map((e) =>
                (0, t.jsx)(
                  'button',
                  {
                    type: 'button',
                    role: 'tab',
                    'aria-selected': e.slug === a,
                    onClick: () => s(e.slug),
                    className:
                      'min-h-9 whitespace-nowrap rounded-md border border-transparent px-3 text-[14px] text-muted hover:text-ink aria-selected:border-line-strong aria-selected:bg-surface-2 aria-selected:text-ink',
                    children: e.name,
                  },
                  e.slug,
                ),
              ),
            }),
          });
    }
    function h({ result: e }) {
      if (!e.provenance) return null;
      const s = e.provenance;
      return (0, t.jsxs)('p', {
        className: 'mt-4 text-[12px] text-muted',
        children: [
          'Fonte: ',
          'TSE' === s.provider ? 'Tribunal Superior Eleitoral — TSE' : s.provider,
          e.progress.totalizedAt &&
            (0, t.jsxs)(t.Fragment, {
              children: [' · totalizado às ', (0, a.formatClock)(e.progress.totalizedAt), ' BRT'],
            }),
          ' · recebido às ',
          (0, a.formatClock)(s.retrievedAt),
          ' BRT ·',
          ' ',
          (0, t.jsx)('span', {
            className: 'break-all font-mono text-[11px]',
            title: 'Arquivo de origem',
            children: s.sourceFile.split('/').at(-1),
          }),
        ],
      });
    }
    e.s([
      'CandidateList',
      0,
      u,
      'Provenance',
      0,
      h,
      'RaceBar',
      0,
      d,
      'ResultPanel',
      0,
      ({ roundSlug: e, areaKey: a, offices: s, initial: l }) => {
        const [c, m] = p(s),
          [g, b] = (0, i.useState)('candidates'),
          [j, v] = (0, i.useState)(void 0),
          N = (0, r.useResult)(e, a, c?.slug, j),
          y = N.data ?? (l && l.office.slug === c?.slug ? l : void 0);
        return c
          ? (0, t.jsxs)('div', {
              children: [
                (0, t.jsx)(f, {
                  offices: s,
                  value: c.slug,
                  onChange: (e) => {
                    v(void 0), b('candidates'), m(e);
                  },
                }),
                !y &&
                  N.isLoading &&
                  (0, t.jsxs)('div', {
                    className: 'grid gap-3',
                    children: [
                      (0, t.jsx)(o.Skeleton, { className: 'h-4' }),
                      [0, 1, 2, 3].map((e) => (0, t.jsx)(o.Skeleton, { className: 'h-14' }, e)),
                    ],
                  }),
                !y &&
                  N.error &&
                  404 === N.error.status &&
                  (0, t.jsx)(o.EmptyState, {
                    title: 'Ainda não há resultados deste cargo aqui.',
                    children: 'Os números aparecem assim que o TSE publicar a totalização desta área.',
                  }),
                !y &&
                  N.error &&
                  404 !== N.error.status &&
                  (0, t.jsx)(o.ErrorNotice, { error: N.error, retry: () => N.refetch() }),
                y &&
                  (0, t.jsxs)('div', {
                    children: [
                      !y.votesPublishable &&
                        (0, t.jsx)('p', {
                          className: 'mb-3 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-ink-2',
                          children:
                            'O TSE ainda não liberou a divulgação dos votos deste cargo. Os números aparecem quando a divulgação for autorizada.',
                        }),
                      (0, t.jsxs)('div', {
                        className:
                          'mb-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted',
                        children: [
                          (0, t.jsxs)('span', {
                            children: [
                              (0, n.fmtPct)(y.progress.countedPct),
                              ' das seções · ',
                              (0, n.fmtInt)(y.votes.valid),
                              ' votos válidos',
                              y.seats && y.seats > 1 ? ` \xb7 ${y.seats} vagas` : '',
                            ],
                          }),
                          'proportional' === y.office.kind &&
                            (0, t.jsx)(o.Segmented, {
                              label: 'Visualização',
                              value: g,
                              onChange: b,
                              options: [
                                { value: 'candidates', label: 'Candidatos' },
                                { value: 'parties', label: 'Partidos' },
                              ],
                            }),
                        ],
                      }),
                      'candidates' === g || 'proportional' !== y.office.kind
                        ? (0, t.jsxs)(t.Fragment, {
                            children: [
                              'majoritarian' === y.office.kind && (0, t.jsx)(d, { result: y }),
                              (0, t.jsx)(u, { result: y }),
                              y.candidatesTotal > y.candidates.length &&
                                (0, t.jsxs)('button', {
                                  type: 'button',
                                  onClick: () => v(y.candidatesTotal),
                                  className:
                                    'mt-3 h-10 w-full rounded-lg border border-line text-[14px] text-ink-2 hover:border-line-strong hover:text-ink',
                                  children: [
                                    'Mostrar todos os ',
                                    (0, n.fmtInt)(y.candidatesTotal),
                                    ' candidatos',
                                  ],
                                }),
                            ],
                          })
                        : (0, t.jsx)(x, { result: y }),
                      (0, t.jsx)(h, { result: y }),
                    ],
                  }),
              ],
            })
          : (0, t.jsx)(o.EmptyState, { title: 'Nenhum cargo disponível para esta área.' });
      },
      'useOfficeParam',
      0,
      p,
    ]);
  },
  56324,
  (e) => {
    const t = new Intl.NumberFormat('pt-BR'),
      a = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }),
      s = new Map(),
      l = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);
    function i(e) {
      return e !== e.toUpperCase()
        ? e
        : e
            .toLocaleLowerCase('pt-BR')
            .split(' ')
            .map((e, t) => (t > 0 && l.has(e) ? e : e.charAt(0).toLocaleUpperCase('pt-BR') + e.slice(1)))
            .join(' ');
    }
    e.s([
      'ago',
      0,
      (e, t = Date.now()) => {
        if (!e) return '—';
        const a = Math.max(0, Math.round((t - Date.parse(e)) / 1e3));
        return a < 5
          ? 'agora'
          : a < 60
            ? `${a} s`
            : a < 3600
              ? `${Math.floor(a / 60)} min`
              : a < 86400
                ? `${Math.floor(a / 3600)} h`
                : `${Math.floor(a / 86400)} d`;
      },
      'displayName',
      0,
      i,
      'fmtCompact',
      0,
      (e) => (null == e ? '—' : a.format(e)),
      'fmtInt',
      0,
      (e) => (null == e ? '—' : t.format(e)),
      'fmtPct',
      0,
      (e, t = 2) => {
        if (null == e || !Number.isFinite(e)) return '—';
        let a = s.get(t);
        return (
          a ||
            ((a = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: t, maximumFractionDigits: t })),
            s.set(t, a)),
          `${a.format(e)}%`
        );
      },
      'fmtPp',
      0,
      (e) => {
        if (null == e || !Number.isFinite(e) || 0.005 > Math.abs(e)) return null;
        const t = Math.abs(e).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${e > 0 ? '+' : '−'}${t} pp`;
      },
      'fmtSigned',
      0,
      (e) => (null == e || 0 === e ? null : `${e > 0 ? '+' : '−'}${t.format(Math.abs(e))}`),
      'initials',
      0,
      (e) => {
        const t = i(e)
          .split(' ')
          .filter((e) => !l.has(e));
        return ((t[0]?.[0] ?? '') + (t.length > 1 ? (t.at(-1)?.[0] ?? '') : '')).toUpperCase();
      },
    ]);
  },
  38824,
  (e) => {
    e.s([
      'hasValidVotes',
      0,
      (e) => null == e.voteDestination || /^v[aá]lido/i.test(e.voteDestination),
      'percent',
      0,
      (e, t) =>
        null != e && null != t && Number.isFinite(e) && Number.isFinite(t) && !(t <= 0)
          ? (e / t) * 100
          : null,
    ]);
  },
]);
