(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  70837,
  (e, t, r) => {
    e.i(90114), Object.defineProperty(r, '__esModule', { value: !0 });
    var n = { default: () => m, useLinkStatus: () => v };
    for (var o in n) Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
    const u = e.r(56421),
      a = e.r(19496),
      i = u._(e.r(39242)),
      l = e.r(30174),
      c = e.r(31230),
      s = e.r(46766),
      f = e.r(92937),
      p = e.r(41156),
      d = e.r(13928),
      h = e.r(26545),
      y = e.r(55964),
      g = e.r(40186);
    function m(t) {
      var r;
      let n,
        o,
        u,
        [m, v] = (0, i.useOptimistic)(h.IDLE_LINK_STATUS),
        P = (0, i.useRef)(null),
        {
          href: E,
          as: _,
          children: O,
          prefetch: S = null,
          passHref: j,
          replace: T,
          shallow: C,
          scroll: R,
          onClick: N,
          onMouseEnter: L,
          onTouchStart: x,
          legacyBehavior: A = !1,
          onNavigate: w,
          transitionTypes: U,
          ref: M,
          unstable_dynamicOnHover: $,
          ...I
        } = t;
      (n = O), A && ('string' == typeof n || 'number' == typeof n) && (n = (0, a.jsx)('a', { children: n }));
      const k = i.default.useContext(c.AppRouterContext),
        B = !1 !== S,
        F = !1 === S ? 'none' : !0 === S ? 'full' : 'auto',
        D = 'none' !== F ? ('auto' === F ? g.FetchStrategy.PPR : g.FetchStrategy.Full) : g.FetchStrategy.PPR,
        K = 'string' == typeof (r = _ || E) ? r : (0, l.formatUrl)(r);
      if (A) {
        if (n?.$$typeof === Symbol.for('react.lazy'))
          throw Object.defineProperty(
            Error(
              "`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag.",
            ),
            '__NEXT_ERROR_CODE',
            { value: 'E863', enumerable: !1, configurable: !0 },
          );
        o = i.default.Children.only(n);
      }
      let z = A ? o && 'object' == typeof o && o.ref : M,
        Q,
        W = i.default.useCallback(
          (e) => (
            null !== k && (P.current = (0, h.mountLinkInstance)(e, K, k, D, B, v, Q)),
            () => {
              P.current && ((0, h.unmountLinkForCurrentNavigation)(P.current), (P.current = null)),
                (0, h.unmountPrefetchableInstance)(e);
            }
          ),
          [B, K, k, D, v, Q],
        ),
        X = {
          ref: (0, s.useMergedRef)(W, z),
          onClick(t) {
            A || 'function' != typeof N || N(t),
              A && o.props && 'function' == typeof o.props.onClick && o.props.onClick(t),
              !k ||
                t.defaultPrevented ||
                ((t, r, n, o, u, a, l, c = 'none') => {
                  if ('u' > typeof window) {
                    let s,
                      { nodeName: f } = t.currentTarget;
                    if (
                      ('A' === f.toUpperCase() &&
                        (((s = t.currentTarget.getAttribute('target')) && '_self' !== s) ||
                          t.metaKey ||
                          t.ctrlKey ||
                          t.shiftKey ||
                          t.altKey ||
                          (t.nativeEvent && 2 === t.nativeEvent.which))) ||
                      t.currentTarget.hasAttribute('download')
                    )
                      return;
                    if (!(0, y.isLocalURL)(r)) {
                      o && (t.preventDefault(), location.replace(r));
                      return;
                    }
                    if ((t.preventDefault(), a)) {
                      let e = !1;
                      if (
                        (a({
                          preventDefault: () => {
                            e = !0;
                          },
                        }),
                        e)
                      )
                        return;
                    }
                    const { dispatchNavigateAction: p } = e.r(8934);
                    i.default.startTransition(() => {
                      p(
                        r,
                        o ? 'replace' : 'push',
                        !1 === u ? d.ScrollBehavior.NoScroll : d.ScrollBehavior.Default,
                        n.current,
                        l,
                        c,
                      );
                    });
                  }
                })(t, K, P, T, R, w, U, F);
          },
          onMouseEnter(e) {
            A || 'function' != typeof L || L(e),
              A && o.props && 'function' == typeof o.props.onMouseEnter && o.props.onMouseEnter(e),
              k && B && (0, h.onNavigationIntent)(e.currentTarget, !0 === $);
          },
          onTouchStart: (e) => {
            A || 'function' != typeof x || x(e),
              A && o.props && 'function' == typeof o.props.onTouchStart && o.props.onTouchStart(e),
              k && B && (0, h.onNavigationIntent)(e.currentTarget, !0 === $);
          },
        };
      return (
        (0, f.isAbsoluteUrl)(K)
          ? (X.href = K)
          : (A && !j && ('a' !== o.type || 'href' in o.props)) || (X.href = (0, p.addBasePath)(K)),
        (u = A ? i.default.cloneElement(o, X) : (0, a.jsx)('a', { ...I, ...X, children: n })),
        (0, a.jsx)(b.Provider, { value: m, children: u })
      );
    }
    const b = (0, i.createContext)(h.IDLE_LINK_STATUS),
      v = () => (0, i.useContext)(b);
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
      DecodeError: () => m,
      MiddlewareNotFoundError: () => E,
      MissingStaticPage: () => P,
      NormalizeError: () => b,
      PageNotFoundError: () => v,
      SP: () => y,
      ST: () => g,
      WEB_VITALS: () => u,
      execOnce: () => a,
      getDisplayName: () => f,
      getLocationOrigin: () => c,
      getURL: () => s,
      isAbsoluteUrl: () => l,
      isResSent: () => p,
      loadGetInitialProps: () => h,
      normalizeRepeatedSlashes: () => d,
      stringifyError: () => _,
    };
    for (var o in n) Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
    const u = ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'];
    function a(e) {
      let t,
        r = !1;
      return (...n) => (r || ((r = !0), (t = e(...n))), t);
    }
    const i = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/,
      l = (e) => {
        const t = e.charCodeAt(0);
        return !!((t >= 65 && t <= 90) || (t >= 97 && t <= 122)) && i.test(e);
      };
    function c() {
      const { protocol: e, hostname: t, port: r } = window.location;
      return `${e}//${t}${r ? ':' + r : ''}`;
    }
    function s() {
      const { href: e } = window.location,
        t = c();
      return e.substring(t.length);
    }
    function f(e) {
      return 'string' == typeof e ? e : e.displayName || e.name || 'Unknown';
    }
    function p(e) {
      return e.finished || e.headersSent;
    }
    function d(e) {
      const t = e.split('?');
      return t[0].replace(/\\/g, '/').replace(/\/\/+/g, '/') + (t[1] ? `?${t.slice(1).join('?')}` : '');
    }
    async function h(e, t) {
      const r = t.res || (t.ctx && t.ctx.res);
      if (!e.getInitialProps) return t.ctx && t.Component ? { pageProps: await h(t.Component, t.ctx) } : {};
      const n = await e.getInitialProps(t);
      if (r && p(r)) return n;
      if (!n)
        throw Object.defineProperty(
          Error(`"${f(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`),
          '__NEXT_ERROR_CODE',
          { value: 'E1025', enumerable: !1, configurable: !0 },
        );
      return n;
    }
    const y = 'u' > typeof performance,
      g = y && ['mark', 'measure', 'getEntriesByName'].every((e) => 'function' == typeof performance[e]);
    class m extends Error {}
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
    class E extends Error {
      constructor() {
        super(), (this.code = 'ENOENT'), (this.message = 'Cannot find the middleware module');
      }
    }
    function _(e) {
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
    var n = { assign: () => l, searchParamsToUrlQuery: () => u, urlQueryToSearchParams: () => i };
    for (var o in n) Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
    function u(e) {
      const t = {};
      for (const [r, n] of e.entries()) {
        const e = t[r];
        void 0 === e ? (t[r] = n) : Array.isArray(e) ? e.push(n) : (t[r] = [e, n]);
      }
      return t;
    }
    function a(e) {
      return 'string' == typeof e
        ? e
        : ('number' != typeof e || isNaN(e)) && 'boolean' != typeof e
          ? ''
          : String(e);
    }
    function i(e) {
      const t = new URLSearchParams();
      for (const [r, n] of Object.entries(e))
        if (Array.isArray(n)) for (const e of n) t.append(r, a(e));
        else t.set(r, a(n));
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
    var n = { formatUrl: () => i, formatWithValidation: () => c, urlObjectKeys: () => l };
    for (var o in n) Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
    const u = e.r(56421)._(e.r(55337)),
      a = /https?|ftp|gopher|file/;
    function i(e) {
      let { auth: t, hostname: r } = e,
        n = e.protocol || '',
        o = e.pathname || '',
        i = e.hash || '',
        l = e.query || '',
        c = !1;
      (t = t ? encodeURIComponent(t).replace(/%3A/i, ':') + '@' : ''),
        e.host
          ? (c = t + e.host)
          : r && ((c = t + (~r.indexOf(':') ? `[${r}]` : r)), e.port && (c += ':' + e.port)),
        l && 'object' == typeof l && (l = String(u.urlQueryToSearchParams(l)));
      let s = e.search || (l && `?${l}`) || '';
      return (
        n && !n.endsWith(':') && (n += ':'),
        e.slashes || ((!n || a.test(n)) && !1 !== c)
          ? ((c = '//' + (c || '')), o && '/' !== o[0] && (o = '/' + o))
          : c || (c = ''),
        i && '#' !== i[0] && (i = '#' + i),
        s && '?' !== s[0] && (s = '?' + s),
        (o = o.replace(/[?#]/g, encodeURIComponent)),
        (s = s.replace('#', '%23')),
        `${n}${c}${o}${s}${i}`
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
    function c(e) {
      return i(e);
    }
  },
]);
