(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  85472,
  (e) => {
    var a = e.i(19496),
      s = e.i(57922),
      t = e.i(78071),
      i = e.i(39242),
      l = e.i(97026),
      n = e.i(91739),
      r = e.i(77339);
    function c({ children: e }) {
      const i = (0, t.useSearchParams)(),
        o = (0, s.useQuery)({
          queryKey: ['elections'],
          queryFn: () => (0, r.api)('/api/elections'),
          refetchInterval: 6e4,
        }),
        u = (0, s.useQuery)({ queryKey: ['meta'], queryFn: () => (0, r.api)('/api/meta'), staleTime: 1 / 0 });
      return o.error
        ? (0, a.jsxs)('main', {
            className: 'mx-auto max-w-xl px-4 py-24',
            children: [
              (0, a.jsx)('h1', { className: 'text-2xl font-semibold', children: 'API indisponível' }),
              (0, a.jsx)('p', {
                className: 'mt-2 text-ink-2',
                children: 'Não foi possível carregar as eleições agora. Tente novamente em alguns instantes.',
              }),
            ],
          })
        : o.data
          ? (0, a.jsx)(l.ElectionShell, {
              electionSlug: i.get('e') ?? '',
              elections: o.data,
              meta: u.data ?? null,
              children: e,
            })
          : (0, a.jsxs)('main', {
              className: 'mx-auto grid max-w-[1320px] gap-4 px-4 py-8',
              children: [
                (0, a.jsx)(n.Skeleton, { className: 'h-10 w-64' }),
                (0, a.jsx)(n.Skeleton, { className: 'h-56' }),
              ],
            });
    }
    e.s([
      'default',
      0,
      ({ children: e }) => (0, a.jsx)(i.Suspense, { children: (0, a.jsx)(c, { children: e }) }),
    ]);
  },
]);
