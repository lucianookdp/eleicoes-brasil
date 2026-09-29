(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  31598,
  (t) => {
    var e = t.i(19496),
      a = t.i(39242),
      i = t.i(1856),
      s = t.i(50614),
      n = t.i(97026),
      r = t.i(64535),
      l = t.i(91739);
    function o() {
      const { round: t } = (0, n.useRound)(),
        { data: o, error: u, refetch: m } = (0, i.useOverview)(t.slug),
        [c, d] = (0, a.useState)('list');
      if (!o)
        return u
          ? (0, e.jsx)(l.ErrorNotice, { error: u, retry: () => m() })
          : (0, e.jsx)(l.Skeleton, { className: 'h-96' });
      const p = o.states.filter((t) => 'ZZ' !== t.uf),
        f = o.round.offices.some((t) => 'country' === t.scope);
      return (0, e.jsxs)(e.Fragment, {
        children: [
          (0, e.jsxs)('div', {
            className: 'mb-4 flex flex-wrap items-end justify-between gap-3',
            children: [
              (0, e.jsxs)('div', {
                children: [
                  (0, e.jsx)('h1', {
                    className: 'text-[24px] font-semibold tracking-tight sm:text-[28px]',
                    children: 'Estados',
                  }),
                  (0, e.jsx)('p', {
                    className: 'text-[13.5px] text-muted',
                    children: 'Apuração por estado. Toque em um estado para ver cargos e municípios.',
                  }),
                ],
              }),
              (0, e.jsx)('div', {
                className: 'lg:hidden',
                children: (0, e.jsx)(l.Segmented, {
                  label: 'Visualização',
                  value: c,
                  onChange: d,
                  options: [
                    { value: 'list', label: 'Lista' },
                    { value: 'map', label: 'Mapa' },
                  ],
                }),
              }),
            ],
          }),
          (0, e.jsxs)('div', {
            className: 'grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0',
            children: [
              (0, e.jsx)(l.Panel, {
                className: `p-3 sm:p-4 lg:sticky lg:top-20 lg:col-span-5 lg:block ${'map' === c ? '' : 'hidden'}`,
                children: (0, e.jsx)(s.BrazilMap, { states: p, allowLeader: f }),
              }),
              (0, e.jsx)('div', {
                className: `lg:col-span-7 lg:block ${'list' === c ? '' : 'hidden'}`,
                children: (0, e.jsx)(r.StatesTable, { states: p, leaderLabel: f ? 'Mais votado' : void 0 }),
              }),
            ],
          }),
        ],
      });
    }
    t.s(['default', 0, () => (0, e.jsx)(o, {})], 31598);
  },
  56324,
  (t) => {
    const e = new Intl.NumberFormat('pt-BR'),
      a = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }),
      i = new Map(),
      s = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);
    function n(t) {
      return t !== t.toUpperCase()
        ? t
        : t
            .toLocaleLowerCase('pt-BR')
            .split(' ')
            .map((t, e) => (e > 0 && s.has(t) ? t : t.charAt(0).toLocaleUpperCase('pt-BR') + t.slice(1)))
            .join(' ');
    }
    t.s([
      'ago',
      0,
      (t, e = Date.now()) => {
        if (!t) return '—';
        const a = Math.max(0, Math.round((e - Date.parse(t)) / 1e3));
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
      (t) => (null == t ? '—' : a.format(t)),
      'fmtInt',
      0,
      (t) => (null == t ? '—' : e.format(t)),
      'fmtPct',
      0,
      (t, e = 2) => {
        if (null == t || !Number.isFinite(t)) return '—';
        let a = i.get(e);
        return (
          a ||
            ((a = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: e, maximumFractionDigits: e })),
            i.set(e, a)),
          `${a.format(t)}%`
        );
      },
      'fmtPp',
      0,
      (t) => {
        if (null == t || !Number.isFinite(t) || 0.005 > Math.abs(t)) return null;
        const e = Math.abs(t).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${t > 0 ? '+' : '−'}${e} pp`;
      },
      'fmtSigned',
      0,
      (t) => (null == t || 0 === t ? null : `${t > 0 ? '+' : '−'}${e.format(Math.abs(t))}`),
      'initials',
      0,
      (t) => {
        const e = n(t)
          .split(' ')
          .filter((t) => !s.has(t));
        return ((e[0]?.[0] ?? '') + (e.length > 1 ? (e.at(-1)?.[0] ?? '') : '')).toUpperCase();
      },
    ]);
  },
]);
