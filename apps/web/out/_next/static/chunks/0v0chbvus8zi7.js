(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  836,
  (e) => {
    var o = e.i(19496);
    e.s([
      'default',
      0,
      ({ reset: e }) =>
        (0, o.jsxs)('main', {
          className: 'mx-auto max-w-xl px-4 py-24',
          children: [
            (0, o.jsx)('h1', {
              className: 'text-2xl font-semibold',
              children: 'Algo deu errado ao montar esta página',
            }),
            (0, o.jsx)('p', {
              className: 'mt-2 text-ink-2',
              children: 'Os dados continuam sendo coletados. Tente carregar de novo.',
            }),
            (0, o.jsx)('button', {
              type: 'button',
              onClick: e,
              className: 'mt-6 h-10 rounded-lg border border-line-strong px-4',
              children: 'Tentar de novo',
            }),
          ],
        }),
    ]);
  },
]);
