(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  99125,
  (e, t, r) => {
    e.i(90114),
      Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'useRouterBFCache', { enumerable: !0, get: () => l });
    const n = e.r(39242);
    function l(e, t, r) {
      const [l, u] = (0, n.useState)(() => ({ tree: e, cacheNode: t, stateKey: r, next: null }));
      if (l.tree === e) return l;
      let a = { tree: e, cacheNode: t, stateKey: r, next: null },
        o = 1,
        d = l,
        s = a;
      for (; null !== d && o < 1; ) {
        if (d.stateKey === r) {
          s.next = d.next;
          break;
        }
        {
          o++;
          const e = { tree: d.tree, cacheNode: d.cacheNode, stateKey: d.stateKey, next: null };
          (s.next = e), (s = e);
        }
        d = d.next;
      }
      return u(a), a;
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  44155,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'ClientPageRoot', { enumerable: !0, get: () => s });
    const n = e.r(19496),
      l = e.r(31230),
      u = e.r(39242),
      a = e.r(58271),
      o = e.r(11500),
      d = e.r(30157);
    function s({ Component: e, serverProvidedParams: t }) {
      let r, i;
      if (null !== t) (r = t.searchParams), (i = t.params);
      else {
        const e = (0, u.use)(l.LayoutRouterContext);
        (i = null !== e ? e.parentParams : {}),
          (r = (0, a.urlSearchParamsToParsedUrlQuery)((0, u.use)(o.SearchParamsContext)));
      }
      const c = (0, d.createClientSearchParams)(r),
        f = (0, d.createClientParams)(i);
      return (0, n.jsx)(e, { params: f, searchParams: c });
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  65844,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'ClientSegmentRoot', { enumerable: !0, get: () => o });
    const n = e.r(19496),
      l = e.r(31230),
      u = e.r(39242),
      a = e.r(30157);
    function o({ Component: e, slots: t, serverProvidedParams: r }) {
      let d;
      if (null !== r) d = r.params;
      else {
        const e = (0, u.use)(l.LayoutRouterContext);
        d = null !== e ? e.parentParams : {};
      }
      const s = (0, a.createClientParams)(d);
      return (0, n.jsx)(e, { ...t, params: s });
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  86850,
  (e, t, r) => {
    e.i(90114),
      Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'HTTPAccessFallbackBoundary', { enumerable: !0, get: () => i });
    const n = e.r(56421),
      l = e.r(19496),
      u = n._(e.r(39242)),
      a = e.r(54563),
      o = e.r(54476),
      d = e.r(31230);
    class s extends u.default.Component {
      constructor(e) {
        super(e), (this.state = { triggeredStatus: void 0, previousPathname: e.pathname });
      }
      componentDidCatch() {}
      static getDerivedStateFromError(e) {
        if ((0, o.isHTTPAccessFallbackError)(e))
          return { triggeredStatus: (0, o.getAccessFallbackHTTPStatus)(e) };
        throw e;
      }
      static getDerivedStateFromProps(e, t) {
        return e.pathname !== t.previousPathname && t.triggeredStatus
          ? { triggeredStatus: void 0, previousPathname: e.pathname }
          : { triggeredStatus: t.triggeredStatus, previousPathname: e.pathname };
      }
      render() {
        const { notFound: e, forbidden: t, unauthorized: r, children: n } = this.props,
          { triggeredStatus: u } = this.state,
          a = {
            [o.HTTPAccessErrorStatus.NOT_FOUND]: e,
            [o.HTTPAccessErrorStatus.FORBIDDEN]: t,
            [o.HTTPAccessErrorStatus.UNAUTHORIZED]: r,
          };
        if (u) {
          const d = u === o.HTTPAccessErrorStatus.NOT_FOUND && e,
            s = u === o.HTTPAccessErrorStatus.FORBIDDEN && t,
            i = u === o.HTTPAccessErrorStatus.UNAUTHORIZED && r;
          return d || s || i
            ? (0, l.jsxs)(l.Fragment, {
                children: [(0, l.jsx)('meta', { name: 'robots', content: 'noindex' }), !1, a[u]],
              })
            : n;
        }
        return n;
      }
    }
    function i({ notFound: e, forbidden: t, unauthorized: r, children: n }) {
      const o = (0, a.useUntrackedPathname)(),
        c = (0, u.useContext)(d.MissingSlotContext);
      return e || t || r
        ? (0, l.jsx)(s, {
            pathname: o,
            notFound: e,
            forbidden: t,
            unauthorized: r,
            missingSlots: c,
            children: n,
          })
        : (0, l.jsx)(l.Fragment, { children: n });
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  354,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      InstantValidationBoundaryContext: () => u,
      PlaceValidationBoundaryBelowThisLevel: () => a,
      RenderValidationBoundaryAtThisLevel: () => o,
      SlotMarker: () => d,
    };
    for (var l in n) Object.defineProperty(r, l, { enumerable: !0, get: n[l] });
    const u = null,
      a = null,
      o = null,
      d = null;
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  84831,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      InstantValidationBoundaryContext: () => u.InstantValidationBoundaryContext,
      PlaceValidationBoundaryBelowThisLevel: () => u.PlaceValidationBoundaryBelowThisLevel,
      RenderValidationBoundaryAtThisLevel: () => u.RenderValidationBoundaryAtThisLevel,
      SlotMarker: () => u.SlotMarker,
    };
    for (var l in n) Object.defineProperty(r, l, { enumerable: !0, get: n[l] });
    const u = e.r(354);
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  39052,
  (e, t, r) => {
    e.i(90114), Object.defineProperty(r, '__esModule', { value: !0 });
    var n = { LoadingBoundaryProvider: () => C, default: () => T };
    for (var l in n) Object.defineProperty(r, l, { enumerable: !0, get: n[l] });
    const u = e.r(36437),
      a = e.r(56421),
      o = e.r(19496),
      d = a._(e.r(39242)),
      s = u._(e.r(76342)),
      i = e.r(31230),
      c = e.r(40734),
      f = e.r(36718),
      p = e.r(24181),
      y = e.r(58288),
      m = e.r(86850);
    e.r(84831);
    const b = e.r(19806),
      _ = e.r(99125);
    e.r(81160);
    const h = e.r(11500),
      P = e.r(58271),
      v = e.r(98047);
    s.default.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function g(e, t, r) {
      const n = e.getClientRects();
      if (0 === n.length) return 0;
      let l = 1 / 0;
      for (let e = 0; e < n.length; e++) {
        const t = n[e];
        t.top < l && (l = t.top);
      }
      return l >= r() && l <= t ? 1 : 2;
    }
    d.default.Component;
    const j = (e) => {
      const t = d.default.useRef(null);
      return (
        (0, d.useLayoutEffect)(
          () => {
            const { focusAndScrollRef: r, cacheNode: n } = e,
              l = r.forceScroll ? r.scrollRef : n.scrollRef;
            if (null === l || !l.current) return;
            let u = null,
              a = r.hashFragment;
            if (a) {
              var o;
              if (
                null ===
                (u =
                  'top' === (o = a)
                    ? document.body
                    : (document.getElementById(o) ?? document.getElementsByName(o)[0] ?? null))
              ) {
                (l.current = !1), (r.onlyHashChange = !1), (r.hashFragment = null);
                return;
              }
            } else u = t.current;
            if (null === u) return;
            let d = !1;
            (0, p.disableSmoothScrollDuringRouteTransition)(
              () => {
                let e = document.documentElement,
                  t = null,
                  r = null,
                  n = null,
                  o = () => {
                    var r, l;
                    let u, a;
                    return (
                      null === n &&
                        ((r = e),
                        (l = t),
                        (n =
                          !Number.isFinite(
                            (a = Number.parseFloat((u = getComputedStyle(r).scrollPaddingTop))),
                          ) || a < 0
                            ? 0
                            : u.endsWith('px')
                              ? a
                              : u.endsWith('%')
                                ? (a / 100) * l
                                : 0)),
                      n
                    );
                  };
                (a || ((t = e.clientHeight), 0 !== (r = g(u, t, o)))) &&
                  (((d = !0), (l.current = !1), a)
                    ? u.scrollIntoView()
                    : 1 !== r && ((e.scrollTop = 0), 2 === g(u, t, o) && u.scrollIntoView()));
              },
              { dontForceLayout: !0, onlyHashChange: r.onlyHashChange },
            ),
              d && ((r.onlyHashChange = !1), (r.hashFragment = null));
          },
          void 0,
        ),
        (0, o.jsx)(d.Fragment, { ref: t, children: e.children })
      );
    };
    function O({ children: e, cacheNode: t }) {
      const r = (0, d.useContext)(i.GlobalLayoutRouterContext);
      if (!r)
        throw Object.defineProperty(
          Error('invariant global layout router not mounted'),
          '__NEXT_ERROR_CODE',
          { value: 'E473', enumerable: !1, configurable: !0 },
        );
      return (0, o.jsx)(j, { focusAndScrollRef: r.focusAndScrollRef, cacheNode: t, children: e });
    }
    function x({
      tree: e,
      segmentPath: t,
      debugNameContext: r,
      cacheNode: n,
      params: l,
      url: u,
      isActive: a,
    }) {
      let s,
        f = (0, d.useContext)(i.GlobalLayoutRouterContext);
      if (((0, d.useContext)(h.NavigationPromisesContext), !f))
        throw Object.defineProperty(
          Error('invariant global layout router not mounted'),
          '__NEXT_ERROR_CODE',
          { value: 'E473', enumerable: !1, configurable: !0 },
        );
      const p = null !== n ? n : (0, d.use)(c.unresolvedThenable),
        y = null !== p.prefetchRsc ? p.prefetchRsc : p.rsc,
        m = (0, d.useDeferredValue)(p.rsc, y);
      if ((0, v.isDeferredRsc)(m)) {
        const e = (0, d.use)(m);
        null === e && (0, d.use)(c.unresolvedThenable), (s = e);
      } else null === m && (0, d.use)(c.unresolvedThenable), (s = m);
      const b = s;
      return (0, o.jsx)(i.LayoutRouterContext.Provider, {
        value: {
          parentTree: e,
          parentCacheNode: p,
          parentSegmentPath: t,
          parentParams: l,
          parentLoadingData: null,
          debugNameContext: r,
          url: u,
          isActive: a,
        },
        children: b,
      });
    }
    function C({ loading: e, children: t }) {
      const r = (0, d.use)(i.LayoutRouterContext);
      return null === r
        ? t
        : (0, o.jsx)(i.LayoutRouterContext.Provider, {
            value: {
              parentTree: r.parentTree,
              parentCacheNode: r.parentCacheNode,
              parentSegmentPath: r.parentSegmentPath,
              parentParams: r.parentParams,
              parentLoadingData: e,
              debugNameContext: r.debugNameContext,
              url: r.url,
              isActive: r.isActive,
            },
            children: t,
          });
    }
    function R({ name: e, loading: t, children: r }) {
      if (null !== t) {
        const n = t[0],
          l = t[1],
          u = t[2];
        return (0, o.jsx)(d.Suspense, {
          name: e,
          fallback: (0, o.jsxs)(o.Fragment, { children: [l, u, n] }),
          children: r,
        });
      }
      return (0, o.jsx)(o.Fragment, { children: r });
    }
    function T({
      parallelRouterKey: e,
      error: t,
      errorStyles: r,
      errorScripts: n,
      templateStyles: l,
      templateScripts: u,
      template: a,
      notFound: s,
      forbidden: p,
      unauthorized: h,
      segmentViewBoundaries: v,
    }) {
      const g = (0, d.useContext)(i.LayoutRouterContext);
      if (!g)
        throw Object.defineProperty(
          Error('invariant expected layout router to be mounted'),
          '__NEXT_ERROR_CODE',
          { value: 'E56', enumerable: !1, configurable: !0 },
        );
      const {
          parentTree: j,
          parentCacheNode: C,
          parentSegmentPath: S,
          parentParams: M,
          parentLoadingData: E,
          url: N,
          isActive: F,
          debugNameContext: A,
        } = g,
        B = j[0],
        D = null === S ? [e] : S.concat([B, e]),
        L = j[1][e],
        H = C.slots;
      (void 0 === L || null === H) && (0, d.use)(c.unresolvedThenable);
      let w = L[0],
        k = H[e] ?? null,
        U = (0, b.createRouterCacheKey)(w, !0),
        V = (0, _.useRouterBFCache)(L, k, U),
        I = [];
      do {
        let e = V.tree,
          d = V.cacheNode,
          c = V.stateKey,
          b = e[0],
          _ = M;
        if (Array.isArray(b)) {
          const e = b[0],
            t = b[1],
            r = b[2],
            n = (0, P.getParamValueFromCacheKey)(t, r);
          null !== n && (_ = { ...M, [e]: n });
        }
        const v = ((e) => {
            if ('/' === e) return '/';
            if ('string' == typeof e)
              if ('(__SLOT__)' === e) return;
              else return e + '/';
            return e[1] + '/';
          })(b),
          g = v ?? A,
          j = void 0 === v ? void 0 : A,
          C = (0, o.jsxs)(O, {
            cacheNode: d,
            children: [
              (0, o.jsx)(f.ErrorBoundary, {
                errorComponent: t,
                errorStyles: r,
                errorScripts: n,
                children: (0, o.jsx)(R, {
                  name: j,
                  loading: E,
                  children: (0, o.jsx)(m.HTTPAccessFallbackBoundary, {
                    notFound: s,
                    forbidden: p,
                    unauthorized: h,
                    children: (0, o.jsxs)(y.RedirectBoundary, {
                      children: [
                        (0, o.jsx)(x, {
                          url: N,
                          tree: e,
                          params: _,
                          cacheNode: d,
                          segmentPath: D,
                          debugNameContext: g,
                          isActive: F && c === U,
                        }),
                        null,
                      ],
                    }),
                  }),
                }),
              }),
              null,
            ],
          }),
          T = (0, o.jsxs)(i.TemplateContext.Provider, { value: C, children: [l, u, a] }, c);
        I.push(T), (V = V.next);
      } while (null !== V);
      return I;
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  12634,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'default', { enumerable: !0, get: () => o });
    const n = e.r(56421),
      l = e.r(19496),
      u = n._(e.r(39242)),
      a = e.r(31230);
    function o() {
      const e = (0, u.useContext)(a.TemplateContext);
      return (0, l.jsx)(l.Fragment, { children: e });
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  63590,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'createRenderParamsFromClient', { enumerable: !0, get: () => l });
    const n = new WeakMap();
    function l(e) {
      const t = n.get(e);
      if (t) return t;
      const r = Promise.resolve(e);
      return n.set(e, r), r;
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  8828,
  (e, t, r) => {
    e.i(90114),
      Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'createRenderParamsFromClient', { enumerable: !0, get: () => n });
    const n = e.r(63590).createRenderParamsFromClient;
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  98157,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'createRenderSearchParamsFromClient', { enumerable: !0, get: () => l });
    const n = new WeakMap();
    function l(e) {
      const t = n.get(e);
      if (t) return t;
      const r = Promise.resolve(e);
      return n.set(e, r), r;
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  70588,
  (e, t, r) => {
    e.i(90114),
      Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'createRenderSearchParamsFromClient', { enumerable: !0, get: () => n });
    const n = e.r(98157).createRenderSearchParamsFromClient;
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  30157,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      createClientParams: () => u.createRenderParamsFromClient,
      createClientSearchParams: () => a.createRenderSearchParamsFromClient,
    };
    for (var l in n) Object.defineProperty(r, l, { enumerable: !0, get: n[l] });
    const u = e.r(8828),
      a = e.r(70588);
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  86658,
  (e, t, r) => {
    Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'IconMark', { enumerable: !0, get: () => l });
    const n = e.r(19496),
      l = () => ('u' > typeof window ? null : (0, n.jsx)('meta', { name: '«nxt-icon»' }));
  },
  24181,
  (e, t, r) => {
    function n(e, t = {}) {
      if (t.onlyHashChange) return void e();
      const r = document.documentElement;
      if ('smooth' !== r.dataset.scrollBehavior) return void e();
      const l = r.style.scrollBehavior;
      (r.style.scrollBehavior = 'auto'),
        t.dontForceLayout || r.getClientRects(),
        e(),
        (r.style.scrollBehavior = l);
    }
    e.i(90114),
      Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'disableSmoothScrollDuringRouteTransition', { enumerable: !0, get: () => n });
  },
]);
