(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  9259,
  (e) => {
    var t = e.i(19496);
    function r({ children: e, ...n }) {
      return (0, t.jsx)('svg', {
        viewBox: '0 0 24 24',
        width: 18,
        height: 18,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.75,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        ...n,
        children: e,
      });
    }
    e.s([
      'IconChevron',
      0,
      (e) => (0, t.jsx)(r, { ...e, children: (0, t.jsx)('path', { d: 'm9 6 6 6-6 6' }) }),
      'IconClose',
      0,
      (e) => (0, t.jsx)(r, { ...e, children: (0, t.jsx)('path', { d: 'M6 6l12 12M18 6 6 18' }) }),
      'IconCompare',
      0,
      (e) =>
        (0, t.jsx)(r, {
          ...e,
          children: (0, t.jsx)('path', { d: 'M8 3v18M16 3v18M3 8h5M16 16h5M3 16h5M16 8h5' }),
        }),
      'IconHistory',
      0,
      (e) =>
        (0, t.jsxs)(r, {
          ...e,
          children: [
            (0, t.jsx)('path', { d: 'M3 12a9 9 0 1 0 3-6.7L3 8' }),
            (0, t.jsx)('path', { d: 'M3 3v5h5M12 7v5l3 2' }),
          ],
        }),
      'IconInfo',
      0,
      (e) =>
        (0, t.jsxs)(r, {
          ...e,
          children: [
            (0, t.jsx)('circle', { cx: '12', cy: '12', r: '9' }),
            (0, t.jsx)('path', { d: 'M12 11v5M12 8h.01' }),
          ],
        }),
      'IconMoon',
      0,
      (e) =>
        (0, t.jsx)(r, {
          ...e,
          children: (0, t.jsx)('path', { d: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z' }),
        }),
      'IconMore',
      0,
      (e) =>
        (0, t.jsxs)(r, {
          ...e,
          children: [
            (0, t.jsx)('circle', { cx: '5', cy: '12', r: '1' }),
            (0, t.jsx)('circle', { cx: '12', cy: '12', r: '1' }),
            (0, t.jsx)('circle', { cx: '19', cy: '12', r: '1' }),
          ],
        }),
      'IconOverview',
      0,
      (e) =>
        (0, t.jsx)(r, { ...e, children: (0, t.jsx)('path', { d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' }) }),
      'IconPulse',
      0,
      (e) => (0, t.jsx)(r, { ...e, children: (0, t.jsx)('path', { d: 'M2 12h4l3-8 4 16 3-8h6' }) }),
      'IconSearch',
      0,
      (e) =>
        (0, t.jsxs)(r, {
          ...e,
          children: [
            (0, t.jsx)('circle', { cx: '11', cy: '11', r: '7' }),
            (0, t.jsx)('path', { d: 'm20 20-3.5-3.5' }),
          ],
        }),
      'IconStar',
      0,
      ({ filled: e, ...n }) =>
        (0, t.jsx)(r, {
          ...n,
          fill: e ? 'currentColor' : 'none',
          children: (0, t.jsx)('path', {
            d: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z',
          }),
        }),
      'IconStates',
      0,
      (e) =>
        (0, t.jsxs)(r, {
          ...e,
          children: [
            (0, t.jsx)('path', { d: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z' }),
            (0, t.jsx)('path', { d: 'M9 4v14M15 6v14' }),
          ],
        }),
      'IconSun',
      0,
      (e) =>
        (0, t.jsxs)(r, {
          ...e,
          children: [
            (0, t.jsx)('circle', { cx: '12', cy: '12', r: '4' }),
            (0, t.jsx)('path', {
              d: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
            }),
          ],
        }),
      'Logo',
      0,
      ({ size: e = 22 }) =>
        (0, t.jsxs)('svg', {
          viewBox: '0 0 32 32',
          width: e,
          height: e,
          'aria-hidden': 'true',
          children: [
            (0, t.jsx)('rect', {
              x: '2',
              y: '2',
              width: '28',
              height: '28',
              rx: '7',
              fill: 'var(--surface-2)',
              stroke: 'var(--line-strong)',
            }),
            (0, t.jsx)('rect', { x: '8', y: '17', width: '4', height: '8', rx: '1.5', fill: 'var(--ink-2)' }),
            (0, t.jsx)('rect', {
              x: '14',
              y: '12',
              width: '4',
              height: '13',
              rx: '1.5',
              fill: 'var(--ink-2)',
            }),
            (0, t.jsx)('rect', { x: '20', y: '7', width: '4', height: '18', rx: '1.5', fill: 'var(--live)' }),
          ],
        }),
    ]);
  },
  97026,
  (e) => {
    e.s(['ElectionShell', () => f, 'useRound', () => p], 97026);
    var t = e.i(19496);
    e.i(84803);
    var r = e.i(3485),
      n = e.i(70837),
      s = e.i(78071),
      a = e.i(39242),
      i = e.i(1856),
      o = e.i(71614),
      l = e.i(13174),
      u = e.i(9259);
    const c = {
      state: 'Estado',
      city: 'Município',
      candidate: 'Candidato',
      party: 'Partido',
      office: 'Cargo',
    };
    function d({ onClose: e }) {
      const { round: r, href: n } = p(),
        o = (0, s.useRouter)(),
        [l, h] = (0, a.useState)(''),
        [f, m] = (0, a.useState)(''),
        [x, b] = (0, a.useState)(0),
        g = (0, a.useRef)(null),
        y = (0, a.useId)(),
        { data: v, isFetching: j } = (0, i.useSearch)(r.slug, f),
        S = f.trim().length >= 2 ? (v ?? []) : [];
      (0, a.useEffect)(() => {
        const e = setTimeout(() => {
          m(l), b(0);
        }, 180);
        return () => clearTimeout(e);
      }, [l]),
        (0, a.useEffect)(() => {
          g.current?.focus();
          const e = document.body.style.overflow;
          return (
            (document.body.style.overflow = 'hidden'),
            () => {
              document.body.style.overflow = e;
            }
          );
        }, []);
      const w = (t) => {
        t && (e(), o.push(n(t.path, t.params)));
      };
      return (0, t.jsxs)('div', {
        className: 'fixed inset-0 z-50 flex items-start justify-center p-3 pt-[10vh]',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Buscar',
        children: [
          (0, t.jsx)('button', {
            type: 'button',
            className: 'absolute inset-0 bg-black/55',
            'aria-label': 'Fechar busca',
            onClick: e,
          }),
          (0, t.jsxs)('div', {
            className:
              'relative w-full max-w-xl overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl',
            children: [
              (0, t.jsxs)('div', {
                className: 'flex items-center gap-2 border-b border-line px-3',
                children: [
                  (0, t.jsx)(u.IconSearch, { className: 'text-muted' }),
                  (0, t.jsx)('input', {
                    ref: g,
                    value: l,
                    onChange: (e) => h(e.target.value),
                    onKeyDown: (t) => {
                      'Escape' === t.key
                        ? e()
                        : 'ArrowDown' === t.key
                          ? (t.preventDefault(), b((e) => Math.min(e + 1, S.length - 1)))
                          : 'ArrowUp' === t.key
                            ? (t.preventDefault(), b((e) => Math.max(e - 1, 0)))
                            : 'Enter' === t.key && w(S[x]);
                    },
                    placeholder: 'Estado, município, candidato, partido ou cargo',
                    className: 'h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted',
                    role: 'combobox',
                    'aria-expanded': S.length > 0,
                    'aria-controls': y,
                    'aria-activedescendant': S[x] ? `${y}-${x}` : void 0,
                    autoComplete: 'off',
                    spellCheck: !1,
                  }),
                  (0, t.jsx)('kbd', {
                    className: 'rounded border border-line px-1.5 font-mono text-[11px] text-muted',
                    children: 'Esc',
                  }),
                ],
              }),
              (0, t.jsxs)('div', {
                id: y,
                role: 'listbox',
                'aria-label': 'Resultados',
                className: 'max-h-[60vh] overflow-y-auto p-1.5',
                children: [
                  S.map((e, r) =>
                    (0, t.jsxs)(
                      'div',
                      {
                        id: `${y}-${r}`,
                        role: 'option',
                        tabIndex: -1,
                        'aria-selected': r === x,
                        onMouseEnter: () => b(r),
                        onClick: () => w(e),
                        onKeyDown: () => {},
                        className:
                          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 aria-selected:bg-surface-2',
                        children: [
                          (0, t.jsx)('span', {
                            className: 'w-20 shrink-0 text-[12px] text-muted',
                            children: c[e.kind],
                          }),
                          (0, t.jsxs)('span', {
                            className: 'min-w-0',
                            children: [
                              (0, t.jsx)('span', {
                                className: 'block truncate font-medium',
                                children: e.label,
                              }),
                              (0, t.jsx)('span', {
                                className: 'block truncate text-[13px] text-muted',
                                children: e.detail,
                              }),
                            ],
                          }),
                        ],
                      },
                      `${e.kind}-${e.path}-${e.label}-${r}`,
                    ),
                  ),
                  f.trim().length >= 2 &&
                    !j &&
                    0 === S.length &&
                    (0, t.jsxs)('p', {
                      className: 'px-3 py-6 text-center text-[14px] text-muted',
                      children: ['Nada encontrado para “', f, '”.'],
                    }),
                  f.trim().length < 2 &&
                    (0, t.jsx)('p', {
                      className: 'px-3 py-5 text-[13px] text-muted',
                      children: 'Digite ao menos 2 letras. Use ↑ ↓ para navegar e Enter para abrir.',
                    }),
                ],
              }),
            ],
          }),
        ],
      });
    }
    const h = (0, a.createContext)(null);
    function p() {
      const e = (0, a.useContext)(h);
      if (!e) throw Error('useRound outside ElectionShell');
      return e;
    }
    function f({ electionSlug: e, elections: r, meta: i, children: u }) {
      const c = (0, s.useSearchParams)(),
        p = (0, l.pickRound)(r, e, c.get('t')),
        [m, x] = (0, a.useState)(!1);
      return ((0, a.useEffect)(() => {
        const e = (e) => {
          const t = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
          (('k' === e.key && (e.metaKey || e.ctrlKey)) || ('/' === e.key && !t)) &&
            (e.preventDefault(), x(!0));
        };
        return window.addEventListener('keydown', e), () => window.removeEventListener('keydown', e);
      }, []),
      p)
        ? (0, t.jsx)(h.Provider, {
            value: { round: p, elections: r, meta: i, href: (e = '', t) => (0, l.electionHref)(p, e, t) },
            children: (0, t.jsxs)(o.RealtimeProvider, {
              roundSlug: p.slug,
              children: [
                (0, t.jsx)('a', {
                  href: '#conteudo',
                  className:
                    'sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-surface focus:p-2',
                  children: 'Pular para o conteúdo',
                }),
                (0, t.jsx)(b, { onSearch: () => x(!0) }),
                p.demo &&
                  (0, t.jsx)('div', {
                    className:
                      'border-b border-warn/30 bg-warn-soft px-4 py-1.5 text-center text-[13px] text-warn',
                    role: 'note',
                    children:
                      'Eleição demonstrativa com candidatos e partidos fictícios. Estes números não são resultados reais.',
                  }),
                (0, t.jsx)('div', {
                  id: 'conteudo',
                  className: 'mx-auto w-full max-w-[1320px] px-4 pb-28 pt-5 sm:px-6 lg:pb-12',
                  children: u,
                }),
                (0, t.jsx)(S, {}),
                (0, t.jsx)(j, { onSearch: () => x(!0) }),
                m && (0, t.jsx)(d, { onClose: () => x(!1) }),
              ],
            }),
          })
        : (0, t.jsxs)('main', {
            className: 'mx-auto max-w-xl px-4 py-24',
            children: [
              (0, t.jsx)('h1', { className: 'text-2xl font-semibold', children: 'Eleição não encontrada' }),
              (0, t.jsxs)('p', {
                className: 'mt-2 text-ink-2',
                children: ['Não há dados para “', e, '” neste servidor.'],
              }),
              (0, t.jsx)(n.default, {
                href: '/',
                className: 'mt-6 inline-block text-info underline',
                children: 'Voltar ao início',
              }),
            ],
          });
    }
    const m = [
      { path: '', label: 'Visão geral', icon: u.IconOverview },
      { path: '/states', label: 'Estados', icon: u.IconStates },
      { path: '/operations', label: 'Ao vivo', icon: u.IconPulse },
      { path: '/historico', label: 'Histórico', icon: u.IconHistory },
      { path: '/compare', label: 'Comparar', icon: u.IconCompare, flag: 'comparison' },
    ];
    function x() {
      const e = (0, s.usePathname)().replace(/\/$/, '');
      return (t) => l.SECTION_ROUTES[t]?.replace(/\/$/, '') === e;
    }
    function b({ onSearch: e }) {
      const { round: r, href: s } = p(),
        a = (() => {
          const { meta: e } = p();
          return m.filter((t) => {
            const r = 'flag' in t ? t.flag : void 0;
            return !r || e?.features[r] !== !1;
          });
        })(),
        i = x();
      return (0, t.jsx)('header', {
        className:
          'sticky top-0 z-30 border-b border-line bg-ground/90 backdrop-blur supports-[backdrop-filter]:bg-ground/75',
        children: (0, t.jsxs)('div', {
          className: 'mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:px-6',
          children: [
            (0, t.jsxs)(n.default, {
              href: s(),
              className: 'flex items-center gap-2 font-semibold tracking-tight',
              'aria-label': 'Eleições Brasil — visão geral',
              children: [
                (0, t.jsx)(u.Logo, {}),
                (0, t.jsx)('span', { className: 'hidden sm:inline', children: 'Eleições Brasil' }),
              ],
            }),
            (0, t.jsx)(g, {}),
            (0, t.jsx)('nav', {
              'aria-label': 'Seções',
              className: 'ml-2 hidden items-center gap-1 lg:flex',
              children: a.map((e) =>
                (0, t.jsx)(
                  n.default,
                  {
                    href: s(e.path),
                    'aria-current': i(e.path) ? 'page' : void 0,
                    className:
                      'whitespace-nowrap rounded-md px-2.5 py-1.5 text-[14px] text-ink-2 hover:bg-surface-2 hover:text-ink aria-[current=page]:bg-surface-2 aria-[current=page]:text-ink',
                    children: e.label,
                  },
                  e.path,
                ),
              ),
            }),
            (0, t.jsxs)('div', {
              className: 'ml-auto flex items-center gap-2',
              children: [
                (0, t.jsx)(y, {}, r.slug),
                (0, t.jsxs)('button', {
                  type: 'button',
                  onClick: e,
                  className:
                    'hidden h-9 items-center gap-2 rounded-md border border-line px-2.5 text-[13px] text-muted hover:border-line-strong hover:text-ink sm:flex',
                  children: [
                    (0, t.jsx)(u.IconSearch, {}),
                    (0, t.jsx)('span', { className: 'lg:hidden xl:inline', children: 'Buscar' }),
                    (0, t.jsx)('kbd', {
                      className: 'rounded border border-line px-1 font-mono text-[11px] lg:hidden xl:inline',
                      children: '⌘K',
                    }),
                  ],
                }),
                (0, t.jsx)(v, { className: 'hidden sm:flex' }),
              ],
            }),
          ],
        }),
      });
    }
    function g() {
      const { round: e, elections: r } = p(),
        n = (0, s.useRouter)();
      return (0, t.jsxs)('label', {
        className: 'relative',
        children: [
          (0, t.jsx)('span', { className: 'sr-only', children: 'Eleição e turno' }),
          (0, t.jsx)('select', {
            value: e.slug,
            onChange: (e) => {
              const t = r.flatMap((e) => e.rounds).find((t) => t.slug === e.target.value);
              t && n.push((0, l.electionHref)(t));
            },
            className:
              'h-9 max-w-[46vw] cursor-pointer appearance-none truncate rounded-md border border-line bg-surface py-0 pl-2.5 pr-7 text-[13px] font-medium hover:border-line-strong',
            children: r.map((e) =>
              (0, t.jsx)(
                'optgroup',
                {
                  label: e.name,
                  children: e.rounds.map((r) =>
                    (0, t.jsxs)(
                      'option',
                      {
                        value: r.slug,
                        children: [
                          e.demo ? 'Demo' : e.slug.startsWith('replay-') ? 'Replay' : e.year,
                          ' · ',
                          r.round,
                          'º turno',
                        ],
                      },
                      r.slug,
                    ),
                  ),
                },
                e.slug,
              ),
            ),
          }),
          (0, t.jsx)('span', {
            'aria-hidden': !0,
            className: 'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted',
            children: '▾',
          }),
        ],
      });
    }
    function y() {
      let { round: e } = p(),
        { connection: n } = (0, o.useRealtime)(),
        { data: s } = (0, i.useOverview)(e.slug),
        a = s?.progress?.updatedAt ?? null,
        l = s?.ingestion.state,
        u = 'replay' === e.environment,
        c = 'muted',
        d = 'Aguardando apuração';
      'offline' === n
        ? ((c = 'muted'), (d = 'Offline'))
        : 'final' === e.status
          ? ((c = 'ink'), (d = u ? 'Replay encerrado' : 'Apuração encerrada'))
          : 'live' === e.status &&
            ('reconnecting' === n
              ? ((c = 'warn'), (d = 'Reconectando'))
              : 'degraded' === l || 'offline' === l
                ? ((c = 'warn'), (d = 'Dados atrasados'))
                : ((c = 'live'), (d = u ? 'Replay' : 'Ao vivo')));
      const h = { live: 'text-live', warn: 'text-warn', muted: 'text-muted', ink: 'text-ink-2' }[c];
      return (0, t.jsxs)('div', {
        className: 'flex items-center gap-2 text-[13px]',
        role: 'status',
        'aria-live': 'polite',
        children: [
          (0, t.jsxs)('span', {
            className: `flex items-center gap-1.5 whitespace-nowrap font-medium ${h}`,
            children: [
              (0, t.jsx)('span', {
                className: `inline-block size-2 rounded-full bg-current ${'live' === c ? 'pulse-dot' : ''}`,
                'aria-hidden': !0,
              }),
              d,
            ],
          }),
          a &&
            (0, t.jsxs)('span', {
              className: 'hidden whitespace-nowrap text-muted md:inline lg:hidden xl:inline',
              children: [
                (0, t.jsx)('span', { className: 'sr-only', children: 'Última atualização às ' }),
                (0, t.jsx)('time', { dateTime: a, children: (0, r.formatClock)(a) }),
                ' BRT',
              ],
            }),
        ],
      });
    }
    function v({ className: e = '' }) {
      const [r, n] = (0, a.useState)(null);
      (0, a.useEffect)(() => n(document.documentElement.dataset.theme ?? 'dark'), []);
      const s = 'light' === r ? 'dark' : 'light';
      return (0, t.jsx)('button', {
        type: 'button',
        onClick: () => {
          document.documentElement.dataset.theme = s;
          try {
            localStorage.setItem('eleicoes:theme', s);
          } catch {}
          n(s);
        },
        className: `size-9 items-center justify-center rounded-md border border-line text-muted hover:border-line-strong hover:text-ink ${e}`,
        'aria-label': 'light' === r ? 'Usar tema escuro' : 'Usar tema claro',
        children: 'light' === r ? (0, t.jsx)(u.IconMoon, {}) : (0, t.jsx)(u.IconSun, {}),
      });
    }
    function j({ onSearch: e }) {
      const { href: r, meta: s } = p(),
        i = x(),
        [o, l] = (0, a.useState)(!1),
        c =
          'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted aria-[current=page]:text-ink';
      return (0, t.jsxs)(t.Fragment, {
        children: [
          (0, t.jsxs)('nav', {
            'aria-label': 'Navegação principal',
            className:
              'fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-ground/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden',
            children: [
              m
                .slice(0, 3)
                .map((e) =>
                  (0, t.jsxs)(
                    n.default,
                    {
                      href: r(e.path),
                      'aria-current': i(e.path) ? 'page' : void 0,
                      className: c,
                      children: [(0, t.jsx)(e.icon, {}), e.label],
                    },
                    e.path,
                  ),
                ),
              (0, t.jsxs)('button', {
                type: 'button',
                onClick: e,
                className: c,
                children: [(0, t.jsx)(u.IconSearch, {}), 'Buscar'],
              }),
              (0, t.jsxs)('button', {
                type: 'button',
                onClick: () => l(!0),
                className: c,
                'aria-expanded': o,
                children: [(0, t.jsx)(u.IconMore, {}), 'Mais'],
              }),
            ],
          }),
          o &&
            (0, t.jsxs)('div', {
              className: 'fixed inset-0 z-40 lg:hidden',
              role: 'dialog',
              'aria-modal': 'true',
              'aria-label': 'Mais opções',
              children: [
                (0, t.jsx)('button', {
                  type: 'button',
                  className: 'absolute inset-0 bg-black/50',
                  'aria-label': 'Fechar',
                  onClick: () => l(!1),
                }),
                (0, t.jsxs)('div', {
                  className:
                    'absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]',
                  children: [
                    (0, t.jsxs)('div', {
                      className: 'mb-2 flex items-center justify-between',
                      children: [
                        (0, t.jsx)('span', { className: 'font-semibold', children: 'Mais' }),
                        (0, t.jsx)('button', {
                          type: 'button',
                          onClick: () => l(!1),
                          className: 'p-2 text-muted',
                          'aria-label': 'Fechar',
                          children: (0, t.jsx)(u.IconClose, {}),
                        }),
                      ],
                    }),
                    (0, t.jsxs)('ul', {
                      className: 'grid gap-1',
                      children: [
                        [
                          { to: r('/historico'), label: 'Histórico da apuração', icon: u.IconHistory },
                          ...(s?.features.comparison === !1
                            ? []
                            : [{ to: r('/compare'), label: 'Comparar estados', icon: u.IconCompare }]),
                          { to: `${r()}#favoritos`, label: 'Favoritos', icon: u.IconStar },
                          { to: '/como-funciona', label: 'Como funciona', icon: u.IconPulse },
                          { to: '/sobre', label: 'Sobre os dados', icon: u.IconInfo },
                        ].map((e) =>
                          (0, t.jsx)(
                            'li',
                            {
                              children: (0, t.jsxs)(n.default, {
                                href: e.to,
                                onClick: () => l(!1),
                                className:
                                  'flex min-h-12 items-center gap-3 rounded-lg px-3 hover:bg-surface-2',
                                children: [(0, t.jsx)(e.icon, {}), e.label],
                              }),
                            },
                            e.label,
                          ),
                        ),
                        (0, t.jsxs)('li', {
                          className: 'flex min-h-12 items-center justify-between rounded-lg px-3',
                          children: [
                            (0, t.jsx)('span', { children: 'Tema' }),
                            (0, t.jsx)(v, { className: 'flex' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
        ],
      });
    }
    function S() {
      const { meta: e, round: r } = p(),
        s = e?.adapters.find((e) => r.adapter?.startsWith(e.id));
      return (0, t.jsx)('footer', {
        className: 'border-t border-line pb-24 lg:pb-0',
        children: (0, t.jsxs)('div', {
          className:
            'mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-6 text-[13px] text-muted sm:px-6 md:flex-row md:items-start md:justify-between',
          children: [
            (0, t.jsx)('div', {
              className: 'max-w-2xl',
              children: (0, t.jsxs)('p', {
                children: [
                  'Fonte: Tribunal Superior Eleitoral — TSE. Este site não é um serviço oficial da Justiça Eleitoral. Resultados parciais refletem apenas as seções totalizadas até o horário indicado e podem mudar até o fim da totalização.',
                  ' ',
                  (0, t.jsx)(n.default, {
                    href: '/como-funciona',
                    className: 'text-ink-2 underline underline-offset-2',
                    children: 'Como funciona',
                  }),
                  ' · ',
                  (0, t.jsx)(n.default, {
                    href: '/sobre',
                    className: 'text-ink-2 underline underline-offset-2',
                    children: 'Sobre os dados',
                  }),
                ],
              }),
            }),
            (0, t.jsxs)('p', {
              className: 'shrink-0 font-mono text-[12px]',
              children: [
                'Eleições Brasil v',
                e?.app.version ?? '—',
                s && ` \xb7 adapter ${s.id} ${s.version}`,
              ],
            }),
          ],
        }),
      });
    }
  },
  91739,
  (e) => {
    var t = e.i(19496);
    e.i(84803);
    var r = e.i(3485),
      n = e.i(70837),
      s = e.i(39242),
      a = e.i(46147),
      i = e.i(71614),
      o = e.i(9259);
    function l({ tone: e, title: r, children: n }) {
      return (0, t.jsxs)('div', {
        role: 'status',
        className: `mb-4 rounded-xl border px-4 py-2.5 text-[14px] ${'warn' === e ? 'border-warn/40 bg-warn-soft' : 'border-line-strong bg-surface-2'}`,
        children: [
          (0, t.jsxs)('span', {
            className: `font-medium ${'warn' === e ? 'text-warn' : ''}`,
            children: [r, '.'],
          }),
          ' ',
          (0, t.jsx)('span', { className: 'text-ink-2', children: n }),
        ],
      });
    }
    e.s([
      'Breadcrumbs',
      0,
      ({ items: e }) =>
        (0, t.jsx)('nav', {
          'aria-label': 'Você está em',
          className: 'mb-2 text-[13px] text-muted',
          children: (0, t.jsx)('ol', {
            className: 'flex flex-wrap items-center gap-1',
            children: e.map((e, r) =>
              (0, t.jsxs)(
                'li',
                {
                  className: 'flex items-center gap-1',
                  children: [
                    r > 0 && (0, t.jsx)(o.IconChevron, { width: 12, height: 12 }),
                    e.href
                      ? (0, t.jsx)(n.default, {
                          href: e.href,
                          className: 'hover:text-ink',
                          children: e.label,
                        })
                      : (0, t.jsx)('span', {
                          'aria-current': 'page',
                          className: 'text-ink-2',
                          children: e.label,
                        }),
                  ],
                },
                e.label,
              ),
            ),
          }),
        }),
      'EmptyState',
      0,
      ({ title: e, children: r }) =>
        (0, t.jsxs)('div', {
          className: 'rounded-xl border border-dashed border-line-strong px-5 py-10 text-center',
          children: [
            (0, t.jsx)('p', { className: 'font-medium', children: e }),
            r && (0, t.jsx)('p', { className: 'mx-auto mt-1 max-w-md text-[14px] text-muted', children: r }),
          ],
        }),
      'ErrorNotice',
      0,
      ({ error: e, retry: r }) =>
        (0, t.jsxs)('div', {
          role: 'alert',
          className: 'rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-[14px]',
          children: [
            (0, t.jsx)('p', {
              className: 'font-medium text-bad',
              children: 'Não foi possível carregar estes dados.',
            }),
            (0, t.jsxs)('p', {
              className: 'text-ink-2',
              children: [
                e instanceof Error ? e.message : 'Erro desconhecido.',
                ' Nossa API pode estar temporariamente indisponível.',
              ],
            }),
            r &&
              (0, t.jsx)('button', {
                type: 'button',
                onClick: r,
                className: 'mt-2 text-info underline underline-offset-2',
                children: 'Tentar de novo',
              }),
          ],
        }),
      'FavoriteButton',
      0,
      ({ favorite: e }) => {
        const { has: r, toggle: n } = (0, a.useFavorites)(),
          s = r(e.key);
        return (0, t.jsxs)('button', {
          type: 'button',
          onClick: () => n(e),
          'aria-pressed': s,
          className: `inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-[13px] ${s ? 'border-warn/50 text-warn' : 'border-line text-muted hover:text-ink'}`,
          children: [
            (0, t.jsx)(o.IconStar, { filled: s, width: 16, height: 16 }),
            s ? 'Favorito' : 'Favoritar',
          ],
        });
      },
      'FreshnessNotice',
      0,
      ({ ingestion: e, progress: n, roundStatus: s }) => {
        const { connection: a } = (0, i.useRealtime)(),
          o = e.lastSuccessAt ?? n?.updatedAt ?? null;
        return 'offline' === a
          ? (0, t.jsxs)(l, {
              tone: 'muted',
              title: 'Você está offline',
              children: [
                'Exibindo os últimos dados recebidos',
                o && (0, t.jsxs)(t.Fragment, { children: [' às ', (0, r.formatClock)(o), ' BRT'] }),
                '. Eles serão atualizados quando a conexão voltar.',
              ],
            })
          : 'live' === s && ('offline' === e.state || 'degraded' === e.state)
            ? (0, t.jsxs)(l, {
                tone: 'warn',
                title: 'offline' === e.state ? 'Dados atrasados' : 'Fonte do TSE instável',
                children: [
                  'Exibindo os últimos dados recebidos com sucesso',
                  o && (0, t.jsxs)(t.Fragment, { children: [' às ', (0, r.formatClock)(o), ' BRT'] }),
                  '. A coleta continua tentando.',
                ],
              })
            : null;
      },
      'Panel',
      0,
      ({ children: e, className: r = '' }) =>
        (0, t.jsx)('div', { className: `rounded-xl border border-line bg-surface ${r}`, children: e }),
      'ProgressBar',
      0,
      ({ value: e, label: r, className: n = '', tone: s = 'live' }) => {
        const a = Math.max(0, Math.min(100, e ?? 0));
        return (0, t.jsx)('div', {
          className: `h-1.5 overflow-hidden rounded-full bg-line ${n}`,
          role: 'progressbar',
          'aria-label': r,
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': null == e ? void 0 : Math.round(100 * a) / 100,
          children: (0, t.jsx)('div', {
            className: `bar h-full rounded-full ${'live' === s ? 'bg-live' : 'bg-ink-2'}`,
            style: { width: `${a}%` },
          }),
        });
      },
      'SectionTitle',
      0,
      ({ id: e, title: r, aside: n, children: s }) =>
        (0, t.jsxs)('div', {
          className: 'mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2',
          children: [
            (0, t.jsxs)('div', {
              children: [
                (0, t.jsx)('h2', {
                  id: e,
                  className: 'text-[17px] font-semibold tracking-tight',
                  children: r,
                }),
                s && (0, t.jsx)('p', { className: 'text-[13px] text-muted', children: s }),
              ],
            }),
            n,
          ],
        }),
      'Segmented',
      0,
      ({ value: e, onChange: r, options: n, label: s }) =>
        (0, t.jsx)('div', {
          role: 'radiogroup',
          'aria-label': s,
          className: 'inline-flex rounded-lg border border-line bg-surface p-0.5',
          children: n.map((n) =>
            (0, t.jsx)(
              'button',
              {
                type: 'button',
                role: 'radio',
                'aria-checked': e === n.value,
                onClick: () => r(n.value),
                className:
                  'min-h-8 rounded-md px-3 text-[13px] text-muted aria-checked:bg-surface-2 aria-checked:text-ink aria-checked:shadow-[inset_0_0_0_1px_var(--line-strong)]',
                children: n.label,
              },
              n.value,
            ),
          ),
        }),
      'Skeleton',
      0,
      ({ className: e = '' }) =>
        (0, t.jsx)('div', { className: `animate-pulse rounded-md bg-surface-2 ${e}`, 'aria-hidden': !0 }),
      'Stat',
      0,
      ({ label: e, value: r, detail: n, emphasis: s }) =>
        (0, t.jsxs)('div', {
          className: 'min-w-0',
          children: [
            (0, t.jsx)('dt', { className: 'text-[12.5px] text-muted', children: e }),
            (0, t.jsx)('dd', {
              className: `${s ? 'text-[22px]' : 'text-[17px]'} numeral truncate leading-tight`,
              children: r ?? '—',
            }),
            n && (0, t.jsx)('dd', { className: 'text-[12.5px] text-ink-2', children: n }),
          ],
        }),
      'Tabs',
      0,
      ({ label: e, tabs: r, value: n, onChange: a, children: i }) => {
        const o = (0, s.useId)(),
          l = (e) => {
            const t = r.findIndex((e) => e.value === n),
              s = r[(t + e + r.length) % r.length];
            a(s.value), document.getElementById(`${o}-${s.value}`)?.focus();
          };
        return (0, t.jsxs)('div', {
          children: [
            (0, t.jsx)('div', {
              role: 'tablist',
              'aria-label': e,
              className: 'flex gap-1 border-b border-line px-2 sm:px-3',
              children: r.map((e) =>
                (0, t.jsx)(
                  'button',
                  {
                    id: `${o}-${e.value}`,
                    type: 'button',
                    role: 'tab',
                    'aria-selected': e.value === n,
                    'aria-controls': `${o}-panel`,
                    tabIndex: e.value === n ? 0 : -1,
                    onClick: () => a(e.value),
                    onKeyDown: (e) => {
                      'ArrowRight' === e.key && l(1), 'ArrowLeft' === e.key && l(-1);
                    },
                    className:
                      '-mb-px min-h-11 flex-1 whitespace-nowrap border-b-2 border-transparent px-1 text-[13.5px] text-muted hover:text-ink aria-selected:border-live aria-selected:font-medium aria-selected:text-ink sm:flex-none sm:px-3',
                    children: e.label,
                  },
                  e.value,
                ),
              ),
            }),
            (0, t.jsx)('div', {
              id: `${o}-panel`,
              role: 'tabpanel',
              'aria-labelledby': `${o}-${n}`,
              className: 'p-3 sm:p-4',
              children: i,
            }),
          ],
        });
      },
    ]);
  },
  77339,
  (e) => {
    var t = e.i(90114);
    const r = 'http://localhost:4000';
    t.default.env.API_URL;
    class n extends Error {
      status;
      constructor(e, t) {
        super(t), (this.status = e);
      }
    }
    let s = null;
    async function a(e, t) {
      const a = await fetch(
        `${r}${!s || !e.startsWith(`/api/elections/${s.round}/`) ? e : `${e}${e.includes('?') ? '&' : '?'}v=${s.v}`}`,
        t,
      );
      if (!a.ok) {
        const e = await a.json().catch(() => null);
        throw new n(a.status, e?.error?.message ?? `HTTP ${a.status}`);
      }
      return a.json();
    }
    e.s([
      'API_URL',
      0,
      r,
      'api',
      0,
      a,
      'setDataVersion',
      0,
      (e, t) => {
        t > 0 && (s = { round: e, v: t });
      },
    ]);
  },
  46147,
  (e) => {
    var t = e.i(39242);
    let r = 'eleicoes:favorites:v1',
      n = new Set(),
      s = null;
    function a() {
      if (s) return s;
      try {
        s = JSON.parse(localStorage.getItem(r) ?? '[]');
      } catch {
        s = [];
      }
      return s;
    }
    const i = [];
    e.s([
      'useFavorites',
      0,
      () => {
        const e = (0, t.useSyncExternalStore)(
          (e) => (n.add(e), () => n.delete(e)),
          a,
          () => i,
        );
        return {
          favorites: e,
          toggle: (0, t.useCallback)((e) => {
            const t = a();
            var i = t.some((t) => t.key === e.key) ? t.filter((t) => t.key !== e.key) : [...t, e];
            s = i;
            try {
              localStorage.setItem(r, JSON.stringify(i));
            } catch {}
            for (const e of n) e();
          }, []),
          has: (t) => e.some((e) => e.key === t),
        };
      },
    ]);
  },
  1856,
  (e) => {
    var t = e.i(43699),
      r = e.i(57922),
      n = e.i(77339);
    const s = (e) => `/api/elections/${e}`;
    e.s([
      'useCities',
      0,
      (e, a, i) =>
        (0, r.useQuery)({
          queryKey: [e, 'cities', a, i],
          queryFn: () =>
            (0, n.api)(
              `${s(e)}/states/${a}/cities?page=${i.page}&sort=${i.sort}${i.q ? `&q=${encodeURIComponent(i.q)}` : ''}`,
            ),
          placeholderData: t.keepPreviousData,
        }),
      'useCity',
      0,
      (e, t, a, i) =>
        (0, r.useQuery)({
          queryKey: [e, 'city', t, a],
          queryFn: () => (0, n.api)(`${s(e)}/states/${t}/cities/${a}`),
          initialData: i ?? void 0,
        }),
      'useCompare',
      0,
      (e, a, i) =>
        (0, r.useQuery)({
          queryKey: [e, 'compare', a.join(','), i],
          queryFn: () => (0, n.api)(`${s(e)}/compare?states=${a.join(',')}${i ? `&office=${i}` : ''}`),
          enabled: a.length > 0,
          placeholderData: t.keepPreviousData,
        }),
      'useEvents',
      0,
      (e, t = 30) =>
        (0, r.useQuery)({
          queryKey: [e, 'events', t],
          queryFn: () => (0, n.api)(`${s(e)}/events?limit=${t}`),
        }),
      'useOperations',
      0,
      (e) =>
        (0, r.useQuery)({
          queryKey: [e, 'operations'],
          queryFn: () => (0, n.api)(`${s(e)}/operations`),
          refetchInterval: 15e3,
        }),
      'useOverview',
      0,
      (e, t) =>
        (0, r.useQuery)({
          queryKey: [e, 'overview'],
          queryFn: () => (0, n.api)(`${s(e)}/overview`),
          initialData: t ?? void 0,
        }),
      'useResult',
      0,
      (e, a, i, o) =>
        (0, r.useQuery)({
          queryKey: [e, 'result', a, i, o],
          queryFn: () =>
            (0, n.api)(`${s(e)}/results?area=${a}${i ? `&office=${i}` : ''}${o ? `&limit=${o}` : ''}`),
          enabled: !!i,
          placeholderData: t.keepPreviousData,
          retry: (e, t) => 404 !== t.status && e < 2,
        }),
      'useSearch',
      0,
      (e, a) =>
        (0, r.useQuery)({
          queryKey: ['search', e, a],
          queryFn: () => (0, n.api)(`${s(e)}/search?q=${encodeURIComponent(a)}`),
          enabled: a.trim().length >= 2,
          placeholderData: t.keepPreviousData,
          staleTime: 3e4,
        }),
      'useSeries',
      0,
      (e, a, i) =>
        (0, r.useQuery)({
          queryKey: [e, 'series', a, i],
          queryFn: () => (0, n.api)(`${s(e)}/series?office=${a}&area=${i}`),
          enabled: !!a,
          placeholderData: t.keepPreviousData,
        }),
      'useStateDetail',
      0,
      (e, t, a) =>
        (0, r.useQuery)({
          queryKey: [e, 'state', t],
          queryFn: () => (0, n.api)(`${s(e)}/states/${t}`),
          initialData: a ?? void 0,
        }),
      'useTimeline',
      0,
      (e) => (0, r.useQuery)({ queryKey: [e, 'timeline'], queryFn: () => (0, n.api)(`${s(e)}/timeline`) }),
      'useTimelineAt',
      0,
      (e, a) =>
        (0, r.useQuery)({
          queryKey: ['history', e, 'at', a],
          queryFn: () => (0, n.api)(`${s(e)}/timeline?at=${encodeURIComponent(a)}`),
          enabled: !!a,
          placeholderData: t.keepPreviousData,
          staleTime: 1 / 0,
        }),
    ]);
  },
  71614,
  (e) => {
    var t = e.i(19496),
      r = e.i(59514),
      n = e.i(39242),
      s = e.i(77339);
    const a = (0, n.createContext)({ connection: 'connecting', lastEventAt: null, recent: new Map() });
    e.s([
      'RealtimeProvider',
      0,
      ({ roundSlug: e, children: i }) => {
        const o = (0, r.useQueryClient)(),
          [l, u] = (0, n.useState)('connecting'),
          [c, d] = (0, n.useState)(null),
          [h, p] = (0, n.useState)(new Map()),
          f = (0, n.useRef)(null);
        return (
          (0, n.useEffect)(() => {
            let t = new EventSource(`${s.API_URL}/api/realtime/elections/${e}`),
              r = new Set(),
              n = 0,
              a = () => {
                (f.current = null), (0, s.setDataVersion)(e, n), o.invalidateQueries({ queryKey: [e] });
                const t = Date.now();
                p((e) => {
                  const n = new Map([...e].filter(([, e]) => t - e < 1e4));
                  for (const e of r) n.set(e, t);
                  return r.clear(), n;
                });
              };
            t.addEventListener('ready', (t) => {
              try {
                (n = JSON.parse(t.data).version ?? 0), (0, s.setDataVersion)(e, n);
              } catch {}
            }),
              t.addEventListener('batch', (e) => {
                d(Date.now());
                try {
                  const t = JSON.parse(e.data);
                  for (const e of ((n = Math.max(n, t.version)), t.events))
                    e.areaKey && r.add(e.areaKey), e.state && r.add(e.state.toLowerCase());
                } catch {
                  return;
                }
                f.current || (f.current = setTimeout(a, 250 + 1e3 * Math.random()));
              }),
              (t.onopen = () => u(navigator.onLine ? 'live' : 'offline')),
              (t.onerror = () => u(navigator.onLine ? 'reconnecting' : 'offline'));
            const i = () => u('offline'),
              l = () => u('reconnecting');
            return (
              window.addEventListener('offline', i),
              window.addEventListener('online', l),
              () => {
                t.close(),
                  f.current && clearTimeout(f.current),
                  window.removeEventListener('offline', i),
                  window.removeEventListener('online', l);
              }
            );
          }, [e, o]),
          (0, t.jsx)(a.Provider, { value: { connection: l, lastEventAt: c, recent: h }, children: i })
        );
      },
      'useRealtime',
      0,
      () => (0, n.useContext)(a),
    ]);
  },
  13174,
  (e) => {
    const t = {
      '': '/eleicao/',
      '/states': '/eleicao/estados/',
      '/operations': '/eleicao/ao-vivo/',
      '/historico': '/eleicao/historico/',
      '/compare': '/eleicao/comparar/',
    };
    e.s([
      'SECTION_ROUTES',
      0,
      t,
      'defaultElection',
      0,
      (e) => {
        const t = e.filter((e) => !e.demo && !e.slug.startsWith('replay-'));
        return (
          t.find((e) => e.rounds.some((e) => 'live' === e.status)) ??
          t.find((e) => e.rounds.some((e) => 'scheduled' !== e.status)) ??
          e.find((e) => e.demo && e.rounds.some((e) => 'scheduled' !== e.status)) ??
          t[0] ??
          e[0] ??
          null
        );
      },
      'electionHref',
      0,
      (e, r = '', n) => {
        let s = new URLSearchParams({ e: e.electionSlug, t: String(e.round) }),
          a = t[r];
        if (!a) {
          const e = /^\/states\/([a-z]{2})(?:\/cities\/(\d{5}))?$/.exec(r);
          e
            ? (s.set('uf', e[1]),
              e[2] && s.set('c', e[2]),
              (a = e[2] ? '/eleicao/municipio/' : '/eleicao/estado/'))
            : (a = '/eleicao/');
        }
        for (const [e, t] of Object.entries(n ?? {})) s.set(e, t);
        return `${a}?${s}`;
      },
      'pickRound',
      0,
      (e, t, r) => {
        const n = e.find((e) => e.slug === t);
        return n
          ? r
            ? (n.rounds.find((e) => String(e.round) === r) ?? null)
            : (n.rounds.filter((e) => 'scheduled' !== e.status).at(-1) ?? n.rounds[0] ?? null)
          : null;
      },
    ]);
  },
  57922,
  (e) => {
    let t;
    var r = e.i(59514),
      n = e.i(39242);
    const s = n.createContext(!1);
    s.Provider, e.i(19496);
    const a = n.createContext(
      ((t = !1),
      {
        clearReset: () => {
          t = !1;
        },
        reset: () => {
          t = !0;
        },
        isReset: () => t,
      }),
    );
    var i = e.i(43699),
      o = e.i(56259),
      l = e.i(60027),
      u = e.i(57545),
      c = e.i(74002),
      d = e.i(79312),
      h = e.i(39330),
      p = class extends c.Subscribable {
        #e;
        #t = void 0;
        #r = void 0;
        #n = void 0;
        #s;
        #a;
        #i;
        #o;
        #l;
        #u;
        #c;
        #d;
        #h;
        #p = new Set();
        constructor(e, t) {
          super(),
            (this.options = t),
            (this.#e = e),
            (this.#i = null),
            this.bindMethods(),
            this.setOptions(t);
        }
        bindMethods() {
          this.refetch = this.refetch.bind(this);
        }
        onSubscribe() {
          1 === this.listeners.size &&
            (this.#t.addObserver(this),
            f(this.#t, this.options) ? this.#f() : this.updateResult(),
            this.#m());
        }
        onUnsubscribe() {
          this.hasListeners() || this.destroy();
        }
        shouldFetchOnReconnect() {
          return m(this.#t, this.options, this.options.refetchOnReconnect);
        }
        shouldFetchOnWindowFocus() {
          return m(this.#t, this.options, this.options.refetchOnWindowFocus);
        }
        destroy() {
          (this.listeners = new Set()), this.#x(), this.#b(), this.#t.removeObserver(this);
        }
        setOptions(e) {
          const t = this.options,
            r = this.#t;
          if (
            ((this.options = this.#e.defaultQueryOptions(e)),
            void 0 !== this.options.enabled &&
              'boolean' != typeof this.options.enabled &&
              'function' != typeof this.options.enabled &&
              'boolean' != typeof (0, i.resolveQueryValue)(this.options.enabled, this.#t))
          )
            throw Error('Expected enabled to be a boolean or a callback that returns a boolean');
          this.#g(),
            this.#t.setOptions(this.options),
            t._defaulted &&
              !(0, i.shallowEqualObjects)(this.options, t) &&
              this.#e
                .getQueryCache()
                .notify({ type: 'observerOptionsUpdated', query: this.#t, observer: this });
          const n = this.hasListeners();
          n && x(this.#t, r, this.options, t) && this.#f(),
            this.updateResult(),
            n &&
              (this.#t !== r ||
                (0, i.resolveQueryValue)(this.options.enabled, this.#t) !==
                  (0, i.resolveQueryValue)(t.enabled, this.#t) ||
                (0, i.resolveQueryValue)(this.options.staleTime, this.#t) !==
                  (0, i.resolveQueryValue)(t.staleTime, this.#t)) &&
              this.#y();
          const s = this.#v();
          n &&
            (this.#t !== r ||
              (0, i.resolveQueryValue)(this.options.enabled, this.#t) !==
                (0, i.resolveQueryValue)(t.enabled, this.#t) ||
              s !== this.#h) &&
            this.#j(s);
        }
        getOptimisticResult(e) {
          const t = this.#e.getQueryCache().build(this.#e, e),
            r = this.createResult(t, e);
          return (
            (0, i.shallowEqualObjects)(this.getCurrentResult(), r) ||
              ((this.#n = r), (this.#a = this.options), (this.#s = this.#t.state)),
            r
          );
        }
        getCurrentResult() {
          return this.#n;
        }
        trackResult(e, t) {
          return new Proxy(e, { get: (e, r) => (this.trackProp(r), t?.(r), Reflect.get(e, r)) });
        }
        trackProp(e) {
          this.#p.add(e);
        }
        getCurrentQuery() {
          return this.#t;
        }
        refetch({ ...e } = {}) {
          return this.fetch({ ...e });
        }
        fetchOptimistic(e) {
          let t,
            r = this.#e.defaultQueryOptions(e),
            n = this.#e.getQueryCache().build(this.#e, r),
            s = () => {},
            a = new Promise((e) => {
              (t = e),
                (s = this.#e.getQueryCache().subscribe((t) => {
                  'updated' === t.type &&
                    t.query.queryHash === n.queryHash &&
                    void 0 !== n.state.data &&
                    (s(), e(this.createResult(n, r)));
                }));
            });
          return Promise.race([
            n
              .fetch()
              .then(() => {
                const e = this.createResult(n, r);
                return t?.(e), e;
              })
              .finally(() => {
                s();
              }),
            a,
          ]);
        }
        fetch(e) {
          return this.#f({ ...e, cancelRefetch: e.cancelRefetch ?? !0 }).then(
            () => (this.updateResult(), this.#n),
          );
        }
        #f(e) {
          this.#g();
          let t = this.#t.fetch(this.options, e);
          return e?.throwOnError || (t = t.catch(i.noop)), t;
        }
        #S(e) {
          return (
            !(0, u.isServer)() &&
            !1 !== (0, i.resolveQueryValue)(this.options.enabled, this.#t) &&
            (0, i.isValidTimeout)(e)
          );
        }
        #y() {
          this.#x();
          const e = (0, i.resolveQueryValue)(this.options.staleTime, this.#t);
          if (this.#n.isStale || !this.#S(e)) return;
          const t = (0, i.timeUntilStale)(this.#n.dataUpdatedAt, e) + 1;
          this.#c = l.timeoutManager.setTimeout(() => {
            this.#n.isStale || this.updateResult();
          }, t);
        }
        #v() {
          return (0, i.resolveQueryValue)(this.options.refetchInterval, this.#t) ?? !1;
        }
        #j(e) {
          this.#b(),
            (this.#h = e),
            0 !== this.#h &&
              this.#S(this.#h) &&
              (this.#d = l.timeoutManager.setInterval(() => {
                (this.options.refetchIntervalInBackground || d.focusManager.isFocused()) && this.#f();
              }, this.#h));
        }
        #m() {
          this.#y(), this.#j(this.#v());
        }
        #x() {
          void 0 !== this.#c && (l.timeoutManager.clearTimeout(this.#c), (this.#c = void 0));
        }
        #b() {
          void 0 !== this.#d && (l.timeoutManager.clearInterval(this.#d), (this.#d = void 0));
        }
        createResult(e, t) {
          let r,
            n = this.#t,
            s = this.options,
            a = this.#n,
            o = this.#s,
            l = this.#a,
            u = e !== n ? e.state : this.#r,
            { state: c } = e,
            d = { ...c },
            p = !1;
          if (t._optimisticResults) {
            const r = this.hasListeners(),
              a = !r && f(e, t),
              i = r && x(e, n, t, s);
            (a || i) && (d = { ...d, ...(0, h.fetchState)(c.data, e.options) }),
              'isRestoring' === t._optimisticResults && (d.fetchStatus = 'idle');
          }
          let { error: m, errorUpdatedAt: g, status: y } = d;
          r = d.data;
          let v = !1;
          if (void 0 !== t.placeholderData && void 0 === r && 'pending' === y) {
            let e;
            a?.isPlaceholderData && t.placeholderData === l?.placeholderData
              ? ((e = a.data), (v = !0))
              : (e =
                  'function' == typeof t.placeholderData
                    ? t.placeholderData(this.#u?.state.data, this.#u)
                    : t.placeholderData),
              void 0 !== e && ((y = 'success'), (r = (0, i.replaceData)(a?.data, e, t)), (p = !0));
          }
          if (t.select && void 0 !== r && !v)
            if (a && r === o?.data && t.select === this.#o) r = this.#l;
            else
              try {
                (this.#o = t.select),
                  (r = t.select(r)),
                  (r = (0, i.replaceData)(a?.data, r, t)),
                  (this.#l = r),
                  (this.#i = null);
              } catch (e) {
                this.#i = e;
              }
          else void 0 === r && (this.#i = null);
          this.#i && ((m = this.#i), (r = this.#l), (g = Date.now()), (y = 'error'), (p = !1));
          const j = 'fetching' === d.fetchStatus,
            S = 'pending' === y,
            w = 'error' === y,
            R = S && j,
            N = void 0 !== r;
          return {
            status: y,
            fetchStatus: d.fetchStatus,
            isPending: S,
            isSuccess: 'success' === y,
            isError: w,
            isInitialLoading: R,
            isLoading: R,
            data: r,
            dataUpdatedAt: d.dataUpdatedAt,
            error: m,
            errorUpdatedAt: g,
            failureCount: d.fetchFailureCount,
            failureReason: d.fetchFailureReason,
            errorUpdateCount: d.errorUpdateCount,
            isFetched: e.isFetched(),
            isFetchedAfterMount:
              d.dataUpdateCount > u.dataUpdateCount || d.errorUpdateCount > u.errorUpdateCount,
            isFetching: j,
            isRefetching: j && !S,
            isLoadingError: w && !N,
            isPaused: 'paused' === d.fetchStatus,
            isPlaceholderData: p,
            isRefetchError: w && N,
            isStale: b(e, t),
            refetch: this.refetch,
            isEnabled: !1 !== (0, i.resolveQueryValue)(t.enabled, e),
          };
        }
        updateResult() {
          const e = this.#n,
            t = this.createResult(this.#t, this.options);
          if (
            ((this.#s = this.#t.state),
            (this.#a = this.options),
            void 0 !== this.#s.data && (this.#u = this.#t),
            (0, i.shallowEqualObjects)(t, e))
          )
            return;
          this.#n = t;
          const r = (() => {
            if (!e) return !0;
            const { notifyOnChangeProps: t } = this.options,
              r = 'function' == typeof t ? t() : t;
            if ('all' === r || (!r && !this.#p.size)) return !0;
            const n = new Set(r ?? this.#p);
            return (
              this.options.throwOnError && n.add('error'),
              Object.keys(this.#n).some((t) => this.#n[t] !== e[t] && n.has(t))
            );
          })();
          o.notifyManager.batch(() => {
            r &&
              this.listeners.forEach((e) => {
                e(this.#n);
              }),
              this.#e.getQueryCache().notify({ query: this.#t, type: 'observerResultsUpdated' });
          });
        }
        #g() {
          const e = this.#e.getQueryCache().build(this.#e, this.options);
          if (e === this.#t) return;
          const t = this.#t;
          (this.#t = e),
            (this.#r = e.state),
            this.hasListeners() && (t?.removeObserver(this), e.addObserver(this));
        }
        onQueryUpdate() {
          this.updateResult(), this.hasListeners() && this.#m();
        }
      };
    function f(e, t) {
      return (
        (!1 !== (0, i.resolveQueryValue)(t.enabled, e) &&
          void 0 === e.state.data &&
          ('error' !== e.state.status || !1 !== (0, i.resolveQueryValue)(t.retryOnMount, e))) ||
        (void 0 !== e.state.data && m(e, t, t.refetchOnMount))
      );
    }
    function m(e, t, r) {
      if (
        !1 !== (0, i.resolveQueryValue)(t.enabled, e) &&
        'static' !== (0, i.resolveQueryValue)(t.staleTime, e)
      ) {
        const n = (0, i.resolveQueryValue)(r, e);
        return 'always' === n || (!1 !== n && b(e, t));
      }
      return !1;
    }
    function x(e, t, r, n) {
      return (
        (e !== t || !1 === (0, i.resolveQueryValue)(n.enabled, e)) &&
        (!r.suspense || 'error' !== e.state.status) &&
        b(e, r)
      );
    }
    function b(e, t) {
      return (
        !1 !== (0, i.resolveQueryValue)(t.enabled, e) &&
        e.isStaleByTime((0, i.resolveQueryValue)(t.staleTime, e))
      );
    }
    e.s(
      [
        'useQuery',
        0,
        (e, t) =>
          ((e, t, l) => {
            let u,
              c = n.useContext(s),
              d = n.useContext(a),
              h = (0, r.useQueryClient)(l),
              p = h.defaultQueryOptions(e),
              f = h.getQueryCache().get(p.queryHash),
              m = !1 !== e.subscribed;
            if (((p._optimisticResults = c ? 'isRestoring' : m ? 'optimistic' : void 0), p.suspense)) {
              const e = (e) => ('static' === e ? e : Math.max(e ?? 1e3, 1e3)),
                t = p.staleTime;
              (p.staleTime = 'function' == typeof t ? (...r) => e(t(...r)) : e(t)),
                'number' == typeof p.gcTime && (p.gcTime = Math.max(p.gcTime, 1e3));
            }
            (u =
              f?.state.error && 'function' == typeof p.throwOnError
                ? (0, i.shouldThrowError)(p.throwOnError, [f.state.error, f])
                : p.throwOnError),
              (p.suspense || u) && !d.isReset() && (p.retryOnMount = !1),
              n.useEffect(() => {
                d.clearReset();
              }, [d]);
            const [x] = n.useState(() => new t(h, p)),
              b = x.getOptimisticResult(p),
              g = !c && m;
            if (
              (n.useSyncExternalStore(
                n.useCallback(
                  (e) => {
                    const t = g ? x.subscribe(o.notifyManager.batchCalls(e)) : i.noop;
                    return x.updateResult(), t;
                  },
                  [x, g],
                ),
                () => x.getCurrentResult(),
                () => x.getCurrentResult(),
              ),
              n.useEffect(() => {
                x.setOptions(p);
              }, [p, x]),
              p?.suspense && b.isPending)
            )
              throw x.fetchOptimistic(p).catch(() => {
                d.clearReset();
              });
            if (
              (({ result: e, errorResetBoundary: t, throwOnError: r, query: n, suspense: s }) =>
                e.isError &&
                !t.isReset() &&
                !e.isFetching &&
                n &&
                ((s && void 0 === e.data) || (0, i.shouldThrowError)(r, [e.error, n])))({
                result: b,
                errorResetBoundary: d,
                throwOnError: p.throwOnError,
                query: f,
                suspense: p.suspense,
              })
            )
              throw b.error;
            return p.notifyOnChangeProps ? b : x.trackResult(b);
          })(e, p, t),
      ],
      57922,
    );
  },
  70837,
  (e, t, r) => {
    e.i(90114), Object.defineProperty(r, '__esModule', { value: !0 });
    var n = { default: () => b, useLinkStatus: () => y };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    const a = e.r(56421),
      i = e.r(19496),
      o = a._(e.r(39242)),
      l = e.r(30174),
      u = e.r(31230),
      c = e.r(46766),
      d = e.r(92937),
      h = e.r(41156),
      p = e.r(13928),
      f = e.r(26545),
      m = e.r(55964),
      x = e.r(40186);
    function b(t) {
      var r;
      let n,
        s,
        a,
        [b, y] = (0, o.useOptimistic)(f.IDLE_LINK_STATUS),
        v = (0, o.useRef)(null),
        {
          href: j,
          as: S,
          children: w,
          prefetch: R = null,
          passHref: N,
          replace: E,
          shallow: k,
          scroll: C,
          onClick: I,
          onMouseEnter: T,
          onTouchStart: $,
          legacyBehavior: P = !1,
          onNavigate: M,
          transitionTypes: O,
          ref: Q,
          unstable_dynamicOnHover: D,
          ...F
        } = t;
      (n = w), P && ('string' == typeof n || 'number' == typeof n) && (n = (0, i.jsx)('a', { children: n }));
      const A = o.default.useContext(u.AppRouterContext),
        L = !1 !== R,
        _ = !1 === R ? 'none' : !0 === R ? 'full' : 'auto',
        U = 'none' !== _ ? ('auto' === _ ? x.FetchStrategy.PPR : x.FetchStrategy.Full) : x.FetchStrategy.PPR,
        q = 'string' == typeof (r = S || j) ? r : (0, l.formatUrl)(r);
      if (P) {
        if (n?.$$typeof === Symbol.for('react.lazy'))
          throw Object.defineProperty(
            Error(
              "`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag.",
            ),
            '__NEXT_ERROR_CODE',
            { value: 'E863', enumerable: !1, configurable: !0 },
          );
        s = o.default.Children.only(n);
      }
      let B = P ? s && 'object' == typeof s && s.ref : Q,
        V,
        K = o.default.useCallback(
          (e) => (
            null !== A && (v.current = (0, f.mountLinkInstance)(e, q, A, U, L, y, V)),
            () => {
              v.current && ((0, f.unmountLinkForCurrentNavigation)(v.current), (v.current = null)),
                (0, f.unmountPrefetchableInstance)(e);
            }
          ),
          [L, q, A, U, y, V],
        ),
        z = {
          ref: (0, c.useMergedRef)(K, B),
          onClick(t) {
            P || 'function' != typeof I || I(t),
              P && s.props && 'function' == typeof s.props.onClick && s.props.onClick(t),
              !A ||
                t.defaultPrevented ||
                ((t, r, n, s, a, i, l, u = 'none') => {
                  if ('u' > typeof window) {
                    let c,
                      { nodeName: d } = t.currentTarget;
                    if (
                      ('A' === d.toUpperCase() &&
                        (((c = t.currentTarget.getAttribute('target')) && '_self' !== c) ||
                          t.metaKey ||
                          t.ctrlKey ||
                          t.shiftKey ||
                          t.altKey ||
                          (t.nativeEvent && 2 === t.nativeEvent.which))) ||
                      t.currentTarget.hasAttribute('download')
                    )
                      return;
                    if (!(0, m.isLocalURL)(r)) {
                      s && (t.preventDefault(), location.replace(r));
                      return;
                    }
                    if ((t.preventDefault(), i)) {
                      let e = !1;
                      if (
                        (i({
                          preventDefault: () => {
                            e = !0;
                          },
                        }),
                        e)
                      )
                        return;
                    }
                    const { dispatchNavigateAction: h } = e.r(8934);
                    o.default.startTransition(() => {
                      h(
                        r,
                        s ? 'replace' : 'push',
                        !1 === a ? p.ScrollBehavior.NoScroll : p.ScrollBehavior.Default,
                        n.current,
                        l,
                        u,
                      );
                    });
                  }
                })(t, q, v, E, C, M, O, _);
          },
          onMouseEnter(e) {
            P || 'function' != typeof T || T(e),
              P && s.props && 'function' == typeof s.props.onMouseEnter && s.props.onMouseEnter(e),
              A && L && (0, f.onNavigationIntent)(e.currentTarget, !0 === D);
          },
          onTouchStart: (e) => {
            P || 'function' != typeof $ || $(e),
              P && s.props && 'function' == typeof s.props.onTouchStart && s.props.onTouchStart(e),
              A && L && (0, f.onNavigationIntent)(e.currentTarget, !0 === D);
          },
        };
      return (
        (0, d.isAbsoluteUrl)(q)
          ? (z.href = q)
          : (P && !N && ('a' !== s.type || 'href' in s.props)) || (z.href = (0, h.addBasePath)(q)),
        (a = P ? o.default.cloneElement(s, z) : (0, i.jsx)('a', { ...F, ...z, children: n })),
        (0, i.jsx)(g.Provider, { value: b, children: a })
      );
    }
    const g = (0, o.createContext)(f.IDLE_LINK_STATUS),
      y = () => (0, o.useContext)(g);
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  46766,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'useMergedRef', { enumerable: !0, get: () => s });
    const n = e.r(39242);
    function s(e, t) {
      const r = (0, n.useRef)(null),
        s = (0, n.useRef)(null);
      return (0, n.useCallback)(
        (n) => {
          if (null === n) {
            const e = r.current;
            e && ((r.current = null), e());
            const t = s.current;
            t && ((s.current = null), t());
          } else e && (r.current = a(e, n)), t && (s.current = a(t, n));
        },
        [e, t],
      );
    }
    function a(e, t) {
      if ('function' != typeof e)
        return (
          (e.current = t),
          () => {
            e.current = null;
          }
        );
      {
        const r = e(t);
        return 'function' == typeof r ? r : () => e(null);
      }
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  92937,
  (e, t, r) => {
    e.i(90114), Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      DecodeError: () => b,
      MiddlewareNotFoundError: () => j,
      MissingStaticPage: () => v,
      NormalizeError: () => g,
      PageNotFoundError: () => y,
      SP: () => m,
      ST: () => x,
      WEB_VITALS: () => a,
      execOnce: () => i,
      getDisplayName: () => d,
      getLocationOrigin: () => u,
      getURL: () => c,
      isAbsoluteUrl: () => l,
      isResSent: () => h,
      loadGetInitialProps: () => f,
      normalizeRepeatedSlashes: () => p,
      stringifyError: () => S,
    };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    const a = ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'];
    function i(e) {
      let t,
        r = !1;
      return (...n) => (r || ((r = !0), (t = e(...n))), t);
    }
    const o = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/,
      l = (e) => {
        const t = e.charCodeAt(0);
        return !!((t >= 65 && t <= 90) || (t >= 97 && t <= 122)) && o.test(e);
      };
    function u() {
      const { protocol: e, hostname: t, port: r } = window.location;
      return `${e}//${t}${r ? ':' + r : ''}`;
    }
    function c() {
      const { href: e } = window.location,
        t = u();
      return e.substring(t.length);
    }
    function d(e) {
      return 'string' == typeof e ? e : e.displayName || e.name || 'Unknown';
    }
    function h(e) {
      return e.finished || e.headersSent;
    }
    function p(e) {
      const t = e.split('?');
      return t[0].replace(/\\/g, '/').replace(/\/\/+/g, '/') + (t[1] ? `?${t.slice(1).join('?')}` : '');
    }
    async function f(e, t) {
      const r = t.res || (t.ctx && t.ctx.res);
      if (!e.getInitialProps) return t.ctx && t.Component ? { pageProps: await f(t.Component, t.ctx) } : {};
      const n = await e.getInitialProps(t);
      if (r && h(r)) return n;
      if (!n)
        throw Object.defineProperty(
          Error(`"${d(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`),
          '__NEXT_ERROR_CODE',
          { value: 'E1025', enumerable: !1, configurable: !0 },
        );
      return n;
    }
    const m = 'u' > typeof performance,
      x = m && ['mark', 'measure', 'getEntriesByName'].every((e) => 'function' == typeof performance[e]);
    class b extends Error {}
    class g extends Error {}
    class y extends Error {
      constructor(e) {
        super(),
          (this.code = 'ENOENT'),
          (this.name = 'PageNotFoundError'),
          (this.message = `Cannot find module for page: ${e}`);
      }
    }
    class v extends Error {
      constructor(e, t) {
        super(), (this.message = `Failed to load static file for page: ${e} ${t}`);
      }
    }
    class j extends Error {
      constructor() {
        super(), (this.code = 'ENOENT'), (this.message = 'Cannot find the middleware module');
      }
    }
    function S(e) {
      return JSON.stringify({ message: e.message, stack: e.stack });
    }
  },
  55964,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'isLocalURL', { enumerable: !0, get: () => a });
    const n = e.r(92937),
      s = e.r(56102);
    function a(e) {
      if (!(0, n.isAbsoluteUrl)(e)) return !0;
      try {
        const t = (0, n.getLocationOrigin)(),
          r = new URL(e, t);
        return r.origin === t && (0, s.hasBasePath)(r.pathname);
      } catch (e) {
        return !1;
      }
    }
  },
  55337,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = { assign: () => l, searchParamsToUrlQuery: () => a, urlQueryToSearchParams: () => o };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    function a(e) {
      const t = {};
      for (const [r, n] of e.entries()) {
        const e = t[r];
        void 0 === e ? (t[r] = n) : Array.isArray(e) ? e.push(n) : (t[r] = [e, n]);
      }
      return t;
    }
    function i(e) {
      return 'string' == typeof e
        ? e
        : ('number' != typeof e || isNaN(e)) && 'boolean' != typeof e
          ? ''
          : String(e);
    }
    function o(e) {
      const t = new URLSearchParams();
      for (const [r, n] of Object.entries(e))
        if (Array.isArray(n)) for (const e of n) t.append(r, i(e));
        else t.set(r, i(n));
      return t;
    }
    function l(e, ...t) {
      for (const r of t) {
        for (const t of r.keys()) e.delete(t);
        for (const [t, n] of r.entries()) e.append(t, n);
      }
      return e;
    }
  },
  30174,
  (e, t, r) => {
    e.i(90114), Object.defineProperty(r, '__esModule', { value: !0 });
    var n = { formatUrl: () => o, formatWithValidation: () => u, urlObjectKeys: () => l };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    const a = e.r(56421)._(e.r(55337)),
      i = /https?|ftp|gopher|file/;
    function o(e) {
      let { auth: t, hostname: r } = e,
        n = e.protocol || '',
        s = e.pathname || '',
        o = e.hash || '',
        l = e.query || '',
        u = !1;
      (t = t ? encodeURIComponent(t).replace(/%3A/i, ':') + '@' : ''),
        e.host
          ? (u = t + e.host)
          : r && ((u = t + (~r.indexOf(':') ? `[${r}]` : r)), e.port && (u += ':' + e.port)),
        l && 'object' == typeof l && (l = String(a.urlQueryToSearchParams(l)));
      let c = e.search || (l && `?${l}`) || '';
      return (
        n && !n.endsWith(':') && (n += ':'),
        e.slashes || ((!n || i.test(n)) && !1 !== u)
          ? ((u = '//' + (u || '')), s && '/' !== s[0] && (s = '/' + s))
          : u || (u = ''),
        o && '#' !== o[0] && (o = '#' + o),
        c && '?' !== c[0] && (c = '?' + c),
        (s = s.replace(/[?#]/g, encodeURIComponent)),
        (c = c.replace('#', '%23')),
        `${n}${u}${s}${c}${o}`
      );
    }
    const l = [
      'auth',
      'hash',
      'host',
      'hostname',
      'href',
      'path',
      'pathname',
      'port',
      'protocol',
      'query',
      'search',
      'slashes',
    ];
    function u(e) {
      return o(e);
    }
  },
  78071,
  (e, t, r) => {
    t.exports = e.r(85654);
  },
  84803,
  98460,
  (e) => {
    const t = [
        { code: 'AC', name: 'Acre', region: 'Norte', ibge: '12' },
        { code: 'AL', name: 'Alagoas', region: 'Nordeste', ibge: '27' },
        { code: 'AP', name: 'Amapá', region: 'Norte', ibge: '16' },
        { code: 'AM', name: 'Amazonas', region: 'Norte', ibge: '13' },
        { code: 'BA', name: 'Bahia', region: 'Nordeste', ibge: '29' },
        { code: 'CE', name: 'Ceará', region: 'Nordeste', ibge: '23' },
        { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', ibge: '53' },
        { code: 'ES', name: 'Espírito Santo', region: 'Sudeste', ibge: '32' },
        { code: 'GO', name: 'Goiás', region: 'Centro-Oeste', ibge: '52' },
        { code: 'MA', name: 'Maranhão', region: 'Nordeste', ibge: '21' },
        { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', ibge: '51' },
        { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', ibge: '50' },
        { code: 'MG', name: 'Minas Gerais', region: 'Sudeste', ibge: '31' },
        { code: 'PA', name: 'Pará', region: 'Norte', ibge: '15' },
        { code: 'PB', name: 'Paraíba', region: 'Nordeste', ibge: '25' },
        { code: 'PR', name: 'Paraná', region: 'Sul', ibge: '41' },
        { code: 'PE', name: 'Pernambuco', region: 'Nordeste', ibge: '26' },
        { code: 'PI', name: 'Piauí', region: 'Nordeste', ibge: '22' },
        { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', ibge: '33' },
        { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', ibge: '24' },
        { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul', ibge: '43' },
        { code: 'RO', name: 'Rondônia', region: 'Norte', ibge: '11' },
        { code: 'RR', name: 'Roraima', region: 'Norte', ibge: '14' },
        { code: 'SC', name: 'Santa Catarina', region: 'Sul', ibge: '42' },
        { code: 'SP', name: 'São Paulo', region: 'Sudeste', ibge: '35' },
        { code: 'SE', name: 'Sergipe', region: 'Nordeste', ibge: '28' },
        { code: 'TO', name: 'Tocantins', region: 'Norte', ibge: '17' },
        { code: 'ZZ', name: 'Exterior', region: 'Exterior', ibge: '' },
      ],
      r = new Map(t.map((e) => [e.code, e])),
      n = t.filter((e) => 'ZZ' !== e.code);
    e.s(['DOMESTIC_STATES', 0, n, 'isStateCode', 0, (e) => r.has(e.toUpperCase())], 98460), e.s([], 84803);
  },
  3485,
  (e) => {
    const t = new Map();
    e.s([
      'formatClock',
      0,
      (e, r = 'America/Sao_Paulo') => {
        var n, s;
        let a;
        return e
          ? ((n = `clock:${r}`),
            (s = { timeZone: r, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !1 }),
            !(a = t.get(n)) && ((a = new Intl.DateTimeFormat('pt-BR', s)), t.set(n, a)),
            a).format(new Date(e))
          : '—';
      },
    ]);
  },
]);
