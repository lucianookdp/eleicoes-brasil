(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  17661,
  (e) => {
    var t = e.i(19496),
      r = e.i(57922),
      s = e.i(78071),
      i = e.i(39242),
      n = e.i(9259),
      u = e.i(77339),
      a = e.i(13174);
    e.s([
      'default',
      0,
      () => {
        const e = (0, s.useRouter)(),
          { data: l, error: o } = (0, r.useQuery)({
            queryKey: ['elections'],
            queryFn: () => (0, u.api)('/api/elections'),
          }),
          c = l && (0, a.defaultElection)(l);
        return (
          (0, i.useEffect)(() => {
            if (!c) return;
            const t = c.rounds.filter((e) => 'scheduled' !== e.status).at(-1) ?? c.rounds[0];
            e.replace((0, a.electionHref)(t));
          }, [c, e]),
          (0, t.jsxs)('main', {
            className: 'mx-auto max-w-xl px-4 py-24',
            children: [
              (0, t.jsxs)('p', {
                className: 'flex items-center gap-2 font-semibold',
                children: [(0, t.jsx)(n.Logo, {}), ' Eleições Brasil'],
              }),
              (0, t.jsx)('p', {
                className: 'mt-4 text-ink-2',
                children: o
                  ? 'Não foi possível falar com a API agora. Tente novamente em alguns instantes.'
                  : l && !c
                    ? 'Nenhuma eleição foi carregada ainda.'
                    : 'Carregando a apuração…',
              }),
            ],
          })
        );
      },
    ]);
  },
  9259,
  (e) => {
    var t = e.i(19496);
    function r({ children: e, ...s }) {
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
        ...s,
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
      ({ filled: e, ...s }) =>
        (0, t.jsx)(r, {
          ...s,
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
  77339,
  (e) => {
    var t = e.i(90114);
    const r = 'http://localhost:4000';
    t.default.env.API_URL;
    class s extends Error {
      status;
      constructor(e, t) {
        super(t), (this.status = e);
      }
    }
    let i = null;
    async function n(e, t) {
      const n = await fetch(
        `${r}${!i || !e.startsWith(`/api/elections/${i.round}/`) ? e : `${e}${e.includes('?') ? '&' : '?'}v=${i.v}`}`,
        t,
      );
      if (!n.ok) {
        const e = await n.json().catch(() => null);
        throw new s(n.status, e?.error?.message ?? `HTTP ${n.status}`);
      }
      return n.json();
    }
    e.s([
      'API_URL',
      0,
      r,
      'api',
      0,
      n,
      'setDataVersion',
      0,
      (e, t) => {
        t > 0 && (i = { round: e, v: t });
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
      (e, r = '', s) => {
        let i = new URLSearchParams({ e: e.electionSlug, t: String(e.round) }),
          n = t[r];
        if (!n) {
          const e = /^\/states\/([a-z]{2})(?:\/cities\/(\d{5}))?$/.exec(r);
          e
            ? (i.set('uf', e[1]),
              e[2] && i.set('c', e[2]),
              (n = e[2] ? '/eleicao/municipio/' : '/eleicao/estado/'))
            : (n = '/eleicao/');
        }
        for (const [e, t] of Object.entries(s ?? {})) i.set(e, t);
        return `${n}?${i}`;
      },
      'pickRound',
      0,
      (e, t, r) => {
        const s = e.find((e) => e.slug === t);
        return s
          ? r
            ? (s.rounds.find((e) => String(e.round) === r) ?? null)
            : (s.rounds.filter((e) => 'scheduled' !== e.status).at(-1) ?? s.rounds[0] ?? null)
          : null;
      },
    ]);
  },
  57922,
  (e) => {
    let t;
    var r = e.i(59514),
      s = e.i(39242);
    const i = s.createContext(!1);
    i.Provider, e.i(19496);
    const n = s.createContext(
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
    var u = e.i(43699),
      a = e.i(56259),
      l = e.i(60027),
      o = e.i(57545),
      c = e.i(74002),
      h = e.i(79312),
      d = e.i(39330),
      p = class extends c.Subscribable {
        #e;
        #t = void 0;
        #r = void 0;
        #s = void 0;
        #i;
        #n;
        #u;
        #a;
        #l;
        #o;
        #c;
        #h;
        #d;
        #p = new Set();
        constructor(e, t) {
          super(),
            (this.options = t),
            (this.#e = e),
            (this.#u = null),
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
            this.#y());
        }
        onUnsubscribe() {
          this.hasListeners() || this.destroy();
        }
        shouldFetchOnReconnect() {
          return y(this.#t, this.options, this.options.refetchOnReconnect);
        }
        shouldFetchOnWindowFocus() {
          return y(this.#t, this.options, this.options.refetchOnWindowFocus);
        }
        destroy() {
          (this.listeners = new Set()), this.#v(), this.#R(), this.#t.removeObserver(this);
        }
        setOptions(e) {
          const t = this.options,
            r = this.#t;
          if (
            ((this.options = this.#e.defaultQueryOptions(e)),
            void 0 !== this.options.enabled &&
              'boolean' != typeof this.options.enabled &&
              'function' != typeof this.options.enabled &&
              'boolean' != typeof (0, u.resolveQueryValue)(this.options.enabled, this.#t))
          )
            throw Error('Expected enabled to be a boolean or a callback that returns a boolean');
          this.#m(),
            this.#t.setOptions(this.options),
            t._defaulted &&
              !(0, u.shallowEqualObjects)(this.options, t) &&
              this.#e
                .getQueryCache()
                .notify({ type: 'observerOptionsUpdated', query: this.#t, observer: this });
          const s = this.hasListeners();
          s && v(this.#t, r, this.options, t) && this.#f(),
            this.updateResult(),
            s &&
              (this.#t !== r ||
                (0, u.resolveQueryValue)(this.options.enabled, this.#t) !==
                  (0, u.resolveQueryValue)(t.enabled, this.#t) ||
                (0, u.resolveQueryValue)(this.options.staleTime, this.#t) !==
                  (0, u.resolveQueryValue)(t.staleTime, this.#t)) &&
              this.#x();
          const i = this.#Q();
          s &&
            (this.#t !== r ||
              (0, u.resolveQueryValue)(this.options.enabled, this.#t) !==
                (0, u.resolveQueryValue)(t.enabled, this.#t) ||
              i !== this.#d) &&
            this.#g(i);
        }
        getOptimisticResult(e) {
          const t = this.#e.getQueryCache().build(this.#e, e),
            r = this.createResult(t, e);
          return (
            (0, u.shallowEqualObjects)(this.getCurrentResult(), r) ||
              ((this.#s = r), (this.#n = this.options), (this.#i = this.#t.state)),
            r
          );
        }
        getCurrentResult() {
          return this.#s;
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
            s = this.#e.getQueryCache().build(this.#e, r),
            i = () => {},
            n = new Promise((e) => {
              (t = e),
                (i = this.#e.getQueryCache().subscribe((t) => {
                  'updated' === t.type &&
                    t.query.queryHash === s.queryHash &&
                    void 0 !== s.state.data &&
                    (i(), e(this.createResult(s, r)));
                }));
            });
          return Promise.race([
            s
              .fetch()
              .then(() => {
                const e = this.createResult(s, r);
                return t?.(e), e;
              })
              .finally(() => {
                i();
              }),
            n,
          ]);
        }
        fetch(e) {
          return this.#f({ ...e, cancelRefetch: e.cancelRefetch ?? !0 }).then(
            () => (this.updateResult(), this.#s),
          );
        }
        #f(e) {
          this.#m();
          let t = this.#t.fetch(this.options, e);
          return e?.throwOnError || (t = t.catch(u.noop)), t;
        }
        #b(e) {
          return (
            !(0, o.isServer)() &&
            !1 !== (0, u.resolveQueryValue)(this.options.enabled, this.#t) &&
            (0, u.isValidTimeout)(e)
          );
        }
        #x() {
          this.#v();
          const e = (0, u.resolveQueryValue)(this.options.staleTime, this.#t);
          if (this.#s.isStale || !this.#b(e)) return;
          const t = (0, u.timeUntilStale)(this.#s.dataUpdatedAt, e) + 1;
          this.#c = l.timeoutManager.setTimeout(() => {
            this.#s.isStale || this.updateResult();
          }, t);
        }
        #Q() {
          return (0, u.resolveQueryValue)(this.options.refetchInterval, this.#t) ?? !1;
        }
        #g(e) {
          this.#R(),
            (this.#d = e),
            0 !== this.#d &&
              this.#b(this.#d) &&
              (this.#h = l.timeoutManager.setInterval(() => {
                (this.options.refetchIntervalInBackground || h.focusManager.isFocused()) && this.#f();
              }, this.#d));
        }
        #y() {
          this.#x(), this.#g(this.#Q());
        }
        #v() {
          void 0 !== this.#c && (l.timeoutManager.clearTimeout(this.#c), (this.#c = void 0));
        }
        #R() {
          void 0 !== this.#h && (l.timeoutManager.clearInterval(this.#h), (this.#h = void 0));
        }
        createResult(e, t) {
          let r,
            s = this.#t,
            i = this.options,
            n = this.#s,
            a = this.#i,
            l = this.#n,
            o = e !== s ? e.state : this.#r,
            { state: c } = e,
            h = { ...c },
            p = !1;
          if (t._optimisticResults) {
            const r = this.hasListeners(),
              n = !r && f(e, t),
              u = r && v(e, s, t, i);
            (n || u) && (h = { ...h, ...(0, d.fetchState)(c.data, e.options) }),
              'isRestoring' === t._optimisticResults && (h.fetchStatus = 'idle');
          }
          let { error: y, errorUpdatedAt: m, status: x } = h;
          r = h.data;
          let Q = !1;
          if (void 0 !== t.placeholderData && void 0 === r && 'pending' === x) {
            let e;
            n?.isPlaceholderData && t.placeholderData === l?.placeholderData
              ? ((e = n.data), (Q = !0))
              : (e =
                  'function' == typeof t.placeholderData
                    ? t.placeholderData(this.#o?.state.data, this.#o)
                    : t.placeholderData),
              void 0 !== e && ((x = 'success'), (r = (0, u.replaceData)(n?.data, e, t)), (p = !0));
          }
          if (t.select && void 0 !== r && !Q)
            if (n && r === a?.data && t.select === this.#a) r = this.#l;
            else
              try {
                (this.#a = t.select),
                  (r = t.select(r)),
                  (r = (0, u.replaceData)(n?.data, r, t)),
                  (this.#l = r),
                  (this.#u = null);
              } catch (e) {
                this.#u = e;
              }
          else void 0 === r && (this.#u = null);
          this.#u && ((y = this.#u), (r = this.#l), (m = Date.now()), (x = 'error'), (p = !1));
          const g = 'fetching' === h.fetchStatus,
            b = 'pending' === x,
            I = 'error' === x,
            j = b && g,
            S = void 0 !== r;
          return {
            status: x,
            fetchStatus: h.fetchStatus,
            isPending: b,
            isSuccess: 'success' === x,
            isError: I,
            isInitialLoading: j,
            isLoading: j,
            data: r,
            dataUpdatedAt: h.dataUpdatedAt,
            error: y,
            errorUpdatedAt: m,
            failureCount: h.fetchFailureCount,
            failureReason: h.fetchFailureReason,
            errorUpdateCount: h.errorUpdateCount,
            isFetched: e.isFetched(),
            isFetchedAfterMount:
              h.dataUpdateCount > o.dataUpdateCount || h.errorUpdateCount > o.errorUpdateCount,
            isFetching: g,
            isRefetching: g && !b,
            isLoadingError: I && !S,
            isPaused: 'paused' === h.fetchStatus,
            isPlaceholderData: p,
            isRefetchError: I && S,
            isStale: R(e, t),
            refetch: this.refetch,
            isEnabled: !1 !== (0, u.resolveQueryValue)(t.enabled, e),
          };
        }
        updateResult() {
          const e = this.#s,
            t = this.createResult(this.#t, this.options);
          if (
            ((this.#i = this.#t.state),
            (this.#n = this.options),
            void 0 !== this.#i.data && (this.#o = this.#t),
            (0, u.shallowEqualObjects)(t, e))
          )
            return;
          this.#s = t;
          const r = (() => {
            if (!e) return !0;
            const { notifyOnChangeProps: t } = this.options,
              r = 'function' == typeof t ? t() : t;
            if ('all' === r || (!r && !this.#p.size)) return !0;
            const s = new Set(r ?? this.#p);
            return (
              this.options.throwOnError && s.add('error'),
              Object.keys(this.#s).some((t) => this.#s[t] !== e[t] && s.has(t))
            );
          })();
          a.notifyManager.batch(() => {
            r &&
              this.listeners.forEach((e) => {
                e(this.#s);
              }),
              this.#e.getQueryCache().notify({ query: this.#t, type: 'observerResultsUpdated' });
          });
        }
        #m() {
          const e = this.#e.getQueryCache().build(this.#e, this.options);
          if (e === this.#t) return;
          const t = this.#t;
          (this.#t = e),
            (this.#r = e.state),
            this.hasListeners() && (t?.removeObserver(this), e.addObserver(this));
        }
        onQueryUpdate() {
          this.updateResult(), this.hasListeners() && this.#y();
        }
      };
    function f(e, t) {
      return (
        (!1 !== (0, u.resolveQueryValue)(t.enabled, e) &&
          void 0 === e.state.data &&
          ('error' !== e.state.status || !1 !== (0, u.resolveQueryValue)(t.retryOnMount, e))) ||
        (void 0 !== e.state.data && y(e, t, t.refetchOnMount))
      );
    }
    function y(e, t, r) {
      if (
        !1 !== (0, u.resolveQueryValue)(t.enabled, e) &&
        'static' !== (0, u.resolveQueryValue)(t.staleTime, e)
      ) {
        const s = (0, u.resolveQueryValue)(r, e);
        return 'always' === s || (!1 !== s && R(e, t));
      }
      return !1;
    }
    function v(e, t, r, s) {
      return (
        (e !== t || !1 === (0, u.resolveQueryValue)(s.enabled, e)) &&
        (!r.suspense || 'error' !== e.state.status) &&
        R(e, r)
      );
    }
    function R(e, t) {
      return (
        !1 !== (0, u.resolveQueryValue)(t.enabled, e) &&
        e.isStaleByTime((0, u.resolveQueryValue)(t.staleTime, e))
      );
    }
    e.s(
      [
        'useQuery',
        0,
        (e, t) =>
          ((e, t, l) => {
            let o,
              c = s.useContext(i),
              h = s.useContext(n),
              d = (0, r.useQueryClient)(l),
              p = d.defaultQueryOptions(e),
              f = d.getQueryCache().get(p.queryHash),
              y = !1 !== e.subscribed;
            if (((p._optimisticResults = c ? 'isRestoring' : y ? 'optimistic' : void 0), p.suspense)) {
              const e = (e) => ('static' === e ? e : Math.max(e ?? 1e3, 1e3)),
                t = p.staleTime;
              (p.staleTime = 'function' == typeof t ? (...r) => e(t(...r)) : e(t)),
                'number' == typeof p.gcTime && (p.gcTime = Math.max(p.gcTime, 1e3));
            }
            (o =
              f?.state.error && 'function' == typeof p.throwOnError
                ? (0, u.shouldThrowError)(p.throwOnError, [f.state.error, f])
                : p.throwOnError),
              (p.suspense || o) && !h.isReset() && (p.retryOnMount = !1),
              s.useEffect(() => {
                h.clearReset();
              }, [h]);
            const [v] = s.useState(() => new t(d, p)),
              R = v.getOptimisticResult(p),
              m = !c && y;
            if (
              (s.useSyncExternalStore(
                s.useCallback(
                  (e) => {
                    const t = m ? v.subscribe(a.notifyManager.batchCalls(e)) : u.noop;
                    return v.updateResult(), t;
                  },
                  [v, m],
                ),
                () => v.getCurrentResult(),
                () => v.getCurrentResult(),
              ),
              s.useEffect(() => {
                v.setOptions(p);
              }, [p, v]),
              p?.suspense && R.isPending)
            )
              throw v.fetchOptimistic(p).catch(() => {
                h.clearReset();
              });
            if (
              (({ result: e, errorResetBoundary: t, throwOnError: r, query: s, suspense: i }) =>
                e.isError &&
                !t.isReset() &&
                !e.isFetching &&
                s &&
                ((i && void 0 === e.data) || (0, u.shouldThrowError)(r, [e.error, s])))({
                result: R,
                errorResetBoundary: h,
                throwOnError: p.throwOnError,
                query: f,
                suspense: p.suspense,
              })
            )
              throw R.error;
            return p.notifyOnChangeProps ? R : v.trackResult(R);
          })(e, p, t),
      ],
      57922,
    );
  },
  78071,
  (e, t, r) => {
    t.exports = e.r(85654);
  },
]);
