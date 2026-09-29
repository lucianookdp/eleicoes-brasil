(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  95449,
  (e) => {
    e.i(90114);
    var t = e.i(19496),
      r = e.i(70837),
      n = e.i(39242),
      o = e.i(13174);
    const u = '/eleicoes-brasil';
    e.s([
      'default',
      0,
      () => {
        const [e, i] = (0, n.useState)(!1);
        return ((0, n.useEffect)(() => {
          const e = ((e, t) => {
            const r = e.startsWith(u) ? e.slice(u.length) : e,
              n = /^\/elections\/([a-z0-9-]+)(\/.*?)?\/?$/.exec(r);
            if (!n) return null;
            const i = new URLSearchParams(t),
              a = i.get('cargo') ? { cargo: i.get('cargo') } : void 0,
              l = n[2] ?? '';
            return (0, o.electionHref)({ electionSlug: n[1], round: Number(i.get('turno') ?? 1) }, l, a);
          })(window.location.pathname, window.location.search);
          e ? window.location.replace(`${u}${e}`) : i(!0);
        }, []),
        e)
          ? (0, t.jsxs)('main', {
              className: 'mx-auto max-w-xl px-4 py-24',
              children: [
                (0, t.jsx)('h1', { className: 'text-2xl font-semibold', children: 'Página não encontrada' }),
                (0, t.jsx)('p', {
                  className: 'mt-2 text-ink-2',
                  children: 'O endereço não existe ou a área pedida não faz parte desta eleição.',
                }),
                (0, t.jsx)(r.default, {
                  href: '/',
                  className: 'mt-6 inline-flex min-h-10 items-center text-info underline underline-offset-2',
                  children: 'Ir para a apuração',
                }),
              ],
            })
          : null;
      },
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
        let o = new URLSearchParams({ e: e.electionSlug, t: String(e.round) }),
          u = t[r];
        if (!u) {
          const e = /^\/states\/([a-z]{2})(?:\/cities\/(\d{5}))?$/.exec(r);
          e
            ? (o.set('uf', e[1]),
              e[2] && o.set('c', e[2]),
              (u = e[2] ? '/eleicao/municipio/' : '/eleicao/estado/'))
            : (u = '/eleicao/');
        }
        for (const [e, t] of Object.entries(n ?? {})) o.set(e, t);
        return `${u}?${o}`;
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
  70837,
  (e, t, r) => {
    e.i(90114), Object.defineProperty(r, '__esModule', { value: !0 });
    var n = { default: () => y, useLinkStatus: () => v };
    for (var o in n) Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
    const u = e.r(56421),
      i = e.r(19496),
      a = u._(e.r(39242)),
      l = e.r(30174),
      s = e.r(31230),
      c = e.r(46766),
      f = e.r(92937),
      d = e.r(41156),
      p = e.r(13928),
      h = e.r(26545),
      g = e.r(55964),
      m = e.r(40186);
    function y(t) {
      var r;
      let n,
        o,
        u,
        [y, v] = (0, a.useOptimistic)(h.IDLE_LINK_STATUS),
        P = (0, a.useRef)(null),
        {
          href: S,
          as: E,
          children: O,
          prefetch: _ = null,
          passHref: x,
          replace: j,
          shallow: T,
          scroll: C,
          onClick: R,
          onMouseEnter: N,
          onTouchStart: w,
          legacyBehavior: $ = !1,
          onNavigate: L,
          transitionTypes: U,
          ref: A,
          unstable_dynamicOnHover: I,
          ...k
        } = t;
      (n = O), $ && ('string' == typeof n || 'number' == typeof n) && (n = (0, i.jsx)('a', { children: n }));
      const M = a.default.useContext(s.AppRouterContext),
        B = !1 !== _,
        F = !1 === _ ? 'none' : !0 === _ ? 'full' : 'auto',
        D = 'none' !== F ? ('auto' === F ? m.FetchStrategy.PPR : m.FetchStrategy.Full) : m.FetchStrategy.PPR,
        z = 'string' == typeof (r = E || S) ? r : (0, l.formatUrl)(r);
      if ($) {
        if (n?.$$typeof === Symbol.for('react.lazy'))
          throw Object.defineProperty(
            Error(
              "`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag.",
            ),
            '__NEXT_ERROR_CODE',
            { value: 'E863', enumerable: !1, configurable: !0 },
          );
        o = a.default.Children.only(n);
      }
      let K = $ ? o && 'object' == typeof o && o.ref : A,
        W,
        Q = a.default.useCallback(
          (e) => (
            null !== M && (P.current = (0, h.mountLinkInstance)(e, z, M, D, B, v, W)),
            () => {
              P.current && ((0, h.unmountLinkForCurrentNavigation)(P.current), (P.current = null)),
                (0, h.unmountPrefetchableInstance)(e);
            }
          ),
          [B, z, M, D, v, W],
        ),
        X = {
          ref: (0, c.useMergedRef)(Q, K),
          onClick(t) {
            $ || 'function' != typeof R || R(t),
              $ && o.props && 'function' == typeof o.props.onClick && o.props.onClick(t),
              !M ||
                t.defaultPrevented ||
                ((t, r, n, o, u, i, l, s = 'none') => {
                  if ('u' > typeof window) {
                    let c,
                      { nodeName: f } = t.currentTarget;
                    if (
                      ('A' === f.toUpperCase() &&
                        (((c = t.currentTarget.getAttribute('target')) && '_self' !== c) ||
                          t.metaKey ||
                          t.ctrlKey ||
                          t.shiftKey ||
                          t.altKey ||
                          (t.nativeEvent && 2 === t.nativeEvent.which))) ||
                      t.currentTarget.hasAttribute('download')
                    )
                      return;
                    if (!(0, g.isLocalURL)(r)) {
                      o && (t.preventDefault(), location.replace(r));
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
                    const { dispatchNavigateAction: d } = e.r(8934);
                    a.default.startTransition(() => {
                      d(
                        r,
                        o ? 'replace' : 'push',
                        !1 === u ? p.ScrollBehavior.NoScroll : p.ScrollBehavior.Default,
                        n.current,
                        l,
                        s,
                      );
                    });
                  }
                })(t, z, P, j, C, L, U, F);
          },
          onMouseEnter(e) {
            $ || 'function' != typeof N || N(e),
              $ && o.props && 'function' == typeof o.props.onMouseEnter && o.props.onMouseEnter(e),
              M && B && (0, h.onNavigationIntent)(e.currentTarget, !0 === I);
          },
          onTouchStart: (e) => {
            $ || 'function' != typeof w || w(e),
              $ && o.props && 'function' == typeof o.props.onTouchStart && o.props.onTouchStart(e),
              M && B && (0, h.onNavigationIntent)(e.currentTarget, !0 === I);
          },
        };
      return (
        (0, f.isAbsoluteUrl)(z)
          ? (X.href = z)
          : ($ && !x && ('a' !== o.type || 'href' in o.props)) || (X.href = (0, d.addBasePath)(z)),
        (u = $ ? a.default.cloneElement(o, X) : (0, i.jsx)('a', { ...k, ...X, children: n })),
        (0, i.jsx)(b.Provider, { value: y, children: u })
      );
    }
    const b = (0, a.createContext)(h.IDLE_LINK_STATUS),
      v = () => (0, a.useContext)(b);
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  46766,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'useMergedRef', { enumerable: !0, get: () => o });
    const n = e.r(39242);
    function o(e, t) {
      const r = (0, n.useRef)(null),
        o = (0, n.useRef)(null);
      return (0, n.useCallback)(
        (n) => {
          if (null === n) {
            const e = r.current;
            e && ((r.current = null), e());
            const t = o.current;
            t && ((o.current = null), t());
          } else e && (r.current = u(e, n)), t && (o.current = u(t, n));
        },
        [e, t],
      );
    }
    function u(e, t) {
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
      DecodeError: () => y,
      MiddlewareNotFoundError: () => S,
      MissingStaticPage: () => P,
      NormalizeError: () => b,
      PageNotFoundError: () => v,
      SP: () => g,
      ST: () => m,
      WEB_VITALS: () => u,
      execOnce: () => i,
      getDisplayName: () => f,
      getLocationOrigin: () => s,
      getURL: () => c,
      isAbsoluteUrl: () => l,
      isResSent: () => d,
      loadGetInitialProps: () => h,
      normalizeRepeatedSlashes: () => p,
      stringifyError: () => E,
    };
    for (var o in n) Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
    const u = ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'];
    function i(e) {
      let t,
        r = !1;
      return (...n) => (r || ((r = !0), (t = e(...n))), t);
    }
    const a = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/,
      l = (e) => {
        const t = e.charCodeAt(0);
        return !!((t >= 65 && t <= 90) || (t >= 97 && t <= 122)) && a.test(e);
      };
    function s() {
      const { protocol: e, hostname: t, port: r } = window.location;
      return `${e}//${t}${r ? ':' + r : ''}`;
    }
    function c() {
      const { href: e } = window.location,
        t = s();
      return e.substring(t.length);
    }
    function f(e) {
      return 'string' == typeof e ? e : e.displayName || e.name || 'Unknown';
    }
    function d(e) {
      return e.finished || e.headersSent;
    }
    function p(e) {
      const t = e.split('?');
      return t[0].replace(/\\/g, '/').replace(/\/\/+/g, '/') + (t[1] ? `?${t.slice(1).join('?')}` : '');
    }
    async function h(e, t) {
      const r = t.res || (t.ctx && t.ctx.res);
      if (!e.getInitialProps) return t.ctx && t.Component ? { pageProps: await h(t.Component, t.ctx) } : {};
      const n = await e.getInitialProps(t);
      if (r && d(r)) return n;
      if (!n)
        throw Object.defineProperty(
          Error(`"${f(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`),
          '__NEXT_ERROR_CODE',
          { value: 'E1025', enumerable: !1, configurable: !0 },
        );
      return n;
    }
    const g = 'u' > typeof performance,
      m = g && ['mark', 'measure', 'getEntriesByName'].every((e) => 'function' == typeof performance[e]);
    class y extends Error {}
    class b extends Error {}
    class v extends Error {
      constructor(e) {
        super(),
          (this.code = 'ENOENT'),
          (this.name = 'PageNotFoundError'),
          (this.message = `Cannot find module for page: ${e}`);
      }
    }
    class P extends Error {
      constructor(e, t) {
        super(), (this.message = `Failed to load static file for page: ${e} ${t}`);
      }
    }
    class S extends Error {
      constructor() {
        super(), (this.code = 'ENOENT'), (this.message = 'Cannot find the middleware module');
      }
    }
    function E(e) {
      return JSON.stringify({ message: e.message, stack: e.stack });
    }
  },
  55964,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'isLocalURL', { enumerable: !0, get: () => u });
    const n = e.r(92937),
      o = e.r(56102);
    function u(e) {
      if (!(0, n.isAbsoluteUrl)(e)) return !0;
      try {
        const t = (0, n.getLocationOrigin)(),
          r = new URL(e, t);
        return r.origin === t && (0, o.hasBasePath)(r.pathname);
      } catch (e) {
        return !1;
      }
    }
  },
  55337,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = { assign: () => l, searchParamsToUrlQuery: () => u, urlQueryToSearchParams: () => a };
    for (var o in n) Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
    function u(e) {
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
    function a(e) {
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
    var n = { formatUrl: () => a, formatWithValidation: () => s, urlObjectKeys: () => l };
    for (var o in n) Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
    const u = e.r(56421)._(e.r(55337)),
      i = /https?|ftp|gopher|file/;
    function a(e) {
      let { auth: t, hostname: r } = e,
        n = e.protocol || '',
        o = e.pathname || '',
        a = e.hash || '',
        l = e.query || '',
        s = !1;
      (t = t ? encodeURIComponent(t).replace(/%3A/i, ':') + '@' : ''),
        e.host
          ? (s = t + e.host)
          : r && ((s = t + (~r.indexOf(':') ? `[${r}]` : r)), e.port && (s += ':' + e.port)),
        l && 'object' == typeof l && (l = String(u.urlQueryToSearchParams(l)));
      let c = e.search || (l && `?${l}`) || '';
      return (
        n && !n.endsWith(':') && (n += ':'),
        e.slashes || ((!n || i.test(n)) && !1 !== s)
          ? ((s = '//' + (s || '')), o && '/' !== o[0] && (o = '/' + o))
          : s || (s = ''),
        a && '#' !== a[0] && (a = '#' + a),
        c && '?' !== c[0] && (c = '?' + c),
        (o = o.replace(/[?#]/g, encodeURIComponent)),
        (c = c.replace('#', '%23')),
        `${n}${s}${o}${c}${a}`
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
    function s(e) {
      return a(e);
    }
  },
]);
