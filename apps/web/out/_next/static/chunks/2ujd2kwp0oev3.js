(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  31035,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var a = e.i(3485),
      s = e.i(70837),
      l = e.i(39242),
      r = e.i(56324),
      n = e.i(1856),
      i = e.i(13174),
      o = e.i(45095),
      d = e.i(64523),
      c = e.i(49725),
      m = e.i(97026),
      u = e.i(91739);
    function x() {
      const { round: e, elections: x, href: h, meta: f } = (0, m.useRound)(),
        g = (0, n.useTimeline)(e.slug),
        j = (0, n.useOverview)(e.slug),
        v = j.data?.round.offices.find((e) => 'country' === e.scope),
        b = (0, n.useSeries)(e.slug, v?.slug, 'br'),
        N = g.data?.points ?? [],
        [y, k] = (0, l.useState)(null),
        [w, P] = (0, l.useState)(!1),
        S = y ?? N.length - 1,
        M = N[S]?.at ?? null,
        $ = (0, n.useTimelineAt)(e.slug, M),
        C = x.filter((t) => t.slug === `replay-${e.electionSlug}`).flatMap((e) => e.rounds);
      return (
        (0, l.useEffect)(() => {
          if (!w) return;
          const e = setInterval(() => {
            k((e) => {
              const t = (e ?? 0) + 1;
              return t >= N.length - 1 && P(!1), Math.min(t, N.length - 1);
            });
          }, 350);
          return () => clearInterval(e);
        }, [w, N.length]),
        (0, t.jsxs)(t.Fragment, {
          children: [
            (0, t.jsxs)('div', {
              className: 'mb-5',
              children: [
                (0, t.jsx)('h1', {
                  className: 'text-[24px] font-semibold tracking-tight sm:text-[28px]',
                  children: 'Histórico da apuração',
                }),
                (0, t.jsx)('p', {
                  className: 'text-[13.5px] text-muted',
                  children:
                    'Volte a qualquer momento da totalização e veja os números como estavam naquela hora.',
                }),
              ],
            }),
            g.error && (0, t.jsx)(u.ErrorNotice, { error: g.error, retry: () => g.refetch() }),
            g.data &&
              N.length < 2 &&
              (0, t.jsx)(u.EmptyState, {
                title:
                  'dados-abertos' === e.environment
                    ? 'Esta eleição tem apenas o resultado final.'
                    : 'Ainda não há histórico suficiente.',
                children:
                  'dados-abertos' === e.environment
                    ? 'Ela foi importada dos Dados Abertos do TSE, que publicam só os números finais, sem o registro minuto a minuto da apuração.'
                    : 'O histórico começa a ser gravado com as primeiras parciais da apuração.',
              }),
            !g.data && !g.error && (0, t.jsx)(u.Skeleton, { className: 'h-40' }),
            N.length >= 2 &&
              (0, t.jsxs)(t.Fragment, {
                children: [
                  (0, t.jsxs)(u.Panel, {
                    className: 'mb-6 p-4 sm:p-5',
                    children: [
                      (0, t.jsxs)('div', {
                        className: 'mb-3 flex flex-wrap items-end justify-between gap-3',
                        children: [
                          (0, t.jsxs)('div', {
                            children: [
                              (0, t.jsx)('p', {
                                className: 'text-[13px] text-muted',
                                children: 'Como estava às',
                              }),
                              (0, t.jsx)('p', {
                                className: 'numeral text-[34px] leading-none',
                                children: M ? (0, a.formatClock)(M) : '—',
                              }),
                            ],
                          }),
                          (0, t.jsxs)('div', {
                            className: 'text-right',
                            children: [
                              (0, t.jsx)('p', {
                                className: 'text-[13px] text-muted',
                                children: 'Apuração naquele momento',
                              }),
                              (0, t.jsx)('p', {
                                className: 'numeral text-[34px] leading-none',
                                children: (0, r.fmtPct)(N[S]?.countedPct),
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, t.jsx)(p, { points: N, index: S }),
                      (0, t.jsxs)('div', {
                        className: 'mt-3 flex items-center gap-3',
                        children: [
                          (0, t.jsx)('button', {
                            type: 'button',
                            onClick: () => {
                              S >= N.length - 1 && k(0), P((e) => !e);
                            },
                            className:
                              'h-10 shrink-0 rounded-lg border border-line-strong px-4 text-[14px] font-medium hover:bg-surface-2',
                            children: w ? 'Pausar' : 'Reproduzir',
                          }),
                          (0, t.jsxs)('label', {
                            className: 'flex-1',
                            children: [
                              (0, t.jsx)('span', { className: 'sr-only', children: 'Momento da apuração' }),
                              (0, t.jsx)('input', {
                                type: 'range',
                                min: 0,
                                max: N.length - 1,
                                value: S,
                                onChange: (e) => {
                                  P(!1), k(Number(e.target.value));
                                },
                                'aria-valuetext': M
                                  ? `${(0, a.formatClock)(M)}, ${(0, r.fmtPct)(N[S]?.countedPct)} apurado`
                                  : void 0,
                                className: 'h-10 w-full accent-[var(--live)]',
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, t.jsxs)('div', {
                        className: 'flex justify-between font-mono text-[12px] text-muted',
                        children: [
                          (0, t.jsx)('span', { children: (0, a.formatClock)(N[0].at) }),
                          (0, t.jsx)('span', { children: (0, a.formatClock)(N.at(-1).at) }),
                        ],
                      }),
                    ],
                  }),
                  (0, t.jsxs)('div', {
                    className: 'mb-8 grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0',
                    children: [
                      (0, t.jsxs)(u.Panel, {
                        className: 'p-4 sm:p-5 lg:col-span-7',
                        children: [
                          (0, t.jsxs)('h2', {
                            className: 'mb-1 text-[17px] font-semibold',
                            children: [v?.name ?? 'Resultado', ' naquele momento'],
                          }),
                          $.data?.headline
                            ? (0, t.jsxs)(t.Fragment, {
                                children: [
                                  (0, t.jsx)(c.RaceBar, { result: $.data.headline }),
                                  (0, t.jsx)(c.CandidateList, { result: $.data.headline, collapsed: 4 }),
                                ],
                              })
                            : (0, t.jsx)('p', {
                                className: 'py-6 text-[14px] text-muted',
                                children: 'Sem votos apurados neste momento.',
                              }),
                        ],
                      }),
                      (0, t.jsxs)(u.Panel, {
                        className: 'p-4 sm:p-5 lg:col-span-5',
                        children: [
                          (0, t.jsx)('h2', {
                            className: 'mb-3 text-[17px] font-semibold',
                            children: 'Estados naquele momento',
                          }),
                          (0, t.jsx)('div', {
                            className: 'mx-auto grid max-w-[340px] grid-cols-7 gap-1',
                            children: ($.data?.states ?? []).map((e) => {
                              const a = o.TILES[e.uf];
                              if (!a) return null;
                              const l = e.countedPct ?? 0;
                              return (0, t.jsxs)(
                                s.default,
                                {
                                  href: h(`/states/${e.uf.toLowerCase()}`),
                                  title: `${e.uf}: ${(0, r.fmtPct)(e.countedPct)}${e.leader ? ` \xb7 ${(0, r.displayName)(e.leader.name)}` : ''}`,
                                  className:
                                    'relative flex aspect-square flex-col items-center justify-center rounded-md text-[11px] font-semibold',
                                  style: {
                                    gridColumn: a[0] + 1,
                                    gridRow: a[1] + 1,
                                    background: e.countedPct
                                      ? `color-mix(in oklab, var(--seq-high) ${l}%, var(--seq-low))`
                                      : 'var(--surface-2)',
                                    color: l > 55 ? 'var(--ground)' : 'var(--ink-2)',
                                  },
                                  children: [
                                    e.uf,
                                    e.leader &&
                                      (0, t.jsx)('span', {
                                        className: 'absolute bottom-1 size-1.5 rounded-full',
                                        style: { background: e.leader.color },
                                        'aria-hidden': !0,
                                      }),
                                  ],
                                },
                                e.uf,
                              );
                            }),
                          }),
                          (0, t.jsxs)('p', {
                            className: 'mt-3 text-center text-[12px] text-muted',
                            children: [
                              'Cor: percentual apurado. Ponto: mais votado para ',
                              v?.name?.toLowerCase() ?? 'o cargo',
                              '.',
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  v &&
                    (0, t.jsxs)('section', {
                      'aria-labelledby': 'evolucao-completa',
                      className: 'mb-8',
                      children: [
                        (0, t.jsx)(u.SectionTitle, { id: 'evolucao-completa', title: 'Evolução completa' }),
                        (0, t.jsx)(u.Panel, {
                          className: 'p-3 sm:p-4',
                          children: b.data
                            ? (0, t.jsx)(d.EvolutionChart, { series: b.data, majority: !0 })
                            : (0, t.jsx)(u.Skeleton, { className: 'h-72' }),
                        }),
                      ],
                    }),
                ],
              }),
            f?.features.replay !== !1 &&
              (0, t.jsxs)('section', {
                'aria-labelledby': 'replay',
                className: 'max-w-2xl',
                children: [
                  (0, t.jsx)(u.SectionTitle, { id: 'replay', title: 'Modo replay' }),
                  (0, t.jsxs)('p', {
                    className: 'text-[14px] text-ink-2',
                    children: [
                      'Uma apuração gravada pode ser reproduzida como se estivesse acontecendo de novo, em velocidade acelerada, com o comando',
                      ' ',
                      (0, t.jsxs)('code', {
                        className: 'rounded bg-surface-2 px-1 font-mono text-[13px]',
                        children: ['pnpm replay --election ', e.slug, ' --speed 10'],
                      }),
                      '.',
                    ],
                  }),
                  C.length > 0 &&
                    (0, t.jsx)('ul', {
                      className: 'mt-3 flex flex-wrap gap-2',
                      children: C.map((e) =>
                        (0, t.jsx)(
                          'li',
                          {
                            children: (0, t.jsxs)(s.default, {
                              href: (0, i.electionHref)(e),
                              className:
                                'inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-[14px] hover:border-line-strong',
                              children: ['Abrir replay do ', e.round, 'º turno'],
                            }),
                          },
                          e.slug,
                        ),
                      ),
                    }),
                ],
              }),
          ],
        })
      );
    }
    function p({ points: e, index: a }) {
      const s = Date.parse(e[0].at),
        l = Date.parse(e.at(-1).at),
        r = (e) => ((Date.parse(e) - s) / Math.max(1, l - s)) * 1e3,
        n = e
          .map(
            (e, t) =>
              `${t ? 'L' : 'M'}${r(e.at).toFixed(1)},${(64 - ((e.countedPct ?? 0) / 100) * 64).toFixed(1)}`,
          )
          .join(''),
        i = e[a];
      return (0, t.jsxs)('svg', {
        viewBox: '0 0 1000 64',
        preserveAspectRatio: 'none',
        className: 'h-16 w-full',
        role: 'img',
        'aria-label': 'Percentual apurado ao longo do tempo',
        children: [
          (0, t.jsx)('path', { d: `${n}L1000,64L0,64Z`, fill: 'var(--live-soft)' }),
          (0, t.jsx)('path', {
            d: n,
            fill: 'none',
            stroke: 'var(--live)',
            strokeWidth: 2,
            vectorEffect: 'non-scaling-stroke',
          }),
          (0, t.jsx)('line', {
            x1: r(i.at),
            x2: r(i.at),
            y1: 0,
            y2: 64,
            stroke: 'var(--ink)',
            strokeWidth: 1.5,
            vectorEffect: 'non-scaling-stroke',
          }),
        ],
      });
    }
    e.s(['default', 0, () => (0, t.jsx)(x, {})], 31035);
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
          j = Math.min(100, Math.ceil(Math.max(...f) + 2));
        r && g < 50 && j > 42 && (j = Math.max(j, 52));
        const v = (n = j - g) > 40 ? 10 : n > 16 ? 5 : n > 6 ? 2 : 1;
        g = Math.floor(g / v) * v;
        const b = o ?? 0,
          N = b - 40 - 16,
          y = 236,
          k = (e) => 40 + ((e - p) / Math.max(1, h - p)) * N,
          w = (e) => 16 + (1 - (e - g) / (j - g)) * y,
          P = Array.from(
            { length: Math.round(((j = Math.ceil(j / v) * v) - g) / v) + 1 },
            (e, t) => g + t * v,
          ),
          S = Array.from({ length: b < 480 ? 3 : 5 }, (e, t) => p + ((h - p) * t) / (b < 480 ? 2 : 4)),
          M = (e) => {
            let t = p + ((e - i.current.getBoundingClientRect().left - 40) / N) * (h - p),
              a = 0;
            for (let e = 1; e < u.length; e++)
              Math.abs(Date.parse(u[e].at) - t) < Math.abs(Date.parse(u[a].at) - t) && (a = e);
            m(a);
          },
          $ = null != c ? u[c] : null,
          C = u.at(-1);
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
              onPointerMove: (e) => M(e.clientX),
              onPointerDown: (e) => M(e.clientX),
              onPointerLeave: () => m(null),
              children: [
                null != o &&
                  (0, t.jsxs)('svg', {
                    width: b,
                    height: 280,
                    role: 'img',
                    'aria-label': `Evolu\xe7\xe3o do percentual de votos: ${e.candidates.map((e) => `${(0, l.displayName)(e.name)} ${(0, l.fmtPct)(C.values[e.key])}`).join(', ')}`,
                    children: [
                      P.map((e) =>
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
                        j > 50 &&
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
                      S.map((e, s) =>
                        (0, t.jsx)(
                          'text',
                          {
                            x: k(e),
                            y: 272,
                            textAnchor: 0 === s ? 'start' : s === S.length - 1 ? 'end' : 'middle',
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
                        const a = C.values[e.key];
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
                    style: { left: Math.min(Math.max(8, k(Date.parse($.at)) + 12), b - 190) },
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
          [g, j] = (0, r.useState)('candidates'),
          [v, b] = (0, r.useState)(void 0),
          N = (0, i.useResult)(e, a, c?.slug, v),
          y = N.data ?? (l && l.office.slug === c?.slug ? l : void 0);
        return c
          ? (0, t.jsxs)('div', {
              children: [
                (0, t.jsx)(h, {
                  offices: s,
                  value: c.slug,
                  onChange: (e) => {
                    b(void 0), j('candidates'), m(e);
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
  45095,
  (e) => {
    e.s([
      'TILES',
      0,
      {
        RR: [2, 0],
        AP: [4, 0],
        AM: [1, 1],
        PA: [3, 1],
        MA: [4, 1],
        CE: [5, 1],
        RN: [6, 1],
        AC: [0, 2],
        RO: [1, 2],
        MT: [2, 2],
        TO: [3, 2],
        PI: [4, 2],
        PE: [5, 2],
        PB: [6, 2],
        MS: [2, 3],
        GO: [3, 3],
        DF: [4, 3],
        BA: [5, 3],
        AL: [6, 3],
        PR: [2, 4],
        SP: [3, 4],
        MG: [4, 4],
        ES: [5, 4],
        SE: [6, 4],
        SC: [2, 5],
        RJ: [4, 5],
        RS: [2, 6],
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
