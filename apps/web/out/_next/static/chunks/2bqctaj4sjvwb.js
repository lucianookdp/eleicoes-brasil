(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  2760,
  (e) => {
    var t = e.i(19496),
      a = e.i(70837),
      s = e.i(39242),
      l = e.i(46147),
      r = e.i(56324),
      n = e.i(1856),
      i = e.i(73516),
      o = e.i(50614),
      d = e.i(33533),
      c = e.i(64523),
      m = e.i(49725),
      u = e.i(97026),
      x = e.i(64535),
      p = e.i(91739);
    const h = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    function f({ compact: e = !1 }) {
      const { round: a } = (0, u.useRound)();
      return (0, t.jsxs)('div', {
        className: e ? 'mb-4' : 'mb-5',
        children: [
          (0, t.jsx)('h1', {
            className: 'text-[22px] font-semibold tracking-tight sm:text-[28px]',
            children: a.electionName,
          }),
          (0, t.jsxs)('p', {
            className: 'text-[13.5px] text-muted',
            children: [
              a.round,
              'º turno · ',
              h.format(new Date(`${a.date}T12:00:00Z`)),
              'simulado2026' === a.environment && ' · simulação oficial do TSE',
              'replay' === a.environment && ' · reprodução de uma apuração gravada',
              'dados-abertos' === a.environment && ' · resultado final (Dados Abertos do TSE)',
            ],
          }),
        ],
      });
    }
    const g = 'eleicoes:overview-tab';
    function v({ initial: e }) {
      const { round: l, href: h } = (0, u.useRound)(),
        { data: b, error: N, refetch: y } = (0, n.useOverview)(l.slug, e?.round.slug === l.slug ? e : null),
        [k, w] = (0, s.useState)('mapa');
      (0, s.useEffect)(() => {
        try {
          const e = localStorage.getItem(g);
          e && w(e);
        } catch {}
      }, []);
      const S = b?.headline ?? null,
        P = b?.round.offices.find((e) => 'country' === e.scope),
        $ = (0, n.useSeries)(l.slug, 'evolucao' === k ? P?.slug : void 0, 'br'),
        C = (0, n.useEvents)(l.slug, 25);
      if (!b)
        return (0, t.jsxs)(t.Fragment, {
          children: [
            (0, t.jsx)(f, {}),
            N
              ? (0, t.jsx)(p.ErrorNotice, { error: N, retry: () => y() })
              : (0, t.jsxs)('div', {
                  className: 'grid gap-4 lg:grid-cols-12 [&>*]:min-w-0',
                  children: [
                    (0, t.jsx)(p.Skeleton, { className: 'h-56 lg:col-span-7' }),
                    (0, t.jsx)(p.Skeleton, { className: 'h-96 lg:col-span-5' }),
                  ],
                }),
          ],
        });
      const T = b.states.filter((e) => 'ZZ' !== e.uf);
      return (0, t.jsxs)(t.Fragment, {
        children: [
          (0, t.jsx)(f, {}),
          (0, t.jsx)(p.FreshnessNotice, {
            ingestion: b.ingestion,
            progress: b.progress,
            roundStatus: b.round.status,
          }),
          (0, t.jsx)(j, { data: b }),
          (0, t.jsxs)('div', {
            className: 'grid items-start gap-4 lg:grid-cols-12 [&>*]:min-w-0 lg:gap-6',
            children: [
              (0, t.jsxs)('div', {
                className: 'grid gap-4 lg:col-span-7 lg:gap-6 [&>*]:min-w-0',
                children: [
                  (0, t.jsx)(p.Panel, {
                    className: 'p-4 sm:p-5',
                    children: (0, t.jsx)(d.CountingHero, {
                      progress: b.progress,
                      states: b.states,
                      votes: S?.votes,
                      votesFor: P?.name,
                    }),
                  }),
                  (0, t.jsx)(p.Panel, {
                    className: 'p-4 sm:p-5',
                    children: (0, t.jsxs)('section', {
                      'aria-labelledby': 'corrida',
                      children: [
                        (0, t.jsxs)('div', {
                          className: 'mb-1 flex items-baseline justify-between gap-3',
                          children: [
                            (0, t.jsx)('h2', {
                              id: 'corrida',
                              className: 'text-[17px] font-semibold tracking-tight',
                              children: P ? `${P.name}` : 'Resultados',
                            }),
                            S &&
                              (0, t.jsxs)('span', {
                                className: 'text-[12.5px] text-muted',
                                children: [(0, r.fmtPct)(S.progress.countedPct), ' apurado no Brasil'],
                              }),
                          ],
                        }),
                        !P &&
                          (0, t.jsx)(p.EmptyState, {
                            title: 'Nesta eleição os cargos são disputados por estado ou município.',
                            children: 'Escolha um estado no mapa ou na lista.',
                          }),
                        P &&
                          !S &&
                          (0, t.jsx)(p.EmptyState, {
                            title: 'Ainda não há votos apurados.',
                            children:
                              'Os resultados aparecem aqui assim que o TSE publicar a primeira parcial.',
                          }),
                        S &&
                          (0, t.jsxs)(t.Fragment, {
                            children: [
                              (0, t.jsx)(m.RaceBar, { result: S }),
                              (0, t.jsx)(m.CandidateList, { result: S, collapsed: 4 }),
                              (0, t.jsx)(m.Provenance, { result: S }),
                            ],
                          }),
                      ],
                    }),
                  }),
                ],
              }),
              (0, t.jsx)(p.Panel, {
                className: 'lg:sticky lg:top-20 lg:col-span-5',
                children: (0, t.jsxs)(p.Tabs, {
                  label: 'Detalhes da apuração',
                  value: k,
                  onChange: (e) => {
                    w(e);
                    try {
                      localStorage.setItem(g, e);
                    } catch {}
                  },
                  tabs: [
                    { value: 'mapa', label: 'Mapa' },
                    { value: 'estados', label: 'Estados' },
                    ...(P ? [{ value: 'evolucao', label: 'Evolução' }] : []),
                    { value: 'atividade', label: 'Atividade' },
                  ],
                  children: [
                    'mapa' === k && (0, t.jsx)(o.BrazilMap, { states: T, allowLeader: !!P }),
                    'estados' === k &&
                      (0, t.jsx)('div', {
                        className: 'max-h-[70vh] overflow-y-auto pr-1 lg:max-h-[calc(100vh-14rem)]',
                        children: (0, t.jsx)(x.StatesTable, {
                          states: T,
                          leaderLabel: P ? 'Mais votado' : void 0,
                          compact: !0,
                        }),
                      }),
                    'evolucao' === k &&
                      ($.data
                        ? (0, t.jsx)(c.EvolutionChart, { series: $.data, majority: !0 })
                        : (0, t.jsx)(p.Skeleton, { className: 'h-72' })),
                    'atividade' === k &&
                      (0, t.jsxs)(t.Fragment, {
                        children: [
                          (0, t.jsx)(i.ActivityFeed, { events: C.data ?? [], max: 18, dense: !0 }),
                          (0, t.jsx)(a.default, {
                            href: h('/operations'),
                            className: 'mt-3 inline-flex min-h-10 items-center text-[13.5px] text-info',
                            children: 'Abrir painel ao vivo',
                          }),
                        ],
                      }),
                  ],
                }),
              }),
            ],
          }),
        ],
      });
    }
    function j({ data: e }) {
      const { favorites: s } = (0, l.useFavorites)(),
        { href: n } = (0, u.useRound)();
      return 0 === s.length
        ? null
        : (0, t.jsx)('section', {
            id: 'favoritos',
            'aria-label': 'Favoritos',
            className: 'mb-4',
            children: (0, t.jsx)('ul', {
              className: '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0',
              children: s.map((s) => {
                const l = e.states.find((e) => e.uf.toLowerCase() === s.key),
                  i = l?.progress?.countedPct;
                return (0, t.jsx)(
                  'li',
                  {
                    className: 'shrink-0',
                    children: (0, t.jsxs)(a.default, {
                      href: n(s.path),
                      className:
                        'flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[13px] hover:border-line-strong',
                      children: [
                        (0, t.jsx)('span', { className: 'font-medium', children: s.label }),
                        (0, t.jsx)('span', {
                          className: 'text-muted',
                          children: null != i ? (0, r.fmtPct)(i, 1) : s.detail,
                        }),
                      ],
                    }),
                  },
                  s.key,
                );
              }),
            }),
          });
    }
    e.s(['default', 0, () => (0, t.jsx)(v, { initial: null })], 2760);
  },
  73516,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(3485),
      s = e.i(39242),
      l = e.i(56324);
    const r = {
      'source.schema': 'Formato inesperado de arquivo',
      'source.unavailable': 'Fonte indisponível',
      'collector.error': 'Erro na coleta',
      'quality.issue': 'Inconsistência nos dados',
    };
    e.s([
      'ActivityFeed',
      0,
      ({ events: e, max: n = 30, dense: i = !1 }) => {
        const o = (0, s.useRef)(null),
          d = null == o.current;
        (0, s.useEffect)(() => {
          o.current = new Set(e.map((e) => e.id));
        }, [e]);
        const c = e.slice(0, n);
        return 0 === c.length
          ? (0, t.jsx)('p', {
              className: 'py-6 text-center text-[14px] text-muted',
              children: 'Nenhuma atualização recebida ainda.',
            })
          : (0, t.jsx)('ol', {
              className: 'font-mono text-[12.5px]',
              'aria-live': 'polite',
              'aria-relevant': 'additions',
              children: c.map((e) => {
                let s,
                  n = r[e.type];
                return (0, t.jsxs)(
                  'li',
                  {
                    className: `grid grid-cols-[4.6rem_minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-line/60 ${i ? 'py-1' : 'py-1.5'} ${((s = e.id), !d && !o.current.has(s)) ? 'enter-row' : ''}`,
                    children: [
                      (0, t.jsx)('time', {
                        dateTime: e.occurredAt,
                        className: 'text-muted',
                        children: (0, a.formatClock)(e.occurredAt),
                      }),
                      (0, t.jsxs)('span', {
                        className: 'truncate font-sans text-[13.5px]',
                        children: [
                          n
                            ? (0, t.jsx)('span', { className: 'text-warn', children: n })
                            : (e.areaName ?? e.areaKey),
                          n &&
                            e.areaName &&
                            (0, t.jsxs)('span', { className: 'text-muted', children: [' · ', e.areaName] }),
                        ],
                      }),
                      (0, t.jsx)('span', {
                        className: 'text-right',
                        children: n
                          ? (0, t.jsx)('span', {
                              className: 'text-muted',
                              title: e.message ?? '',
                              children: 'ver log',
                            })
                          : e.sectionsAdded && e.sectionsAdded > 0
                            ? (0, t.jsxs)('span', {
                                className: 'text-live',
                                children: ['+', (0, l.fmtInt)(e.sectionsAdded), ' seções'],
                              })
                            : (0, t.jsx)('span', {
                                className: 'text-muted',
                                children: (0, l.fmtPct)(e.countedPct, 1),
                              }),
                      }),
                    ],
                  },
                  e.id,
                );
              }),
            });
      },
    ]);
  },
  33533,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(3485),
      s = e.i(38824),
      l = e.i(70837),
      r = e.i(39242),
      n = e.i(56324),
      i = e.i(97026),
      o = e.i(91739);
    const d = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul', 'Exterior'];
    function c({ states: e }) {
      const { href: a } = (0, i.useRound)(),
        s = e.filter((e) => e.progress?.sectionsTotal),
        r = s.reduce((e, t) => e + (t.progress?.sectionsTotal ?? 0), 0);
      if (0 === r) return null;
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
              const s = (e.progress.sectionsTotal / r) * 100,
                i = e.progress.countedPct ?? 0;
              return (0, t.jsxs)(
                l.default,
                {
                  role: 'listitem',
                  href: a(`/states/${e.uf.toLowerCase()}`),
                  title: `${e.name}: ${(0, n.fmtPct)(i)} apurado`,
                  'aria-label': `${e.name}: ${(0, n.fmtPct)(i)} apurado`,
                  className: 'group relative flex min-w-[3px] overflow-hidden rounded-[3px] bg-line',
                  style: { flexBasis: `${s}%`, flexGrow: 0, flexShrink: 1 },
                  children: [
                    (0, t.jsx)('span', {
                      className: 'bar absolute inset-y-0 left-0 bg-live/80 group-hover:bg-live',
                      style: { width: `${i}%` },
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
              const a = o.filter((t) => t.region === e).reduce((e, t) => e + t.progress.sectionsTotal, 0) / r;
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
      ({ progress: e, states: l, votes: i, votesFor: d, title: m = 'Apuração' }) => {
        const [u, x] = (0, r.useState)(!1),
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
                    : `das se\xe7\xf5es totalizadas \xb7 ${(0, n.fmtInt)(e.sectionsCounted)} de ${(0, n.fmtInt)(e.sectionsTotal)} (faltam ${(0, n.fmtInt)(h)})`
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
                  value: p && i ? (0, n.fmtPct)((0, s.percent)(i.valid, i.total), 1) : '—',
                  detail: i ? (0, n.fmtCompact)(i.valid) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: 'Brancos',
                  value: p && i ? (0, n.fmtPct)((0, s.percent)(i.blank, i.total), 1) : '—',
                  detail: i ? (0, n.fmtCompact)(i.blank) : void 0,
                }),
                (0, t.jsx)(o.Stat, {
                  label: 'Nulos',
                  value: p && i ? (0, n.fmtPct)((0, s.percent)(i.null, i.total), 1) : '—',
                  detail: i ? (0, n.fmtCompact)(i.null) : void 0,
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
      ({ series: e, majority: r }) => {
        var n;
        const i = (0, s.useRef)(null),
          [o, d] = (0, s.useState)(null),
          [c, m] = (0, s.useState)(null),
          u = e.points.filter((e) => Object.values(e.values).some((e) => null != e && e > 0)),
          x = u.length >= 2;
        if (
          ((0, s.useEffect)(() => {
            if (!x || !i.current) return;
            const e = new ResizeObserver(([e]) => d(Math.max(260, Math.floor(e.contentRect.width))));
            return e.observe(i.current), () => e.disconnect();
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
          v = Math.min(100, Math.ceil(Math.max(...f) + 2));
        r && g < 50 && v > 42 && (v = Math.max(v, 52));
        const j = (n = v - g) > 40 ? 10 : n > 16 ? 5 : n > 6 ? 2 : 1;
        g = Math.floor(g / j) * j;
        const b = o ?? 0,
          N = b - 40 - 16,
          y = 236,
          k = (e) => 40 + ((e - p) / Math.max(1, h - p)) * N,
          w = (e) => 16 + (1 - (e - g) / (v - g)) * y,
          S = Array.from(
            { length: Math.round(((v = Math.ceil(v / j) * j) - g) / j) + 1 },
            (e, t) => g + t * j,
          ),
          P = Array.from({ length: b < 480 ? 3 : 5 }, (e, t) => p + ((h - p) * t) / (b < 480 ? 2 : 4)),
          $ = (e) => {
            let t = p + ((e - i.current.getBoundingClientRect().left - 40) / N) * (h - p),
              a = 0;
            for (let e = 1; e < u.length; e++)
              Math.abs(Date.parse(u[e].at) - t) < Math.abs(Date.parse(u[a].at) - t) && (a = e);
            m(a);
          },
          C = null != c ? u[c] : null,
          T = u.at(-1);
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
              ref: i,
              className: 'relative w-full min-w-0 touch-pan-y select-none overflow-hidden',
              onPointerMove: (e) => $(e.clientX),
              onPointerDown: (e) => $(e.clientX),
              onPointerLeave: () => m(null),
              children: [
                null != o &&
                  (0, t.jsxs)('svg', {
                    width: b,
                    height: 280,
                    role: 'img',
                    'aria-label': `Evolu\xe7\xe3o do percentual de votos: ${e.candidates.map((e) => `${(0, l.displayName)(e.name)} ${(0, l.fmtPct)(T.values[e.key])}`).join(', ')}`,
                    children: [
                      S.map((e) =>
                        (0, t.jsxs)(
                          'g',
                          {
                            children: [
                              (0, t.jsx)('line', {
                                x1: 40,
                                x2: b - 16,
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
                      r &&
                        g < 50 &&
                        v > 50 &&
                        (0, t.jsxs)('g', {
                          children: [
                            (0, t.jsx)('line', {
                              x1: 40,
                              x2: b - 16,
                              y1: w(50),
                              y2: w(50),
                              stroke: 'var(--ink-2)',
                              strokeDasharray: '4 4',
                              strokeWidth: 1,
                            }),
                            (0, t.jsx)('text', {
                              x: b - 16,
                              y: w(50) - 5,
                              textAnchor: 'end',
                              fontSize: 11,
                              fill: 'var(--ink-2)',
                              children: '50%',
                            }),
                          ],
                        }),
                      P.map((e, s) =>
                        (0, t.jsx)(
                          'text',
                          {
                            x: k(e),
                            y: 272,
                            textAnchor: 0 === s ? 'start' : s === P.length - 1 ? 'end' : 'middle',
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
                        const a = T.values[e.key];
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
                      C &&
                        (0, t.jsxs)('g', {
                          children: [
                            (0, t.jsx)('line', {
                              x1: k(Date.parse(C.at)),
                              x2: k(Date.parse(C.at)),
                              y1: 16,
                              y2: 252,
                              stroke: 'var(--line-strong)',
                            }),
                            e.candidates.map((e) => {
                              const a = C.values[e.key];
                              return null == a
                                ? null
                                : (0, t.jsx)(
                                    'circle',
                                    {
                                      cx: k(Date.parse(C.at)),
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
                C &&
                  null != o &&
                  (0, t.jsxs)('div', {
                    className:
                      'pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-line-strong bg-surface px-3 py-2 text-[12.5px] shadow-lg',
                    style: { left: Math.min(Math.max(8, k(Date.parse(C.at)) + 12), b - 190) },
                    children: [
                      (0, t.jsxs)('p', {
                        className: 'font-mono text-muted',
                        children: [(0, a.formatClock)(C.at), ' BRT'],
                      }),
                      [...e.candidates]
                        .sort((e, t) => (C.values[t.key] ?? 0) - (C.values[e.key] ?? 0))
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
                                  children: (0, l.fmtPct)(C.values[e.key], 3),
                                }),
                              ],
                            },
                            e.key,
                          ),
                        ),
                      (0, t.jsxs)('p', {
                        className: 'mt-1 border-t border-line pt-1 text-muted',
                        children: ['Totalização ', (0, l.fmtPct)(C.countedPct)],
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
      r = e.i(39242),
      n = e.i(56324),
      i = e.i(1856),
      o = e.i(91739);
    function d({ result: e, top: a = 6 }) {
      const l = e.candidates
          .filter(s.hasValidVotes)
          .slice(0, a)
          .filter((e) => (e.percent ?? 0) > 0),
        r = 100 - l.reduce((e, t) => e + (t.percent ?? 0), 0);
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
                  r > 0.05 && (0, t.jsx)('span', { className: 'bar h-full flex-1 rounded-r-[4px] bg-line' }),
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
      const r = (0, n.fmtPp)(e.deltaPp),
        i = (0, n.fmtSigned)(e.deltaVotes),
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
              r ?? i ?? ' ',
              r && i && (0, t.jsxs)('span', { className: 'sr-only', children: [' (', i, ' votos)'] }),
            ],
          }),
        ],
      });
    }
    function u({ result: e, collapsed: a }) {
      const [s, l] = (0, r.useState)(!1),
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
        r = t.get('cargo');
      return [
        e.find((e) => e.slug === r) ?? e[0],
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
          [g, v] = (0, r.useState)('candidates'),
          [j, b] = (0, r.useState)(void 0),
          N = (0, i.useResult)(e, a, c?.slug, j),
          y = N.data ?? (l && l.office.slug === c?.slug ? l : void 0);
        return c
          ? (0, t.jsxs)('div', {
              children: [
                (0, t.jsx)(h, {
                  offices: s,
                  value: c.slug,
                  onChange: (e) => {
                    b(void 0), v('candidates'), m(e);
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
                              onChange: v,
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
                                  onClick: () => b(y.candidatesTotal),
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
    function r(e) {
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
      r,
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
        const t = r(e)
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
