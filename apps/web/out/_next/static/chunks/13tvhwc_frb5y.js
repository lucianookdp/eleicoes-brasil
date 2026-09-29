(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  56280,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(98460),
      s = e.i(78071),
      l = e.i(3485),
      n = e.i(70837),
      i = e.i(39242),
      r = e.i(56324),
      o = e.i(1856),
      d = e.i(71614),
      c = e.i(33533),
      m = e.i(64523),
      u = e.i(49725),
      x = e.i(97026),
      p = e.i(91739);
    function h({ uf: e, initial: a }) {
      const { round: s, href: l } = (0, x.useRound)(),
        {
          data: n,
          error: i,
          refetch: r,
        } = (0, o.useStateDetail)(s.slug, e, a?.round.slug === s.slug ? a : null),
        d = n?.offices ?? [],
        [f] = (0, u.useOfficeParam)(d),
        j = e.toLowerCase(),
        b = (0, o.useResult)(s.slug, j, f?.slug),
        v = (0, o.useSeries)(s.slug, f?.kind === 'majoritarian' ? f.slug : void 0, j);
      return n
        ? (0, t.jsxs)(t.Fragment, {
            children: [
              (0, t.jsx)(p.Breadcrumbs, { items: [{ label: 'Brasil', href: l() }, { label: n.name }] }),
              (0, t.jsxs)('div', {
                className: 'mb-6 flex flex-wrap items-center justify-between gap-3',
                children: [
                  (0, t.jsx)('h1', {
                    className: 'text-[28px] font-semibold tracking-tight sm:text-[32px]',
                    children: n.name,
                  }),
                  (0, t.jsx)(p.FavoriteButton, {
                    favorite: { key: j, label: n.name, detail: e, path: `/states/${j}` },
                  }),
                ],
              }),
              (0, t.jsx)(p.FreshnessNotice, {
                ingestion: n.ingestion,
                progress: n.progress,
                roundStatus: n.round.status,
              }),
              (0, t.jsx)(c.CountingHero, {
                progress: n.progress,
                votes: b.data?.votes,
                votesFor: f?.name,
                title: `Totaliza\xe7\xe3o em ${n.name}`,
              }),
              (0, t.jsxs)('section', {
                'aria-labelledby': 'cargos',
                className: 'mt-8',
                children: [
                  (0, t.jsx)(p.SectionTitle, { id: 'cargos', title: 'Resultados por cargo' }),
                  0 === d.length
                    ? (0, t.jsx)(p.EmptyState, { title: 'Nenhum cargo em disputa neste estado.' })
                    : (0, t.jsxs)('div', {
                        className: 'grid gap-8 lg:grid-cols-12 [&>*]:min-w-0',
                        children: [
                          (0, t.jsx)('div', {
                            className: 'lg:col-span-7',
                            children: (0, t.jsx)(u.ResultPanel, {
                              roundSlug: s.slug,
                              areaKey: j,
                              offices: d,
                            }),
                          }),
                          (0, t.jsx)('div', {
                            className: 'lg:col-span-5',
                            children:
                              f?.kind === 'majoritarian' &&
                              (0, t.jsxs)(p.Panel, {
                                className: 'p-3 sm:p-4',
                                children: [
                                  (0, t.jsxs)('h3', {
                                    className: 'mb-2 text-[14px] font-medium text-ink-2',
                                    children: ['Evolução · ', f.name],
                                  }),
                                  v.data
                                    ? (0, t.jsx)(m.EvolutionChart, {
                                        series: v.data,
                                        majority: 'senador' !== f.slug,
                                      })
                                    : (0, t.jsx)(p.Skeleton, { className: 'h-72' }),
                                ],
                              }),
                          }),
                        ],
                      }),
                ],
              }),
              (0, t.jsx)(g, { uf: e, total: n.cityCount }),
            ],
          })
        : i
          ? (0, t.jsx)(p.ErrorNotice, { error: i, retry: () => r() })
          : (0, t.jsx)(p.Skeleton, { className: 'h-96' });
    }
    const f = [
      { value: 'default', label: 'Capital primeiro' },
      { value: 'name', label: 'Nome' },
      { value: 'counted-desc', label: 'Maior totalização' },
      { value: 'counted-asc', label: 'Menor totalização' },
      { value: 'turnout', label: 'Mais votos' },
      { value: 'updated', label: 'Atualização recente' },
    ];
    function g({ uf: e, total: a }) {
      const { round: s, href: c } = (0, x.useRound)(),
        { recent: m } = (0, d.useRealtime)(),
        [u, h] = (0, i.useState)(''),
        [j, b] = (0, i.useState)(''),
        [v, N] = (0, i.useState)('default'),
        [y, k] = (0, i.useState)(1);
      (0, i.useEffect)(() => {
        const e = setTimeout(() => {
          b(u), k(1);
        }, 250);
        return () => clearTimeout(e);
      }, [u]);
      const { data: w, isFetching: S } = (0, o.useCities)(s.slug, e.toLowerCase(), {
          q: j,
          sort: v,
          page: y,
        }),
        C = w ? Math.max(1, Math.ceil(w.total / w.pageSize)) : 1;
      return (0, t.jsxs)('section', {
        'aria-labelledby': 'municipios',
        className: 'mt-12',
        children: [
          (0, t.jsxs)(p.SectionTitle, {
            id: 'municipios',
            title: 'Municípios',
            children: [(0, r.fmtInt)(a), ' municípios'],
          }),
          (0, t.jsxs)('div', {
            className: 'mb-3 flex flex-wrap gap-2',
            children: [
              (0, t.jsxs)('label', {
                className: 'min-w-0 flex-1 basis-60',
                children: [
                  (0, t.jsx)('span', { className: 'sr-only', children: 'Buscar município' }),
                  (0, t.jsx)('input', {
                    type: 'search',
                    value: u,
                    onChange: (e) => h(e.target.value),
                    placeholder: 'Buscar município…',
                    className:
                      'h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] placeholder:text-muted focus:border-line-strong',
                  }),
                ],
              }),
              (0, t.jsxs)('label', {
                className: 'flex items-center gap-2 text-[13px] text-muted',
                children: [
                  'Ordenar',
                  (0, t.jsx)('select', {
                    value: v,
                    onChange: (e) => {
                      N(e.target.value), k(1);
                    },
                    className: 'h-10 rounded-lg border border-line bg-surface px-2 text-[14px] text-ink',
                    children: f.map((e) =>
                      (0, t.jsx)('option', { value: e.value, children: e.label }, e.value),
                    ),
                  }),
                ],
              }),
            ],
          }),
          w &&
            0 === w.items.length &&
            (0, t.jsx)(p.EmptyState, { title: `Nenhum munic\xedpio encontrado para “${j}”.` }),
          (0, t.jsx)('ul', {
            className: `grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3 ${S ? 'opacity-70' : ''}`,
            children: (w?.items ?? []).map((a) => {
              const s = a.progress,
                i = (m.get(e.toLowerCase()) ?? 0) > Date.now() - 3e3;
              return (0, t.jsx)(
                'li',
                {
                  className: `border-b border-line ${i ? 'flash' : ''}`,
                  children: (0, t.jsxs)(n.default, {
                    href: c(`/states/${e.toLowerCase()}/cities/${a.code}`),
                    className: 'block py-3 hover:bg-surface-2/60',
                    children: [
                      (0, t.jsxs)('span', {
                        className: 'flex items-baseline justify-between gap-2',
                        children: [
                          (0, t.jsxs)('span', {
                            className: 'truncate font-medium',
                            children: [
                              a.name,
                              a.isCapital &&
                                (0, t.jsx)('span', {
                                  className: 'ml-1.5 text-[12px] font-normal text-muted',
                                  children: 'capital',
                                }),
                            ],
                          }),
                          (0, t.jsx)('span', {
                            className: 'numeral text-[15px]',
                            children: s && 'not-started' !== s.status ? (0, r.fmtPct)(s.countedPct) : '—',
                          }),
                        ],
                      }),
                      (0, t.jsx)(p.ProgressBar, {
                        value: s?.countedPct ?? null,
                        label: `${a.name} totalizado`,
                        className: 'mt-1.5',
                      }),
                      (0, t.jsxs)('span', {
                        className: 'mt-1 flex justify-between text-[12.5px] text-muted',
                        children: [
                          (0, t.jsxs)('span', {
                            children: [
                              (0, r.fmtInt)(s?.sectionsCounted),
                              ' / ',
                              (0, r.fmtInt)(s?.sectionsTotal),
                              ' seções',
                            ],
                          }),
                          (0, t.jsx)('span', {
                            children: s?.turnout != null ? `${(0, r.fmtInt)(s.turnout)} votos` : '',
                          }),
                        ],
                      }),
                      s?.totalizedAt &&
                        (0, t.jsxs)('span', {
                          className: 'sr-only',
                          children: ['Atualizado às ', (0, l.formatClock)(s.totalizedAt)],
                        }),
                    ],
                  }),
                },
                a.code,
              );
            }),
          }),
          C > 1 &&
            (0, t.jsxs)('nav', {
              'aria-label': 'Páginas de municípios',
              className: 'mt-4 flex items-center justify-between text-[14px]',
              children: [
                (0, t.jsx)('button', {
                  type: 'button',
                  disabled: y <= 1,
                  onClick: () => k((e) => e - 1),
                  className: 'h-10 rounded-lg border border-line px-4 disabled:opacity-40',
                  children: 'Anterior',
                }),
                (0, t.jsxs)('span', { className: 'text-muted', children: ['Página ', y, ' de ', C] }),
                (0, t.jsx)('button', {
                  type: 'button',
                  disabled: y >= C,
                  onClick: () => k((e) => e + 1),
                  className: 'h-10 rounded-lg border border-line px-4 disabled:opacity-40',
                  children: 'Próxima',
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
          const e = ((0, s.useSearchParams)().get('uf') ?? '').toUpperCase();
          return (0, a.isStateCode)(e)
            ? (0, t.jsx)(h, { uf: e, initial: null }, e)
            : (0, t.jsx)(p.EmptyState, { title: 'Estado não encontrado.' });
        },
      ],
      56280,
    );
  },
  33533,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(3485),
      s = e.i(38824),
      l = e.i(70837),
      n = e.i(39242),
      i = e.i(56324),
      r = e.i(97026),
      o = e.i(91739);
    const d = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul', 'Exterior'];
    function c({ states: e }) {
      const { href: a } = (0, r.useRound)(),
        s = e.filter((e) => e.progress?.sectionsTotal),
        n = s.reduce((e, t) => e + (t.progress?.sectionsTotal ?? 0), 0);
      if (0 === n) return null;
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
              const s = (e.progress.sectionsTotal / n) * 100,
                r = e.progress.countedPct ?? 0;
              return (0, t.jsxs)(
                l.default,
                {
                  role: 'listitem',
                  href: a(`/states/${e.uf.toLowerCase()}`),
                  title: `${e.name}: ${(0, i.fmtPct)(r)} apurado`,
                  'aria-label': `${e.name}: ${(0, i.fmtPct)(r)} apurado`,
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
              const a = o.filter((t) => t.region === e).reduce((e, t) => e + t.progress.sectionsTotal, 0) / n;
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
        const [u, x] = (0, n.useState)(!1),
          p = e && 'not-started' !== e.status,
          h =
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
                  children: p ? (0, i.fmtPct)(e.countedPct) : '—',
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
                    ? `Todas as ${(0, i.fmtInt)(e.sectionsTotal)} se\xe7\xf5es totalizadas.`
                    : `das se\xe7\xf5es totalizadas \xb7 ${(0, i.fmtInt)(e.sectionsCounted)} de ${(0, i.fmtInt)(e.sectionsTotal)} (faltam ${(0, i.fmtInt)(h)})`
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
                (0, t.jsx)(o.Stat, { label: 'Eleitorado', value: (0, i.fmtCompact)(e?.electorateTotal) }),
                (0, t.jsx)(o.Stat, {
                  label: 'Comparecimento',
                  value: p ? (0, i.fmtPct)(e?.turnoutPct, 1) : '—',
                  detail: p ? (0, i.fmtCompact)(e?.turnout) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: 'Abstenção',
                  value: p ? (0, i.fmtPct)(e?.abstentionPct, 1) : '—',
                  detail: p ? (0, i.fmtCompact)(e?.abstention) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: d ? `V\xe1lidos (${d})` : 'Válidos',
                  value: p && r ? (0, i.fmtPct)((0, s.percent)(r.valid, r.total), 1) : '—',
                  detail: r ? (0, i.fmtCompact)(r.valid) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: 'Brancos',
                  value: p && r ? (0, i.fmtPct)((0, s.percent)(r.blank, r.total), 1) : '—',
                  detail: r ? (0, i.fmtCompact)(r.blank) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: 'Nulos',
                  value: p && r ? (0, i.fmtPct)((0, s.percent)(r.null, r.total), 1) : '—',
                  detail: r ? (0, i.fmtCompact)(r.null) : void 0,
                }),
              ],
            }),
          ],
        });
      },
    ]);
  },
  64523,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(3485),
      s = e.i(39242),
      l = e.i(56324);
    e.s([
      'EvolutionChart',
      0,
      ({ series: e, majority: n }) => {
        var i;
        const r = (0, s.useRef)(null),
          [o, d] = (0, s.useState)(null),
          [c, m] = (0, s.useState)(null),
          u = e.points.filter((e) => Object.values(e.values).some((e) => null != e && e > 0)),
          x = u.length >= 2;
        if (
          ((0, s.useEffect)(() => {
            if (!x || !r.current) return;
            const e = new ResizeObserver(([e]) => d(Math.max(260, Math.floor(e.contentRect.width))));
            return e.observe(r.current), () => e.disconnect();
          }, [x]),
          !x)
        )
          return (0, t.jsx)('p', {
            className: 'py-10 text-center text-[14px] text-muted',
            children: 'A evolução aparece depois de duas ou mais atualizações.',
          });
        let p = Date.parse(u[0].at),
          h = Date.parse(u.at(-1).at),
          f = u.flatMap((e) => Object.values(e.values).filter((e) => null != e)),
          g = Math.max(0, Math.floor(Math.min(...f) - 2)),
          j = Math.min(100, Math.ceil(Math.max(...f) + 2));
        n && g < 50 && j > 42 && (j = Math.max(j, 52));
        const b = (i = j - g) > 40 ? 10 : i > 16 ? 5 : i > 6 ? 2 : 1;
        g = Math.floor(g / b) * b;
        const v = o ?? 0,
          N = v - 40 - 16,
          y = 236,
          k = (e) => 40 + ((e - p) / Math.max(1, h - p)) * N,
          w = (e) => 16 + (1 - (e - g) / (j - g)) * y,
          S = Array.from(
            { length: Math.round(((j = Math.ceil(j / b) * b) - g) / b) + 1 },
            (e, t) => g + t * b,
          ),
          C = Array.from({ length: v < 480 ? 3 : 5 }, (e, t) => p + ((h - p) * t) / (v < 480 ? 2 : 4)),
          P = (e) => {
            let t = p + ((e - r.current.getBoundingClientRect().left - 40) / N) * (h - p),
              a = 0;
            for (let e = 1; e < u.length; e++)
              Math.abs(Date.parse(u[e].at) - t) < Math.abs(Date.parse(u[a].at) - t) && (a = e);
            m(a);
          },
          $ = null != c ? u[c] : null,
          M = u.at(-1);
        return (0, t.jsxs)('div', {
          children: [
            (0, t.jsx)('ul', {
              className: 'mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]',
              'aria-label': 'Legenda',
              children: e.candidates.map((e) =>
                (0, t.jsxs)(
                  'li',
                  {
                    className: 'flex items-center gap-1.5',
                    children: [
                      (0, t.jsx)('span', {
                        className: 'inline-block h-0.5 w-4 rounded',
                        style: { background: e.color },
                        'aria-hidden': !0,
                      }),
                      (0, t.jsx)('span', { className: 'text-ink-2', children: (0, l.displayName)(e.name) }),
                    ],
                  },
                  e.key,
                ),
              ),
            }),
            (0, t.jsxs)('div', {
              ref: r,
              className: 'relative w-full min-w-0 touch-pan-y select-none overflow-hidden',
              onPointerMove: (e) => P(e.clientX),
              onPointerDown: (e) => P(e.clientX),
              onPointerLeave: () => m(null),
              children: [
                null != o &&
                  (0, t.jsxs)('svg', {
                    width: v,
                    height: 280,
                    role: 'img',
                    'aria-label': `Evolu\xe7\xe3o do percentual de votos: ${e.candidates.map((e) => `${(0, l.displayName)(e.name)} ${(0, l.fmtPct)(M.values[e.key])}`).join(', ')}`,
                    children: [
                      S.map((e) =>
                        (0, t.jsxs)(
                          'g',
                          {
                            children: [
                              (0, t.jsx)('line', {
                                x1: 40,
                                x2: v - 16,
                                y1: w(e),
                                y2: w(e),
                                stroke: 'var(--line)',
                                strokeWidth: 1,
                              }),
                              (0, t.jsxs)('text', {
                                x: 32,
                                y: w(e),
                                dy: '0.32em',
                                textAnchor: 'end',
                                fontSize: 11,
                                fill: 'var(--muted)',
                                children: [e, '%'],
                              }),
                            ],
                          },
                          e,
                        ),
                      ),
                      n &&
                        g < 50 &&
                        j > 50 &&
                        (0, t.jsxs)('g', {
                          children: [
                            (0, t.jsx)('line', {
                              x1: 40,
                              x2: v - 16,
                              y1: w(50),
                              y2: w(50),
                              stroke: 'var(--ink-2)',
                              strokeDasharray: '4 4',
                              strokeWidth: 1,
                            }),
                            (0, t.jsx)('text', {
                              x: v - 16,
                              y: w(50) - 5,
                              textAnchor: 'end',
                              fontSize: 11,
                              fill: 'var(--ink-2)',
                              children: '50%',
                            }),
                          ],
                        }),
                      C.map((e, s) =>
                        (0, t.jsx)(
                          'text',
                          {
                            x: k(e),
                            y: 272,
                            textAnchor: 0 === s ? 'start' : s === C.length - 1 ? 'end' : 'middle',
                            fontSize: 11,
                            fill: 'var(--muted)',
                            children: (0, a.formatClock)(new Date(e).toISOString()).slice(0, 5),
                          },
                          e,
                        ),
                      ),
                      e.candidates.map((e) => {
                        const a = u
                          .map((t) => ({ t: Date.parse(t.at), v: t.values[e.key] }))
                          .filter((e) => null != e.v)
                          .map((e, t) => `${0 === t ? 'M' : 'L'}${k(e.t).toFixed(1)},${w(e.v).toFixed(1)}`)
                          .join('');
                        return (0, t.jsx)(
                          'path',
                          {
                            d: a,
                            fill: 'none',
                            stroke: e.color,
                            strokeWidth: 2,
                            strokeLinejoin: 'round',
                            strokeLinecap: 'round',
                          },
                          e.key,
                        );
                      }),
                      e.candidates.map((e) => {
                        const a = M.values[e.key];
                        return null == a
                          ? null
                          : (0, t.jsx)(
                              'circle',
                              {
                                cx: k(h),
                                cy: w(a),
                                r: 3.5,
                                fill: e.color,
                                stroke: 'var(--surface)',
                                strokeWidth: 2,
                              },
                              e.key,
                            );
                      }),
                      $ &&
                        (0, t.jsxs)('g', {
                          children: [
                            (0, t.jsx)('line', {
                              x1: k(Date.parse($.at)),
                              x2: k(Date.parse($.at)),
                              y1: 16,
                              y2: 252,
                              stroke: 'var(--line-strong)',
                            }),
                            e.candidates.map((e) => {
                              const a = $.values[e.key];
                              return null == a
                                ? null
                                : (0, t.jsx)(
                                    'circle',
                                    {
                                      cx: k(Date.parse($.at)),
                                      cy: w(a),
                                      r: 4,
                                      fill: e.color,
                                      stroke: 'var(--surface)',
                                      strokeWidth: 2,
                                    },
                                    e.key,
                                  );
                            }),
                          ],
                        }),
                    ],
                  }),
                $ &&
                  null != o &&
                  (0, t.jsxs)('div', {
                    className:
                      'pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-line-strong bg-surface px-3 py-2 text-[12.5px] shadow-lg',
                    style: { left: Math.min(Math.max(8, k(Date.parse($.at)) + 12), v - 190) },
                    children: [
                      (0, t.jsxs)('p', {
                        className: 'font-mono text-muted',
                        children: [(0, a.formatClock)($.at), ' BRT'],
                      }),
                      [...e.candidates]
                        .sort((e, t) => ($.values[t.key] ?? 0) - ($.values[e.key] ?? 0))
                        .map((e) =>
                          (0, t.jsxs)(
                            'p',
                            {
                              className: 'flex items-center justify-between gap-3',
                              children: [
                                (0, t.jsxs)('span', {
                                  className: 'flex items-center gap-1.5 text-ink-2',
                                  children: [
                                    (0, t.jsx)('span', {
                                      className: 'inline-block size-2 rounded-full',
                                      style: { background: e.color },
                                      'aria-hidden': !0,
                                    }),
                                    (0, l.displayName)(e.name),
                                  ],
                                }),
                                (0, t.jsx)('span', {
                                  className: 'font-medium',
                                  children: (0, l.fmtPct)($.values[e.key], 3),
                                }),
                              ],
                            },
                            e.key,
                          ),
                        ),
                      (0, t.jsxs)('p', {
                        className: 'mt-1 border-t border-line pt-1 text-muted',
                        children: ['Totalização ', (0, l.fmtPct)($.countedPct)],
                      }),
                    ],
                  }),
              ],
            }),
            (0, t.jsx)('p', {
              className: 'mt-2 text-[12.5px] text-muted',
              children:
                'Percentuais parciais refletem apenas os votos totalizados até cada momento e podem mudar até o fim da apuração.',
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
      n = e.i(39242),
      i = e.i(56324),
      r = e.i(1856),
      o = e.i(91739);
    function d({ result: e, top: a = 6 }) {
      const l = e.candidates
          .filter(s.hasValidVotes)
          .slice(0, a)
          .filter((e) => (e.percent ?? 0) > 0),
        n = 100 - l.reduce((e, t) => e + (t.percent ?? 0), 0);
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
                  .map((e) => `${(0, i.displayName)(e.ballotName)} ${(0, i.fmtPct)(e.percent)}`)
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
                  n > 0.05 && (0, t.jsx)('span', { className: 'bar h-full flex-1 rounded-r-[4px] bg-line' }),
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
      const n = (0, i.fmtPp)(e.deltaPp),
        r = (0, i.fmtSigned)(e.deltaVotes),
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
            children: (0, i.initials)(e.ballotName),
          }),
          (0, t.jsxs)('div', {
            className: 'min-w-0',
            children: [
              (0, t.jsxs)('p', {
                className: 'flex items-center gap-2 truncate font-medium',
                children: [
                  (0, t.jsxs)('span', { className: 'sr-only', children: [l, 'º. '] }),
                  (0, t.jsx)('span', { className: 'truncate', children: (0, i.displayName)(e.ballotName) }),
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
                        (0, i.displayName)(o[0].ballotName),
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
                children: a.votesPublishable ? (0, i.fmtPct)(e.percent) : '—',
              }),
              (0, t.jsx)('p', {
                className: 'mt-1 text-[12px] text-muted',
                children: a.votesPublishable ? `${(0, i.fmtInt)(e.votes)} votos` : 'não divulgado',
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
              n ?? r ?? ' ',
              n && r && (0, t.jsxs)('span', { className: 'sr-only', children: [' (', r, ' votos)'] }),
            ],
          }),
        ],
      });
    }
    function u({ result: e, collapsed: a }) {
      const [s, l] = (0, n.useState)(!1),
        i = a && !s ? e.candidates.slice(0, a) : e.candidates;
      return (0, t.jsxs)(t.Fragment, {
        children: [
          (0, t.jsx)('ol', {
            className: 'divide-y divide-line',
            children: i.map((a, s) => (0, t.jsx)(m, { c: a, result: e, rank: s + 1 }, a.key)),
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
                          children: (0, i.fmtInt)(l.nominalVotes),
                        }),
                        (0, t.jsx)('td', {
                          className: 'py-2 text-right',
                          children: (0, i.fmtInt)(l.legendVotes),
                        }),
                        (0, t.jsx)('td', { className: 'py-2 text-right', children: (0, i.fmtInt)(l.total) }),
                        (0, t.jsx)('td', {
                          className: 'py-2 text-right',
                          children: (0, i.fmtPct)((0, s.percent)(l.total, a)),
                        }),
                        (0, t.jsx)('td', {
                          className: 'py-2 text-right',
                          children: e.final ? (0, i.fmtInt)(l.seats) : '—',
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
        n = t.get('cargo');
      return [
        e.find((e) => e.slug === n) ?? e[0],
        (e) => {
          const l = new URLSearchParams(t);
          l.set('cargo', e), a.replace(`${s}?${l}`, { scroll: !1 });
        },
      ];
    }
    function h({ offices: e, value: a, onChange: s }) {
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
    function f({ result: e }) {
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
      f,
      'RaceBar',
      0,
      d,
      'ResultPanel',
      0,
      ({ roundSlug: e, areaKey: a, offices: s, initial: l }) => {
        const [c, m] = p(s),
          [g, j] = (0, n.useState)('candidates'),
          [b, v] = (0, n.useState)(void 0),
          N = (0, r.useResult)(e, a, c?.slug, b),
          y = N.data ?? (l && l.office.slug === c?.slug ? l : void 0);
        return c
          ? (0, t.jsxs)('div', {
              children: [
                (0, t.jsx)(h, {
                  offices: s,
                  value: c.slug,
                  onChange: (e) => {
                    v(void 0), j('candidates'), m(e);
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
                              (0, i.fmtPct)(y.progress.countedPct),
                              ' das seções · ',
                              (0, i.fmtInt)(y.votes.valid),
                              ' votos válidos',
                              y.seats && y.seats > 1 ? ` \xb7 ${y.seats} vagas` : '',
                            ],
                          }),
                          'proportional' === y.office.kind &&
                            (0, t.jsx)(o.Segmented, {
                              label: 'Visualização',
                              value: g,
                              onChange: j,
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
                                    (0, i.fmtInt)(y.candidatesTotal),
                                    ' candidatos',
                                  ],
                                }),
                            ],
                          })
                        : (0, t.jsx)(x, { result: y }),
                      (0, t.jsx)(f, { result: y }),
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
    function n(e) {
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
      n,
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
        const t = n(e)
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
