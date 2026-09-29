(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  40716,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var s = e.i(98460),
      a = e.i(38824),
      n = e.i(78071),
      l = e.i(56324),
      r = e.i(1856),
      i = e.i(97026),
      o = e.i(91739);
    function c() {
      const { round: e } = (0, i.useRound)(),
        c = (0, n.useSearchParams)(),
        d = (0, n.useRouter)(),
        m = (0, n.usePathname)(),
        u = (c.get('estados') ?? 'SP,MG,RJ')
          .split(',')
          .filter((e) => s.DOMESTIC_STATES.some((t) => t.code === e))
          .slice(0, 8),
        p = (0, r.useOverview)(e.slug),
        x = (p.data?.round.offices ?? []).filter((e) => 'city' !== e.scope),
        h = c.get('cargo') ?? x[0]?.slug,
        { data: f, error: g, refetch: b, isFetching: j } = (0, r.useCompare)(e.slug, u, h),
        N = (e) => {
          const t = new URLSearchParams(c);
          e.estados && t.set('estados', e.estados.join(',')),
            e.cargo && t.set('cargo', e.cargo),
            d.replace(`${m}?${t}`, { scroll: !1 });
        };
      return (0, t.jsxs)(t.Fragment, {
        children: [
          (0, t.jsxs)('div', {
            className: 'mb-4',
            children: [
              (0, t.jsx)('h1', {
                className: 'text-[24px] font-semibold tracking-tight sm:text-[28px]',
                children: 'Comparar estados',
              }),
              (0, t.jsxs)('p', {
                className: 'text-[13.5px] text-muted',
                children: ['Escolha até ', 8, ' estados.'],
              }),
            ],
          }),
          (0, t.jsxs)('fieldset', {
            className: 'mb-4',
            children: [
              (0, t.jsx)('legend', { className: 'sr-only', children: 'Estados' }),
              (0, t.jsx)('div', {
                className: 'flex flex-wrap gap-1.5',
                children: s.DOMESTIC_STATES.map((e) => {
                  const s = u.includes(e.code);
                  return (0, t.jsx)(
                    'button',
                    {
                      type: 'button',
                      'aria-pressed': s,
                      title: e.name,
                      disabled: !s && u.length >= 8,
                      onClick: () => {
                        let t;
                        return (
                          (t = e.code),
                          N({ estados: u.includes(t) ? u.filter((e) => e !== t) : [...u, t].slice(0, 8) })
                        );
                      },
                      className:
                        'h-9 min-w-11 rounded-md border border-line px-2 font-mono text-[13px] text-muted hover:border-line-strong disabled:opacity-40 aria-pressed:border-live aria-pressed:bg-live-soft aria-pressed:text-ink',
                      children: e.code,
                    },
                    e.code,
                  );
                }),
              }),
            ],
          }),
          x.length > 1 &&
            (0, t.jsxs)('label', {
              className: 'mb-5 flex items-center gap-2 text-[13px] text-muted',
              children: [
                'Cargo',
                (0, t.jsx)('select', {
                  value: h,
                  onChange: (e) => N({ cargo: e.target.value }),
                  className: 'h-10 rounded-lg border border-line bg-surface px-2 text-[14px] text-ink',
                  children: x.map((e) => (0, t.jsx)('option', { value: e.slug, children: e.name }, e.slug)),
                }),
              ],
            }),
          0 === u.length && (0, t.jsx)(o.EmptyState, { title: 'Selecione ao menos um estado.' }),
          g && (0, t.jsx)(o.ErrorNotice, { error: g, retry: () => b() }),
          !f && !g && u.length > 0 && (0, t.jsx)(o.Skeleton, { className: 'h-80' }),
          f &&
            u.length > 0 &&
            (0, t.jsx)('ul', {
              className: `grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${j ? 'opacity-80' : ''}`,
              children: f.states.map((e) => {
                const s = e.progress,
                  n = e.votes;
                return (0, t.jsx)(
                  'li',
                  {
                    children: (0, t.jsxs)(o.Panel, {
                      className: 'h-full p-4',
                      children: [
                        (0, t.jsxs)('p', {
                          className: 'flex items-baseline justify-between gap-2',
                          children: [
                            (0, t.jsx)('span', { className: 'font-semibold', children: e.name }),
                            (0, t.jsx)('span', {
                              className: 'font-mono text-[12px] text-muted',
                              children: e.uf,
                            }),
                          ],
                        }),
                        (0, t.jsx)('p', {
                          className: 'numeral mt-1 text-[28px] leading-none',
                          children: s && 'not-started' !== s.status ? (0, l.fmtPct)(s.countedPct) : '—',
                        }),
                        (0, t.jsx)('p', { className: 'text-[12.5px] text-muted', children: 'apurado' }),
                        (0, t.jsx)('dl', {
                          className: 'mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]',
                          children: [
                            ['Comparecimento', (0, l.fmtPct)(s?.turnoutPct, 1)],
                            ['Abstenção', (0, l.fmtPct)(s?.abstentionPct, 1)],
                            ['Válidos', (0, l.fmtPct)((0, a.percent)(n?.valid, n?.total), 1)],
                            ['Brancos', (0, l.fmtPct)((0, a.percent)(n?.blank, n?.total), 1)],
                            ['Nulos', (0, l.fmtPct)((0, a.percent)(n?.null, n?.total), 1)],
                            ['Votos', (0, l.fmtInt)(n?.total)],
                          ].map(([e, s]) =>
                            (0, t.jsxs)(
                              'div',
                              {
                                className: 'contents',
                                children: [
                                  (0, t.jsx)('dt', { className: 'text-muted', children: e }),
                                  (0, t.jsx)('dd', { className: 'text-right', children: s }),
                                ],
                              },
                              e,
                            ),
                          ),
                        }),
                        e.candidates.length > 0 &&
                          (0, t.jsx)('ol', {
                            className: 'mt-3 grid gap-2 border-t border-line pt-3',
                            children: e.candidates
                              .slice(0, 4)
                              .map((e) =>
                                (0, t.jsxs)(
                                  'li',
                                  {
                                    children: [
                                      (0, t.jsxs)('p', {
                                        className: 'flex justify-between gap-2 text-[13px]',
                                        children: [
                                          (0, t.jsx)('span', {
                                            className: 'truncate',
                                            children: (0, l.displayName)(e.name),
                                          }),
                                          (0, t.jsx)('span', {
                                            className: 'font-medium',
                                            children: (0, l.fmtPct)(e.percent, 1),
                                          }),
                                        ],
                                      }),
                                      (0, t.jsx)('div', {
                                        className: 'mt-1 h-1.5 rounded-full bg-line',
                                        children: (0, t.jsx)('div', {
                                          className: 'bar h-full rounded-full',
                                          style: { width: `${e.percent ?? 0}%`, background: e.color },
                                        }),
                                      }),
                                    ],
                                  },
                                  e.key,
                                ),
                              ),
                          }),
                      ],
                    }),
                  },
                  e.uf,
                );
              }),
            }),
        ],
      });
    }
    e.s(['default', 0, () => (0, t.jsx)(c, {})], 40716);
  },
  56324,
  (e) => {
    const t = new Intl.NumberFormat('pt-BR'),
      s = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }),
      a = new Map(),
      n = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);
    function l(e) {
      return e !== e.toUpperCase()
        ? e
        : e
            .toLocaleLowerCase('pt-BR')
            .split(' ')
            .map((e, t) => (t > 0 && n.has(e) ? e : e.charAt(0).toLocaleUpperCase('pt-BR') + e.slice(1)))
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
      l,
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
        const t = l(e)
          .split(' ')
          .filter((e) => !n.has(e));
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
