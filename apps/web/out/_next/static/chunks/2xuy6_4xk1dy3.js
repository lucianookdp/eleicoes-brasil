(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  44706,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var s = e.i(3485),
      a = e.i(39242),
      l = e.i(56324),
      i = e.i(1856),
      n = e.i(45095),
      r = e.i(73516),
      o = e.i(97026),
      d = e.i(91739);
    const c = {
      healthy: { label: 'Saudável', cls: 'text-live bg-live-soft', hint: 'Coletando normalmente.' },
      degraded: {
        label: 'Degradado',
        cls: 'text-warn bg-warn-soft',
        hint: 'A última coleta teve falhas. Os dados podem estar atrasados.',
      },
      offline: {
        label: 'Desconectado',
        cls: 'text-bad bg-bad-soft',
        hint: 'O coletor não responde há mais de 2 minutos.',
      },
      idle: {
        label: 'Parado',
        cls: 'text-muted bg-surface-2',
        hint: 'Nenhuma coleta em andamento para esta eleição.',
      },
      waiting: {
        label: 'Aguardando o TSE',
        cls: 'text-info bg-surface-2',
        hint: 'O TSE ainda não publicou os arquivos desta eleição. Conferimos a cada minuto.',
      },
    };
    function m() {
      const { round: e, meta: s } = (0, o.useRound)(),
        { data: n, error: m, refetch: g } = (0, i.useOperations)(e.slug),
        f = ((e = 1e3) => {
          const [t, s] = (0, a.useState)(() => Date.now());
          return (
            (0, a.useEffect)(() => {
              const t = setInterval(() => s(Date.now()), e);
              return () => clearInterval(t);
            }, [e]),
            t
          );
        })();
      if (!n)
        return m
          ? (0, t.jsx)(d.ErrorNotice, { error: m, retry: () => g() })
          : (0, t.jsx)(d.Skeleton, { className: 'h-96' });
      const b = c[n.ingestion.state];
      return (0, t.jsxs)(t.Fragment, {
        children: [
          (0, t.jsxs)('div', {
            className: 'mb-5',
            children: [
              (0, t.jsx)('h1', {
                className: 'text-[24px] font-semibold tracking-tight sm:text-[28px]',
                children: 'Ao vivo',
              }),
              (0, t.jsx)('p', {
                className: 'text-[13.5px] text-muted',
                children:
                  'O ritmo da apuração e o estado da nossa coleta de dados. Este painel não representa os sistemas internos do TSE.',
              }),
            ],
          }),
          (0, t.jsxs)(d.Panel, {
            className: 'mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[14px]',
            children: [
              (0, t.jsxs)('span', {
                className: `inline-flex items-center gap-2 rounded-md px-2.5 py-1 font-medium ${b.cls}`,
                children: [
                  (0, t.jsx)('span', {
                    className: `size-2 rounded-full bg-current ${'healthy' === n.ingestion.state ? 'pulse-dot' : ''}`,
                    'aria-hidden': !0,
                  }),
                  'Coletor: ',
                  b.label,
                ],
              }),
              (0, t.jsx)('span', { className: 'text-ink-2', children: b.hint }),
              (0, t.jsxs)('span', {
                className: 'text-muted',
                children: [
                  'Modo ',
                  n.ingestion.mode ?? '—',
                  ' · último ciclo',
                  ' ',
                  n.ingestion.lastCycleAt ? `h\xe1 ${(0, l.ago)(n.ingestion.lastCycleAt, f)}` : '—',
                ],
              }),
              n.ingestion.lastError &&
                (0, t.jsx)('span', {
                  className: 'w-full truncate font-mono text-[12px] text-warn',
                  children: n.ingestion.lastError,
                }),
            ],
          }),
          (0, t.jsxs)('section', {
            'aria-labelledby': 'ritmo',
            className: 'mb-8',
            children: [
              (0, t.jsx)(d.SectionTitle, {
                id: 'ritmo',
                title: 'Ritmo da apuração',
                children: 'Média dos últimos 5 minutos.',
              }),
              (0, t.jsxs)('div', {
                className: 'mb-3 rounded-xl border border-line bg-surface px-4 py-3',
                children: [
                  (0, t.jsx)('p', {
                    className: 'text-[13px] text-muted',
                    children:
                      'Atraso entre o TSE publicar e o dado estar aqui (Brasil e estados, últimos 15 min)',
                  }),
                  (0, t.jsxs)('p', {
                    className: 'numeral text-[28px] leading-tight',
                    children: [
                      null != n.delay.avgSeconds
                        ? `${n.delay.avgSeconds.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`
                        : '—',
                      (0, t.jsx)('span', {
                        className: 'ml-3 text-[14px] font-normal text-muted',
                        children:
                          null != n.delay.p95Seconds
                            ? `95% em at\xe9 ${n.delay.p95Seconds.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s \xb7 ${n.delay.samples} atualiza\xe7\xf5es`
                            : 'sem atualizações recentes',
                      }),
                    ],
                  }),
                ],
              }),
              (0, t.jsxs)('dl', {
                className: 'grid grid-cols-2 gap-3 lg:grid-cols-4',
                children: [
                  (0, t.jsx)(u, {
                    label: 'Seções por minuto',
                    value: (0, l.fmtInt)(Math.round(n.processing.sectionsPerMinute)),
                  }),
                  (0, t.jsx)(u, {
                    label: 'Votos por minuto',
                    value: (0, l.fmtCompact)(n.processing.votesPerMinute),
                  }),
                  (0, t.jsx)(u, {
                    label: 'Atualizações de estados por minuto',
                    value: n.processing.statesPerMinute.toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
                  }),
                  (0, t.jsx)(u, {
                    label: 'Atualizações de municípios por minuto',
                    value: n.processing.citiesPerMinute.toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
                  }),
                ],
              }),
            ],
          }),
          (0, t.jsxs)('div', {
            className: 'mb-8 grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0',
            children: [
              (0, t.jsxs)('section', {
                'aria-labelledby': 'calor',
                className: 'lg:col-span-5',
                children: [
                  (0, t.jsx)(d.SectionTitle, {
                    id: 'calor',
                    title: 'Onde a apuração andou',
                    children: 'Seções totalizadas por estado nos últimos 5 minutos.',
                  }),
                  (0, t.jsx)(d.Panel, { className: 'p-3 sm:p-4', children: (0, t.jsx)(x, { heat: n.heat }) }),
                ],
              }),
              (0, t.jsxs)('section', {
                'aria-labelledby': 'log',
                className: 'lg:col-span-7',
                children: [
                  (0, t.jsx)(d.SectionTitle, { id: 'log', title: 'Atualizações recentes' }),
                  (0, t.jsx)(d.Panel, {
                    className: 'max-h-[420px] overflow-y-auto px-3 py-1 sm:px-4',
                    children: (0, t.jsx)(r.ActivityFeed, { events: n.events, max: 60 }),
                  }),
                ],
              }),
            ],
          }),
          s?.features.advancedOperations !== !1 &&
            (0, t.jsxs)('section', {
              'aria-labelledby': 'coleta',
              className: 'mb-8',
              children: [
                (0, t.jsxs)(d.SectionTitle, {
                  id: 'coleta',
                  title: 'Coleta',
                  children: [
                    'Requisições do nosso coletor aos arquivos públicos do TSE nos últimos',
                    ' ',
                    n.requests.windowMinutes,
                    ' minutos.',
                  ],
                }),
                (0, t.jsxs)('dl', {
                  className: 'mb-4 grid grid-cols-3 gap-3 lg:grid-cols-6',
                  children: [
                    (0, t.jsx)(u, { label: 'Requisições', value: (0, l.fmtInt)(n.requests.total) }),
                    (0, t.jsx)(u, { label: 'HTTP 200', value: (0, l.fmtInt)(n.requests.ok) }),
                    (0, t.jsx)(u, {
                      label: 'HTTP 304',
                      value: (0, l.fmtInt)(n.requests.notModified),
                      detail: 'sem mudança',
                    }),
                    (0, t.jsx)(u, {
                      label: 'Erros',
                      value: (0, l.fmtInt)(n.requests.errors),
                      tone: n.requests.errors > 0 ? 'bad' : void 0,
                    }),
                    (0, t.jsx)(u, {
                      label: 'Latência média',
                      value:
                        null != n.requests.avgLatencyMs ? `${Math.round(n.requests.avgLatencyMs)} ms` : '—',
                    }),
                    (0, t.jsx)(u, {
                      label: 'Latência p95',
                      value:
                        null != n.requests.p95LatencyMs ? `${Math.round(n.requests.p95LatencyMs)} ms` : '—',
                    }),
                  ],
                }),
                (0, t.jsx)(d.Panel, {
                  className: 'p-3 sm:p-4',
                  children: (0, t.jsx)(p, { cycles: n.cycles }),
                }),
              ],
            }),
          (0, t.jsxs)('section', {
            'aria-labelledby': 'frescor',
            children: [
              (0, t.jsx)(d.SectionTitle, {
                id: 'frescor',
                title: 'Frescor dos dados',
                children: 'Há quanto tempo cada área recebeu dados novos.',
              }),
              (0, t.jsx)(h, { items: n.freshness, now: f }),
            ],
          }),
        ],
      });
    }
    function u({ label: e, value: s, detail: a, tone: l }) {
      return (0, t.jsxs)('div', {
        className: 'rounded-xl border border-line bg-surface px-3 py-2.5',
        children: [
          (0, t.jsx)('dt', { className: 'text-[12px] text-muted', children: e }),
          (0, t.jsx)('dd', {
            className: `numeral text-[22px] leading-tight ${'bad' === l ? 'text-bad' : ''}`,
            children: s,
          }),
          a && (0, t.jsx)('dd', { className: 'text-[11.5px] text-muted', children: a }),
        ],
      });
    }
    function x({ heat: e }) {
      const s = Math.max(1, ...e.map((e) => e.sections));
      return (0, t.jsxs)('div', {
        children: [
          (0, t.jsx)('div', {
            className: 'mx-auto grid max-w-[360px] grid-cols-7 gap-1',
            role: 'list',
            'aria-label': 'Seções totalizadas nos últimos 5 minutos por estado',
            children: e.map((e) => {
              const a = n.TILES[e.uf];
              if (!a) return null;
              const i = e.sections / s;
              return (0, t.jsx)(
                'div',
                {
                  role: 'listitem',
                  'aria-label': `${e.uf}: ${(0, l.fmtInt)(e.sections)} se\xe7\xf5es`,
                  title: `${e.uf}: ${(0, l.fmtInt)(e.sections)} se\xe7\xf5es, ${(0, l.fmtInt)(e.updates)} atualiza\xe7\xf5es`,
                  className:
                    'flex aspect-square flex-col items-center justify-center rounded-md text-[11px] font-semibold',
                  style: {
                    gridColumn: a[0] + 1,
                    gridRow: a[1] + 1,
                    background:
                      e.sections > 0
                        ? `color-mix(in oklab, var(--seq-high) ${Math.round(18 + 82 * i)}%, var(--seq-low))`
                        : 'var(--surface-2)',
                    color: i > 0.55 ? 'var(--ground)' : 'var(--ink-2)',
                  },
                  children: e.uf,
                },
                e.uf,
              );
            }),
          }),
          (0, t.jsxs)('div', {
            className: 'mt-3 flex items-center justify-center gap-2 text-[12px] text-muted',
            children: [
              (0, t.jsx)('span', { children: 'menos' }),
              (0, t.jsx)('span', {
                className: 'h-2 w-24 rounded-full',
                style: { background: 'linear-gradient(90deg, var(--seq-low), var(--seq-high))' },
                'aria-hidden': !0,
              }),
              (0, t.jsx)('span', { children: 'mais seções' }),
            ],
          }),
        ],
      });
    }
    function p({ cycles: e }) {
      const a = [...e].reverse(),
        i = Math.max(1, ...a.map((e) => e.requests));
      if (0 === a.length)
        return (0, t.jsx)('p', {
          className: 'py-6 text-center text-[14px] text-muted',
          children: 'Nenhum ciclo de coleta registrado.',
        });
      const n = a.at(-1);
      return (0, t.jsxs)('div', {
        children: [
          (0, t.jsxs)('p', {
            className: 'mb-2 text-[13px] text-muted',
            children: [
              'Requisições por ciclo (mais recente à direita). Último ciclo às ',
              (0, s.formatClock)(n.startedAt),
              ':',
              ' ',
              (0, l.fmtInt)(n.requests),
              ' requisições em',
              ' ',
              null != n.durationMs
                ? `${(n.durationMs / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`
                : '—',
              '.',
            ],
          }),
          (0, t.jsx)('div', {
            className: 'flex h-24 items-end gap-[2px]',
            role: 'img',
            'aria-label': `${a.length} ciclos de coleta`,
            children: a.map((e) =>
              (0, t.jsxs)(
                'div',
                {
                  title: `${(0, s.formatClock)(e.startedAt)} \xb7 ${e.requests} req \xb7 ${e.ok} ok \xb7 ${e.notModified} 304 \xb7 ${e.errors} erros \xb7 ${e.status}`,
                  className: 'flex min-w-[3px] flex-1 flex-col-reverse overflow-hidden rounded-t-[3px]',
                  style: { height: `${Math.max(4, (e.requests / i) * 100)}%` },
                  children: [
                    (0, t.jsx)('span', { className: 'bg-live', style: { flexGrow: e.ok || 0 } }),
                    (0, t.jsx)('span', {
                      className: 'bg-line-strong',
                      style: { flexGrow: e.notModified || 0 },
                    }),
                    (0, t.jsx)('span', { className: 'bg-bad', style: { flexGrow: e.errors || 0 } }),
                    0 === e.requests && (0, t.jsx)('span', { className: 'flex-1 bg-line' }),
                  ],
                },
                e.id,
              ),
            ),
          }),
          (0, t.jsxs)('ul', {
            className: 'mt-2 flex flex-wrap gap-x-4 text-[12px] text-muted',
            children: [
              (0, t.jsxs)('li', {
                className: 'flex items-center gap-1.5',
                children: [
                  (0, t.jsx)('span', { className: 'size-2.5 rounded-sm bg-live', 'aria-hidden': !0 }),
                  ' 200 (dados novos)',
                ],
              }),
              (0, t.jsxs)('li', {
                className: 'flex items-center gap-1.5',
                children: [
                  (0, t.jsx)('span', { className: 'size-2.5 rounded-sm bg-line-strong', 'aria-hidden': !0 }),
                  ' 304 (sem mudança)',
                ],
              }),
              (0, t.jsxs)('li', {
                className: 'flex items-center gap-1.5',
                children: [
                  (0, t.jsx)('span', { className: 'size-2.5 rounded-sm bg-bad', 'aria-hidden': !0 }),
                  ' erros',
                ],
              }),
            ],
          }),
        ],
      });
    }
    function h({ items: e, now: s }) {
      return (0, t.jsx)('ul', {
        className: 'grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7',
        children: e.map((e) => {
          const a = e.updatedAt ? (s - Date.parse(e.updatedAt)) / 1e3 : null;
          return (0, t.jsxs)(
            'li',
            {
              className: 'rounded-lg border border-line bg-surface px-2.5 py-2',
              children: [
                (0, t.jsx)('p', { className: 'truncate text-[12.5px] text-ink-2', children: e.name }),
                (0, t.jsx)('p', {
                  className: `font-mono text-[14px] ${null == a ? 'text-muted' : a < 60 ? 'text-live' : a < 300 ? 'text-warn' : 'text-muted'}`,
                  children: e.updatedAt ? `${(0, l.ago)(e.updatedAt, s)}` : 'sem dados',
                }),
              ],
            },
            e.areaKey,
          );
        }),
      });
    }
    e.s(['default', 0, () => (0, t.jsx)(m, {})], 44706);
  },
  73516,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var s = e.i(3485),
      a = e.i(39242),
      l = e.i(56324);
    const i = {
      'source.schema': 'Formato inesperado de arquivo',
      'source.unavailable': 'Fonte indisponível',
      'collector.error': 'Erro na coleta',
      'quality.issue': 'Inconsistência nos dados',
    };
    e.s([
      'ActivityFeed',
      0,
      ({ events: e, max: n = 30, dense: r = !1 }) => {
        const o = (0, a.useRef)(null),
          d = null == o.current;
        (0, a.useEffect)(() => {
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
                let a,
                  n = i[e.type];
                return (0, t.jsxs)(
                  'li',
                  {
                    className: `grid grid-cols-[4.6rem_minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-line/60 ${r ? 'py-1' : 'py-1.5'} ${((a = e.id), !d && !o.current.has(a)) ? 'enter-row' : ''}`,
                    children: [
                      (0, t.jsx)('time', {
                        dateTime: e.occurredAt,
                        className: 'text-muted',
                        children: (0, s.formatClock)(e.occurredAt),
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
  56324,
  (e) => {
    const t = new Intl.NumberFormat('pt-BR'),
      s = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }),
      a = new Map(),
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
        const s = Math.max(0, Math.round((t - Date.parse(e)) / 1e3));
        return s < 5
          ? 'agora'
          : s < 60
            ? `${s} s`
            : s < 3600
              ? `${Math.floor(s / 60)} min`
              : s < 86400
                ? `${Math.floor(s / 3600)} h`
                : `${Math.floor(s / 86400)} d`;
      },
      'displayName',
      0,
      i,
      'fmtCompact',
      0,
      (e) => (null == e ? '—' : s.format(e)),
      'fmtInt',
      0,
      (e) => (null == e ? '—' : t.format(e)),
      'fmtPct',
      0,
      (e, t = 2) => {
        if (null == e || !Number.isFinite(e)) return '—';
        let s = a.get(t);
        return (
          s ||
            ((s = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: t, maximumFractionDigits: t })),
            a.set(t, s)),
          `${s.format(e)}%`
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
]);
