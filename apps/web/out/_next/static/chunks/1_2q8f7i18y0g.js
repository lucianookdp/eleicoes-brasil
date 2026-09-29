(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  45744,
  (t) => {
    var e = t.i(19496),
      i = t.i(43699),
      s = t.i(79312),
      r = t.i(56259),
      n = t.i(79707),
      a = t.i(74002),
      o = t.i(26129),
      u = t.i(40613),
      h = class extends u.Removable {
        #t;
        #e;
        #i;
        #s;
        constructor(t) {
          super(),
            (this.#t = t.client),
            (this.mutationId = t.mutationId),
            (this.#i = t.mutationCache),
            (this.#e = []),
            (this.state = t.state || {
              context: void 0,
              data: void 0,
              error: null,
              failureCount: 0,
              failureReason: null,
              isPaused: !1,
              status: 'idle',
              variables: void 0,
              submittedAt: 0,
            }),
            this.setOptions(t.options),
            this.scheduleGc();
        }
        setOptions(t) {
          (this.options = t), this.updateGcTime(this.options.gcTime);
        }
        get meta() {
          return this.options.meta;
        }
        addObserver(t) {
          this.#e.includes(t) ||
            (this.#e.push(t),
            this.clearGcTimeout(),
            this.#i.notify({ type: 'observerAdded', mutation: this, observer: t }));
        }
        removeObserver(t) {
          (this.#e = this.#e.filter((e) => e !== t)),
            this.scheduleGc(),
            this.#i.notify({ type: 'observerRemoved', mutation: this, observer: t });
        }
        optionalRemove() {
          this.#e.length || ('pending' === this.state.status ? this.scheduleGc() : this.#i.remove(this));
        }
        continue() {
          return (
            this.#s?.continue() ??
            ('pending' === this.state.status ? this.execute(this.state.variables) : Promise.resolve())
          );
        }
        async execute(t) {
          const e = () => {
              this.#r({ type: 'continue' });
            },
            i = { client: this.#t, meta: this.options.meta, mutationKey: this.options.mutationKey },
            s = (this.#s = (0, o.createRetryer)({
              fn: () =>
                this.options.mutationFn
                  ? this.options.mutationFn(t, i)
                  : Promise.reject(Error('No mutationFn found')),
              onFail: (t, e) => {
                this.#r({ type: 'failed', failureCount: t, error: e });
              },
              onPause: () => {
                this.#r({ type: 'pause' });
              },
              onContinue: e,
              retry: this.options.retry ?? 0,
              retryDelay: this.options.retryDelay,
              networkMode: this.options.networkMode,
              canRun: () => this.#i.canRun(this),
            })),
            r = 'pending' === this.state.status,
            n = !s.canStart();
          try {
            if (r) e();
            else {
              this.#r({ type: 'pending', variables: t, isPaused: n }),
                this.#i.config.onMutate && (await this.#i.config.onMutate(t, this, i));
              const e = await this.options.onMutate?.(t, i);
              e !== this.state.context && this.#r({ type: 'pending', context: e, variables: t, isPaused: n });
            }
            const a = await s.start();
            return (
              await this.#i.config.onSuccess?.(a, t, this.state.context, this, i),
              await this.options.onSuccess?.(a, t, this.state.context, i),
              await this.#i.config.onSettled?.(a, null, this.state.variables, this.state.context, this, i),
              await this.options.onSettled?.(a, null, t, this.state.context, i),
              this.#r({ type: 'success', data: a }),
              a
            );
          } catch (e) {
            try {
              await this.#i.config.onError?.(e, t, this.state.context, this, i);
            } catch (t) {
              Promise.reject(t);
            }
            try {
              await this.options.onError?.(e, t, this.state.context, i);
            } catch (t) {
              Promise.reject(t);
            }
            try {
              await this.#i.config.onSettled?.(void 0, e, this.state.variables, this.state.context, this, i);
            } catch (t) {
              Promise.reject(t);
            }
            try {
              await this.options.onSettled?.(void 0, e, t, this.state.context, i);
            } catch (t) {
              Promise.reject(t);
            }
            throw (this.#r({ type: 'error', error: e }), e);
          } finally {
            this.#s === s && (this.#s = void 0), this.#i.runNext(this);
          }
        }
        #r(t) {
          (this.state = ((e) => {
            switch (t.type) {
              case 'failed':
                return { ...e, failureCount: t.failureCount, failureReason: t.error };
              case 'pause':
                return { ...e, isPaused: !0 };
              case 'continue':
                return { ...e, isPaused: !1 };
              case 'pending':
                return {
                  ...e,
                  context: t.context,
                  data: void 0,
                  failureCount: 0,
                  failureReason: null,
                  error: null,
                  isPaused: t.isPaused,
                  status: 'pending',
                  variables: t.variables,
                  submittedAt: Date.now(),
                };
              case 'success':
                return {
                  ...e,
                  data: t.data,
                  failureCount: 0,
                  failureReason: null,
                  error: null,
                  status: 'success',
                  isPaused: !1,
                };
              case 'error':
                return {
                  ...e,
                  data: void 0,
                  error: t.error,
                  failureCount: e.failureCount + 1,
                  failureReason: t.error,
                  isPaused: !1,
                  status: 'error',
                };
            }
          })(this.state)),
            r.notifyManager.batch(() => {
              this.#e.forEach((e) => {
                e.onMutationUpdate(t);
              }),
                this.#i.notify({ mutation: this, type: 'updated', action: t });
            });
        }
      },
      c = class extends a.Subscribable {
        #n;
        #a;
        #o;
        constructor(t = {}) {
          super(), (this.config = t), (this.#n = new Set()), (this.#a = new Map()), (this.#o = 0);
        }
        build(t, e, i) {
          const s = new h({
            client: t,
            mutationCache: this,
            mutationId: ++this.#o,
            options: t.defaultMutationOptions(e),
            state: i,
          });
          return this.add(s), s;
        }
        add(t) {
          this.#n.add(t);
          const e = l(t);
          if ('string' == typeof e) {
            const i = this.#a.get(e);
            i ? i.push(t) : this.#a.set(e, [t]);
          }
          this.notify({ type: 'added', mutation: t });
        }
        remove(t) {
          if (this.#n.delete(t)) {
            const e = l(t);
            if ('string' == typeof e) {
              const i = this.#a.get(e);
              if (i)
                if (i.length > 1) {
                  const e = i.indexOf(t);
                  -1 !== e && i.splice(e, 1);
                } else i[0] === t && this.#a.delete(e);
            }
          }
          this.notify({ type: 'removed', mutation: t });
        }
        canRun(t) {
          const e = l(t);
          if ('string' != typeof e) return !0;
          {
            const i = this.#a.get(e)?.find((t) => 'pending' === t.state.status);
            return !i || i === t;
          }
        }
        runNext(t) {
          const e = l(t);
          return 'string' == typeof e
            ? (this.#a
                .get(e)
                ?.find((e) => e !== t && e.state.isPaused)
                ?.continue() ?? Promise.resolve())
            : Promise.resolve();
        }
        clear() {
          r.notifyManager.batch(() => {
            this.#n.forEach((t) => {
              this.notify({ type: 'removed', mutation: t });
            }),
              this.#n.clear(),
              this.#a.clear();
          });
        }
        getAll() {
          return Array.from(this.#n);
        }
        find(t) {
          const e = { exact: !0, ...t };
          return this.getAll().find((t) => (0, i.matchMutation)(e, t));
        }
        findAll(t = {}) {
          return this.getAll().filter((e) => (0, i.matchMutation)(t, e));
        }
        notify(t) {
          r.notifyManager.batch(() => {
            this.listeners.forEach((e) => {
              e(t);
            });
          });
        }
        resumePausedMutations() {
          const t = this.getAll().filter((t) => t.state.isPaused);
          return r.notifyManager.batch(() => Promise.all(t.map((t) => t.continue().catch(i.noop))));
        }
      };
    function l(t) {
      return t.options.scope?.id;
    }
    var d = a,
      f = t.i(39330),
      y = class extends d.Subscribable {
        #u;
        constructor(t = {}) {
          super(), (this.config = t), (this.#u = new Map());
        }
        build(t, e, s) {
          let r = e.queryKey,
            n = e.queryHash ?? (0, i.hashQueryKeyByOptions)(r, e),
            a = this.get(n);
          return (
            a ||
              ((a = new f.Query({
                client: t,
                queryKey: r,
                queryHash: n,
                options: t.defaultQueryOptions(e),
                state: s,
                defaultOptions: t.getQueryDefaults(r),
              })),
              this.add(a)),
            a
          );
        }
        add(t) {
          this.#u.has(t.queryHash) || (this.#u.set(t.queryHash, t), this.notify({ type: 'added', query: t }));
        }
        remove(t) {
          this.#u.get(t.queryHash) === t &&
            (t.destroy(), this.#u.delete(t.queryHash), this.notify({ type: 'removed', query: t }));
        }
        clear() {
          r.notifyManager.batch(() => {
            this.getAll().forEach((t) => {
              this.remove(t);
            });
          });
        }
        get(t) {
          return this.#u.get(t);
        }
        getAll() {
          return [...this.#u.values()];
        }
        find(t) {
          const e = { exact: !0, ...t };
          return this.getAll().find((t) => (0, i.matchQuery)(e, t));
        }
        findAll(t = {}) {
          const e = this.getAll();
          return Object.keys(t).length > 0 ? e.filter((e) => (0, i.matchQuery)(t, e)) : e;
        }
        notify(t) {
          r.notifyManager.batch(() => {
            this.listeners.forEach((e) => {
              e(t);
            });
          });
        }
        onFocus() {
          r.notifyManager.batch(() => {
            this.getAll().forEach((t) => {
              t.onFocus();
            });
          });
        }
        onOnline() {
          r.notifyManager.batch(() => {
            this.getAll().forEach((t) => {
              t.onOnline();
            });
          });
        }
      },
      p = class {
        #h;
        #i;
        #c;
        #l;
        #d;
        #f;
        #y;
        #p;
        constructor(t = {}) {
          (this.#h = t.queryCache || new y()),
            (this.#i = t.mutationCache || new c()),
            (this.#c = t.defaultOptions || {}),
            (this.#l = new Map()),
            (this.#d = new Map()),
            (this.#f = 0);
        }
        mount() {
          this.#f++,
            1 === this.#f &&
              ((this.#y = s.focusManager.subscribe(async (t) => {
                t && (await this.resumePausedMutations(), this.#h.onFocus());
              })),
              (this.#p = n.onlineManager.subscribe(async (t) => {
                t && (await this.resumePausedMutations(), this.#h.onOnline());
              })));
        }
        unmount() {
          this.#f--, 0 === this.#f && (this.#y?.(), (this.#y = void 0), this.#p?.(), (this.#p = void 0));
        }
        isFetching(t) {
          return this.#h.findAll({ ...t, fetchStatus: 'fetching' }).length;
        }
        isMutating(t) {
          return this.#i.findAll({ ...t, status: 'pending' }).length;
        }
        getQueryData(t) {
          const e = this.defaultQueryOptions({ queryKey: t });
          return this.#h.get(e.queryHash)?.state.data;
        }
        ensureQueryData(t) {
          const e = this.defaultQueryOptions(t),
            s = this.#h.build(this, e),
            r = s.state.data;
          return void 0 === r
            ? this.fetchQuery(t)
            : (t.revalidateIfStale &&
                s.isStaleByTime((0, i.resolveQueryValue)(e.staleTime, s)) &&
                this.prefetchQuery(e),
              Promise.resolve(r));
        }
        getQueriesData(t) {
          return this.#h.findAll(t).map(({ queryKey: t, state: e }) => [t, e.data]);
        }
        setQueryData(t, e, s) {
          const r = this.defaultQueryOptions({ queryKey: t }),
            n = this.#h.get(r.queryHash)?.state.data,
            a = (0, i.functionalUpdate)(e, n);
          if (void 0 !== a) return this.#h.build(this, r).setData(a, { ...s, manual: !0 });
        }
        setQueriesData(t, e, i) {
          return r.notifyManager.batch(() =>
            this.#h.findAll(t).map(({ queryKey: t }) => [t, this.setQueryData(t, e, i)]),
          );
        }
        getQueryState(t) {
          const e = this.defaultQueryOptions({ queryKey: t });
          return this.#h.get(e.queryHash)?.state;
        }
        removeQueries(t) {
          const e = this.#h;
          r.notifyManager.batch(() => {
            e.findAll(t).forEach((t) => {
              e.remove(t);
            });
          });
        }
        resetQueries(t, e) {
          const i = this.#h;
          return r.notifyManager.batch(() => {
            const s = i.findAll(t),
              r = new Set(s);
            return (
              s.forEach((t) => {
                t.reset();
              }),
              this.refetchQueries({ type: 'active', predicate: (t) => r.has(t) }, e)
            );
          });
        }
        cancelQueries(t, e = {}) {
          const s = { revert: !0, ...e };
          return Promise.all(r.notifyManager.batch(() => this.#h.findAll(t).map((t) => t.cancel(s))))
            .then(i.noop)
            .catch(i.noop);
        }
        invalidateQueries(t, e = {}) {
          return r.notifyManager.batch(() =>
            (this.#h.findAll(t).forEach((t) => {
              t.invalidate();
            }),
            t?.refetchType === 'none')
              ? Promise.resolve()
              : this.refetchQueries({ ...t, type: t?.refetchType ?? t?.type ?? 'active' }, e),
          );
        }
        refetchQueries(t, e = {}) {
          const s = { ...e, cancelRefetch: e.cancelRefetch ?? !0 };
          return Promise.all(
            r.notifyManager.batch(() =>
              this.#h
                .findAll(t)
                .filter((t) => !t.isDisabled() && !t.isStatic())
                .map((t) => {
                  let e = t.fetch(void 0, s);
                  return (
                    s.throwOnError || (e = e.catch(i.noop)),
                    'paused' === t.state.fetchStatus ? Promise.resolve() : e
                  );
                }),
            ),
          ).then(i.noop);
        }
        async query(t) {
          const e = this.defaultQueryOptions(t);
          void 0 === e.retry && (e.retry = !1);
          const s = this.#h.build(this, e),
            r = s.isStaleByTime((0, i.resolveQueryValue)(e.staleTime, s)) ? await s.fetch(e) : s.state.data,
            n = e.select;
          return n ? n(r) : r;
        }
        fetchQuery(t) {
          const e = this.defaultQueryOptions(t);
          void 0 === e.retry && (e.retry = !1);
          const s = this.#h.build(this, e);
          return s.isStaleByTime((0, i.resolveQueryValue)(e.staleTime, s))
            ? s.fetch(e)
            : Promise.resolve(s.state.data);
        }
        prefetchQuery(t) {
          return this.fetchQuery(t).then(i.noop).catch(i.noop);
        }
        infiniteQuery(t) {
          return (t._type = 'infinite'), this.query(t);
        }
        fetchInfiniteQuery(t) {
          return (t._type = 'infinite'), this.fetchQuery(t);
        }
        prefetchInfiniteQuery(t) {
          return this.fetchInfiniteQuery(t).then(i.noop).catch(i.noop);
        }
        ensureInfiniteQueryData(t) {
          return (t._type = 'infinite'), this.ensureQueryData(t);
        }
        resumePausedMutations() {
          return n.onlineManager.isOnline() ? this.#i.resumePausedMutations() : Promise.resolve();
        }
        getQueryCache() {
          return this.#h;
        }
        getMutationCache() {
          return this.#i;
        }
        getDefaultOptions() {
          return this.#c;
        }
        setDefaultOptions(t) {
          this.#c = t;
        }
        setQueryDefaults(t, e) {
          this.#l.set((0, i.hashKey)(t), { queryKey: t, defaultOptions: e });
        }
        getQueryDefaults(t) {
          const e = [...this.#l.values()],
            s = {};
          return (
            e.forEach((e) => {
              (0, i.partialMatchKey)(t, e.queryKey) && Object.assign(s, e.defaultOptions);
            }),
            s
          );
        }
        setMutationDefaults(t, e) {
          this.#d.set((0, i.hashKey)(t), { mutationKey: t, defaultOptions: e });
        }
        getMutationDefaults(t) {
          const e = [...this.#d.values()],
            s = {};
          return (
            e.forEach((e) => {
              (0, i.partialMatchKey)(t, e.mutationKey) && Object.assign(s, e.defaultOptions);
            }),
            s
          );
        }
        defaultQueryOptions(t) {
          if (t._defaulted) return t;
          const e = { ...this.#c.queries, ...this.getQueryDefaults(t.queryKey), ...t, _defaulted: !0 };
          return (
            e.queryHash || (e.queryHash = (0, i.hashQueryKeyByOptions)(e.queryKey, e)),
            void 0 === e.refetchOnReconnect && (e.refetchOnReconnect = 'always' !== e.networkMode),
            void 0 === e.throwOnError && (e.throwOnError = !!e.suspense),
            !e.networkMode && e.persister && (e.networkMode = 'offlineFirst'),
            e.queryFn === i.skipToken && (e.enabled = !1),
            e
          );
        }
        defaultMutationOptions(t) {
          return t?._defaulted
            ? t
            : {
                ...this.#c.mutations,
                ...(t?.mutationKey && this.getMutationDefaults(t.mutationKey)),
                ...t,
                _defaulted: !0,
              };
        }
        clear() {
          this.#h.clear(), this.#i.clear();
        }
      },
      m = t.i(59514),
      v = t.i(39242);
    t.s(
      [
        'Providers',
        0,
        ({ children: t }) => {
          const [i] = (0, v.useState)(
            () =>
              new p({
                defaultOptions: {
                  queries: { staleTime: 5e3, refetchInterval: 6e4, refetchOnWindowFocus: !0, retry: 2 },
                },
              }),
          );
          return (0, e.jsx)(m.QueryClientProvider, { client: i, children: t });
        },
      ],
      45744,
    );
  },
  57545,
  (t) => {
    var e = t.i(43699);
    t.s(['isServer', 0, () => e.isServer]);
  },
  79312,
  74002,
  (t) => {
    var e = class {
      constructor() {
        (this.listeners = new Set()), (this.subscribe = this.subscribe.bind(this));
      }
      subscribe(t) {
        return (
          this.listeners.add(t),
          this.onSubscribe(),
          () => {
            this.listeners.delete(t), this.onUnsubscribe();
          }
        );
      }
      hasListeners() {
        return this.listeners.size > 0;
      }
      onSubscribe() {}
      onUnsubscribe() {}
    };
    t.s(['Subscribable', 0, e], 74002);
    const i = new (class extends e {
      #m;
      #v;
      #g;
      constructor() {
        super(),
          (this.#g = (t) => {
            if ('u' > typeof window && window.addEventListener) {
              const e = () => t();
              return (
                window.addEventListener('visibilitychange', e, !1),
                () => {
                  window.removeEventListener('visibilitychange', e);
                }
              );
            }
          });
      }
      onSubscribe() {
        this.#v || this.setEventListener(this.#g);
      }
      onUnsubscribe() {
        this.hasListeners() || (this.#v?.(), (this.#v = void 0));
      }
      setEventListener(t) {
        (this.#g = t),
          this.#v?.(),
          (this.#v = t((t) => {
            'boolean' == typeof t ? this.setFocused(t) : this.onFocus();
          }));
      }
      setFocused(t) {
        this.#m !== t && ((this.#m = t), this.onFocus());
      }
      onFocus() {
        const t = this.isFocused();
        this.listeners.forEach((e) => {
          e(t);
        });
      }
      isFocused() {
        return 'boolean' == typeof this.#m ? this.#m : globalThis.document?.visibilityState !== 'hidden';
      }
    })();
    t.s(['focusManager', 0, i], 79312);
  },
  56259,
  (t) => {
    let e,
      i,
      s,
      r,
      n,
      a,
      o = t.i(60027).systemSetTimeoutZero,
      u =
        ((e = []),
        (i = 0),
        (s = (t) => {
          t();
        }),
        (r = (t) => {
          t();
        }),
        (n = o),
        {
          batch: (t) => {
            let a;
            i++;
            try {
              a = t();
            } finally {
              let t;
              --i ||
                ((t = e),
                (e = []),
                t.length &&
                  n(() => {
                    r(() => {
                      t.forEach((t) => {
                        s(t);
                      });
                    });
                  }));
            }
            return a;
          },
          batchCalls:
            (t) =>
            (...e) => {
              a(() => {
                t(...e);
              });
            },
          schedule: (a = (t) => {
            i
              ? e.push(t)
              : n(() => {
                  s(t);
                });
          }),
          setNotifyFunction: (t) => {
            s = t;
          },
          setBatchNotifyFunction: (t) => {
            r = t;
          },
          setScheduler: (t) => {
            n = t;
          },
        });
    t.s(['notifyManager', 0, u]);
  },
  79707,
  (t) => {
    var e = t.i(74002);
    const i = new (class extends e.Subscribable {
      #b = !0;
      #v;
      #g;
      constructor() {
        super(),
          (this.#g = (t) => {
            if ('u' > typeof window && window.addEventListener) {
              const e = () => t(!0),
                i = () => t(!1);
              return (
                window.addEventListener('online', e, !1),
                window.addEventListener('offline', i, !1),
                () => {
                  window.removeEventListener('online', e), window.removeEventListener('offline', i);
                }
              );
            }
          });
      }
      onSubscribe() {
        this.#v || this.setEventListener(this.#g);
      }
      onUnsubscribe() {
        this.hasListeners() || (this.#v?.(), (this.#v = void 0));
      }
      setEventListener(t) {
        (this.#g = t), this.#v?.(), (this.#v = t(this.setOnline.bind(this)));
      }
      setOnline(t) {
        this.#b !== t &&
          ((this.#b = t),
          this.listeners.forEach((e) => {
            e(t);
          }));
      }
      isOnline() {
        return this.#b;
      }
    })();
    t.s(['onlineManager', 0, i]);
  },
  39330,
  26129,
  40613,
  (t) => {
    var e = t.i(43699),
      i = t.i(56259),
      s = t.i(57545),
      r = t.i(79312),
      n = t.i(79707);
    function a(t) {
      return Math.min(1e3 * 2 ** t, 3e4);
    }
    function o(t) {
      return (t ?? 'online') !== 'online' || n.onlineManager.isOnline();
    }
    var u = class extends Error {
      constructor(t) {
        super('CancelledError'), (this.revert = t?.revert), (this.silent = t?.silent);
      }
    };
    function h(t) {
      let i,
        h,
        c,
        l = !1,
        d = 0,
        f = 'pending',
        y = new Promise((t, e) => {
          (h = t), (c = e);
        });
      y.catch(e.noop);
      const p = () =>
          r.focusManager.isFocused() &&
          ('always' === t.networkMode || n.onlineManager.isOnline()) &&
          t.canRun(),
        m = () => o(t.networkMode) && t.canRun(),
        v = (t) => {
          'pending' === f && (i?.(), (f = 'resolved'), h(t));
        },
        g = (t) => {
          'pending' === f && (i?.(), (f = 'rejected'), c(t));
        },
        b = () =>
          new Promise((e) => {
            (i = (t) => {
              ('pending' !== f || p()) && e(t);
            }),
              t.onPause?.();
          }).then(() => {
            (i = void 0), 'pending' === f && t.onContinue?.();
          }),
        C = () => {
          let i;
          if ('pending' !== f) return;
          const r = 0 === d ? t.initialPromise : void 0;
          try {
            i = r ?? t.fn();
          } catch (t) {
            i = Promise.reject(t);
          }
          Promise.resolve(i)
            .then(v)
            .catch((i) => {
              if ('pending' !== f) return;
              const r = t.retry ?? 3 * !(0, s.isServer)(),
                n = t.retryDelay ?? a,
                o = 'function' == typeof n ? n(d, i) : n,
                u = !0 === r || ('number' == typeof r && d < r) || ('function' == typeof r && r(d, i));
              l || !u
                ? g(i)
                : (d++,
                  t.onFail?.(d, i),
                  (0, e.sleep)(o)
                    .then(() => (p() ? void 0 : b()))
                    .then(() => {
                      l ? g(i) : C();
                    }));
            });
        };
      return {
        promise: y,
        status: () => f,
        cancel: (e) => {
          if ('pending' === f) {
            const i = new u(e);
            g(i), t.onCancel?.(i);
          }
        },
        continue: () => (i?.(), y),
        cancelRetry: () => {
          l = !0;
        },
        continueRetry: () => {
          l = !1;
        },
        canStart: m,
        start: () => (m() ? C() : b().then(C), y),
      };
    }
    t.s(['CancelledError', 0, u, 'canFetch', 0, o, 'createRetryer', 0, h], 26129);
    var c = t.i(60027),
      l = class {
        #C;
        destroy() {
          this.clearGcTimeout();
        }
        scheduleGc() {
          this.clearGcTimeout(),
            (0, e.isValidTimeout)(this.gcTime) &&
              (this.#C = c.timeoutManager.setTimeout(() => {
                this.optionalRemove();
              }, this.gcTime));
        }
        updateGcTime(t) {
          this.gcTime = Math.max(this.gcTime || 0, t ?? ((0, s.isServer)() ? 1 / 0 : 3e5));
        }
        clearGcTimeout() {
          void 0 !== this.#C && (c.timeoutManager.clearTimeout(this.#C), (this.#C = void 0));
        }
      };
    function d(t, { pages: e, pageParams: i }) {
      const s = e.length - 1;
      return e.length > 0 ? t.getNextPageParam(e[s], e, i[s], i) : void 0;
    }
    function f(t, { pages: e, pageParams: i }) {
      return e.length > 0 ? t.getPreviousPageParam?.(e[0], e, i[0], i) : void 0;
    }
    t.s(['Removable', 0, l], 40613);
    var y = class extends l {
      #w;
      #O;
      #S;
      #q;
      #t;
      #s;
      #c;
      #P;
      constructor(t) {
        super(),
          (this.#P = !1),
          (this.#c = t.defaultOptions),
          this.setOptions(t.options),
          (this.observers = []),
          (this.#t = t.client),
          (this.#q = this.#t.getQueryCache()),
          (this.queryKey = t.queryKey),
          (this.queryHash = t.queryHash),
          (this.#O = v(this.options)),
          (this.state = t.state ?? this.#O),
          this.scheduleGc();
      }
      get meta() {
        return this.options.meta;
      }
      get queryType() {
        return this.#w;
      }
      get promise() {
        return this.#s?.promise;
      }
      setOptions(t) {
        if (
          ((this.options = { ...this.#c, ...t }),
          t?._type && (this.#w = t._type),
          this.updateGcTime(this.options.gcTime),
          this.state && void 0 === this.state.data)
        ) {
          const t = v(this.options);
          void 0 !== t.data && (this.setState(m(t.data, t.dataUpdatedAt)), (this.#O = t));
        }
      }
      optionalRemove() {
        this.observers.length || 'idle' !== this.state.fetchStatus || this.#q.remove(this);
      }
      setData(t, i) {
        const s = (0, e.replaceData)(this.state.data, t, this.options);
        return this.#r({ data: s, type: 'success', dataUpdatedAt: i?.updatedAt, manual: i?.manual }), s;
      }
      setState(t) {
        this.#r({ type: 'setState', state: t });
      }
      cancel(t) {
        const i = this.#s?.promise;
        return this.#s?.cancel(t), i ? i.then(e.noop).catch(e.noop) : Promise.resolve();
      }
      destroy() {
        super.destroy(), this.cancel({ silent: !0 });
      }
      get resetState() {
        return this.#O;
      }
      reset() {
        this.destroy(), this.setState(this.resetState);
      }
      isActive() {
        return this.observers.some((t) => !1 !== (0, e.resolveQueryValue)(t.options.enabled, this));
      }
      isDisabled() {
        return this.getObserversCount() > 0
          ? !this.isActive()
          : this.options.queryFn === e.skipToken || !this.isFetched();
      }
      isFetched() {
        return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
      }
      isStatic() {
        return (
          this.getObserversCount() > 0 &&
          this.observers.some((t) => 'static' === (0, e.resolveQueryValue)(t.options.staleTime, this))
        );
      }
      isStale() {
        return this.getObserversCount() > 0
          ? this.observers.some((t) => t.getCurrentResult().isStale)
          : void 0 === this.state.data || this.state.isInvalidated;
      }
      isStaleByTime(t = 0) {
        return (
          void 0 === this.state.data ||
          ('static' !== t &&
            (!!this.state.isInvalidated || !(0, e.timeUntilStale)(this.state.dataUpdatedAt, t)))
        );
      }
      onFocus() {
        this.observers.find((t) => t.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: !1 }),
          this.#s?.continue();
      }
      onOnline() {
        this.observers.find((t) => t.shouldFetchOnReconnect())?.refetch({ cancelRefetch: !1 }),
          this.#s?.continue();
      }
      addObserver(t) {
        this.observers.includes(t) ||
          (this.observers.push(t),
          this.clearGcTimeout(),
          this.#q.notify({ type: 'observerAdded', query: this, observer: t }));
      }
      removeObserver(t) {
        const e = this.observers.indexOf(t);
        -1 !== e &&
          (this.observers.splice(e, 1),
          this.observers.length ||
            (this.#s &&
              (this.#P || ('paused' === this.state.fetchStatus && 'pending' === this.state.status)
                ? this.#s.cancel({ revert: !0 })
                : this.#s.cancelRetry()),
            this.scheduleGc()),
          this.#q.notify({ type: 'observerRemoved', query: this, observer: t }));
      }
      getObserversCount() {
        return this.observers.length;
      }
      invalidate() {
        this.state.isInvalidated || this.#r({ type: 'invalidate' });
      }
      async fetch(t, i) {
        var s;
        let r;
        if ('idle' !== this.state.fetchStatus && this.#s?.status() !== 'rejected') {
          if (void 0 !== this.state.data && i?.cancelRefetch) this.cancel({ silent: !0 });
          else if (this.#s) return this.#s.continueRetry(), this.#s.promise;
        }
        if ((t && this.setOptions(t), !this.options.queryFn)) {
          const t = this.observers.find((t) => t.options.queryFn);
          t && this.setOptions(t.options);
        }
        const n = new AbortController(),
          a = (t) => {
            Object.defineProperty(t, 'signal', { enumerable: !0, get: () => ((this.#P = !0), n.signal) });
          },
          o = () => {
            let t,
              s = (0, e.ensureQueryFn)(this.options, i),
              r = (a((t = { client: this.#t, queryKey: this.queryKey, meta: this.meta })), t);
            return ((this.#P = !1), this.options.persister) ? this.options.persister(s, r, this) : s(r);
          },
          c =
            (a(
              (r = {
                fetchOptions: i,
                options: this.options,
                queryKey: this.queryKey,
                client: this.#t,
                state: this.state,
                fetchFn: o,
              }),
            ),
            r);
        ('infinite' === this.#w
          ? ((s = this.options.pages),
            {
              onFetch: (t, i) => {
                let r = t.options,
                  n = t.fetchOptions?.meta?.fetchMore?.direction,
                  a = t.state.data?.pages || [],
                  o = t.state.data?.pageParams || [],
                  u = { pages: [], pageParams: [] },
                  h = 0,
                  c = async () => {
                    let i = !1,
                      c = (0, e.ensureQueryFn)(t.options, t.fetchOptions),
                      l = async (s, r, n) => {
                        let a;
                        if (i) return Promise.reject(t.signal.reason);
                        if (null == r && s.pages.length) return Promise.resolve(s);
                        const o =
                            ((a = {
                              client: t.client,
                              queryKey: t.queryKey,
                              pageParam: r,
                              direction: n ? 'backward' : 'forward',
                              meta: t.options.meta,
                            }),
                            (0, e.addConsumeAwareSignal)(
                              a,
                              () => t.signal,
                              () => (i = !0),
                            ),
                            a),
                          u = await c(o),
                          { maxPages: h } = t.options,
                          l = n ? e.addToStart : e.addToEnd;
                        return { pages: l(s.pages, u, h), pageParams: l(s.pageParams, r, h) };
                      };
                    if (n && a.length) {
                      const t = 'backward' === n,
                        e = t ? f : d,
                        i = { pages: a, pageParams: o };
                      u = await l(i, e(r, i), t);
                    } else {
                      const t = s ?? a.length;
                      do {
                        const t = 0 === h ? (o[0] ?? r.initialPageParam) : d(r, u);
                        if (h > 0 && null == t) break;
                        (u = await l(u, t)), h++;
                      } while (h < t);
                    }
                    return u;
                  };
                t.options.persister
                  ? (t.fetchFn = () =>
                      t.options.persister?.(
                        c,
                        { client: t.client, queryKey: t.queryKey, meta: t.options.meta, signal: t.signal },
                        i,
                      ))
                  : (t.fetchFn = c);
              },
            })
          : this.options.behavior
        )?.onFetch(c, this),
          (this.#S = this.state),
          ('idle' === this.state.fetchStatus || this.state.fetchMeta !== c.fetchOptions?.meta) &&
            this.#r({ type: 'fetch', meta: c.fetchOptions?.meta });
        const l = (this.#s = h({
          initialPromise: i?.initialPromise,
          fn: c.fetchFn,
          onCancel: (t) => {
            t instanceof u && t.revert && this.setState({ ...this.#S, fetchStatus: 'idle' }), n.abort();
          },
          onFail: (t, e) => {
            this.#r({ type: 'failed', failureCount: t, error: e });
          },
          onPause: () => {
            this.#r({ type: 'pause' });
          },
          onContinue: () => {
            this.#r({ type: 'continue' });
          },
          retry: c.options.retry,
          retryDelay: c.options.retryDelay,
          networkMode: c.options.networkMode,
          canRun: () => !0,
        }));
        try {
          const t = await l.start();
          if (void 0 === t) throw Error(`${this.queryHash} data is undefined`);
          return (
            this.setData(t),
            this.#q.config.onSuccess?.(t, this),
            this.#q.config.onSettled?.(t, this.state.error, this),
            t
          );
        } catch (t) {
          if (t instanceof u) {
            if (t.silent) return this.#s.promise;
            else if (t.revert) {
              if (void 0 === this.state.data) throw t;
              return this.state.data;
            }
          }
          throw (
            (this.#r({ type: 'error', error: t }),
            this.#q.config.onError?.(t, this),
            this.#q.config.onSettled?.(this.state.data, t, this),
            t)
          );
        } finally {
          this.#s === l && (this.#s = void 0), this.scheduleGc();
        }
      }
      #r(t) {
        const e = (e) => {
          switch (t.type) {
            case 'failed':
              return { ...e, fetchFailureCount: t.failureCount, fetchFailureReason: t.error };
            case 'pause':
              return { ...e, fetchStatus: 'paused' };
            case 'continue':
              return { ...e, fetchStatus: 'fetching' };
            case 'fetch':
              return { ...e, ...p(e.data, this.options), fetchMeta: t.meta ?? null };
            case 'success': {
              const i = {
                ...e,
                ...m(t.data, t.dataUpdatedAt),
                dataUpdateCount: e.dataUpdateCount + 1,
                ...(!t.manual && { fetchStatus: 'idle', fetchFailureCount: 0, fetchFailureReason: null }),
              };
              return (this.#S = t.manual ? i : void 0), i;
            }
            case 'error': {
              const s = t.error;
              return {
                ...e,
                error: s,
                errorUpdateCount: e.errorUpdateCount + 1,
                errorUpdatedAt: Date.now(),
                fetchFailureCount: e.fetchFailureCount + 1,
                fetchFailureReason: s,
                fetchStatus: 'idle',
                status: 'error',
                isInvalidated: !0,
              };
            }
            case 'invalidate':
              return { ...e, isInvalidated: !0 };
            case 'setState':
              return { ...e, ...t.state };
          }
        };
        (this.state = e(this.state)),
          i.notifyManager.batch(() => {
            this.observers.slice().forEach((t) => {
              t.onQueryUpdate();
            }),
              this.#q.notify({ query: this, type: 'updated', action: t });
          });
      }
    };
    function p(t, e) {
      return {
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchStatus: o(e.networkMode) ? 'fetching' : 'paused',
        ...(void 0 === t && { error: null, status: 'pending' }),
      };
    }
    function m(t, e) {
      return { data: t, dataUpdatedAt: e ?? Date.now(), error: null, isInvalidated: !1, status: 'success' };
    }
    function v(t) {
      const e = 'function' == typeof t.initialData ? t.initialData() : t.initialData,
        i = void 0 !== e,
        s = i
          ? 'function' == typeof t.initialDataUpdatedAt
            ? t.initialDataUpdatedAt()
            : t.initialDataUpdatedAt
          : 0;
      return {
        data: e,
        dataUpdateCount: 0,
        dataUpdatedAt: i ? (s ?? Date.now()) : 0,
        error: null,
        errorUpdateCount: 0,
        errorUpdatedAt: 0,
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchMeta: null,
        isInvalidated: !1,
        status: i ? 'success' : 'pending',
        fetchStatus: 'idle',
      };
    }
    t.s(['Query', 0, y, 'fetchState', 0, p], 39330);
  },
  43699,
  60027,
  (t) => {
    const e = {
        setTimeout: (t, e) => setTimeout(t, e),
        clearTimeout: (t) => clearTimeout(t),
        setInterval: (t, e) => setInterval(t, e),
        clearInterval: (t) => clearInterval(t),
      },
      i = new (class {
        #M = e;
        #T = !1;
        setTimeoutProvider(t) {
          this.#M = t;
        }
        setTimeout(t, e) {
          return this.#M.setTimeout(t, e);
        }
        clearTimeout(t) {
          this.#M.clearTimeout(t);
        }
        setInterval(t, e) {
          return this.#M.setInterval(t, e);
        }
        clearInterval(t) {
          this.#M.clearInterval(t);
        }
      })();
    t.s(
      [
        'systemSetTimeoutZero',
        0,
        (t) => {
          setTimeout(t, 0);
        },
        'timeoutManager',
        0,
        i,
      ],
      60027,
    );
    const s = 'u' < typeof window || 'Deno' in globalThis;
    function r(t, e) {
      return (e?.queryKeyHashFn || n)(t);
    }
    function n(t) {
      return JSON.stringify(t, (t, e) =>
        h(e)
          ? Object.keys(e)
              .sort()
              .reduce((t, i) => ((t[i] = e[i]), t), {})
          : e,
      );
    }
    function a(t, e) {
      if (t === e) return !0;
      if (typeof t != typeof e) return !1;
      if (t && e && 'object' == typeof t && 'object' == typeof e) {
        if (Array.isArray(t) && Array.isArray(e)) {
          if (e.length > t.length) return !1;
          for (let i = 0; i < e.length; i++) if (!a(t[i], e[i])) return !1;
          return !0;
        }
        for (const i of Object.keys(e)) if (!a(t[i], e[i])) return !1;
        return !0;
      }
      return !1;
    }
    const o = Object.prototype.hasOwnProperty;
    function u(t) {
      return Array.isArray(t) && t.length === Object.keys(t).length;
    }
    function h(t) {
      if (!c(t)) return !1;
      const e = Object.getPrototypeOf(t),
        i = e?.constructor;
      if (void 0 === i) return !0;
      if ('function' != typeof i) return !1;
      const s = i.prototype;
      return !!c(s) && !!Object.hasOwn(s, 'isPrototypeOf') && e === Object.prototype;
    }
    function c(t) {
      return '[object Object]' === Object.prototype.toString.call(t);
    }
    const l = Symbol();
    t.s(
      [
        'addConsumeAwareSignal',
        0,
        (t, e, i) => {
          let s,
            r = !1;
          return (
            Object.defineProperty(t, 'signal', {
              enumerable: !0,
              get: () => (
                (s ??= e()),
                r || ((r = !0), s.aborted ? i() : s.addEventListener('abort', i, { once: !0 })),
                s
              ),
            }),
            t
          );
        },
        'addToEnd',
        0,
        (t, e, i = 0) => {
          const s = [...t, e];
          return i && s.length > i ? s.slice(1) : s;
        },
        'addToStart',
        0,
        (t, e, i = 0) => {
          const s = [e, ...t];
          return i && s.length > i ? s.slice(0, -1) : s;
        },
        'ensureQueryFn',
        0,
        (t, e) =>
          !t.queryFn && e?.initialPromise
            ? () => e.initialPromise
            : t.queryFn && t.queryFn !== l
              ? t.queryFn
              : () => Promise.reject(Error(`Missing queryFn: '${t.queryHash}'`)),
        'functionalUpdate',
        0,
        (t, e) => ('function' == typeof t ? t(e) : t),
        'hashKey',
        0,
        n,
        'hashQueryKeyByOptions',
        0,
        r,
        'isServer',
        0,
        s,
        'isValidTimeout',
        0,
        (t) => 'number' == typeof t && t >= 0 && t !== 1 / 0,
        'keepPreviousData',
        0,
        (t) => t,
        'matchMutation',
        0,
        (t, e) => {
          const { exact: i, status: s, predicate: r, mutationKey: o } = t;
          if (o) {
            if (!e.options.mutationKey) return !1;
            if (i) {
              if (n(e.options.mutationKey) !== n(o)) return !1;
            } else if (!a(e.options.mutationKey, o)) return !1;
          }
          return (!s || e.state.status === s) && (!r || !!r(e));
        },
        'matchQuery',
        0,
        (t, e) => {
          const { type: i = 'all', exact: s, fetchStatus: n, predicate: o, queryKey: u, stale: h } = t;
          if (u) {
            if (s) {
              if (e.queryHash !== r(u, e.options)) return !1;
            } else if (!a(e.queryKey, u)) return !1;
          }
          if ('all' !== i) {
            const t = e.isActive();
            if (('active' === i && !t) || ('inactive' === i && t)) return !1;
          }
          return (
            ('boolean' != typeof h || e.isStale() === h) &&
            (!n || n === e.state.fetchStatus) &&
            (!o || !!o(e))
          );
        },
        'noop',
        0,
        () => {},
        'partialMatchKey',
        0,
        a,
        'replaceData',
        0,
        (t, e, i) =>
          'function' == typeof i.structuralSharing
            ? i.structuralSharing(t, e)
            : !1 !== i.structuralSharing
              ? (function t(e, i, s = 0) {
                  if (e === i) return e;
                  if (s > 500) return i;
                  const r = u(e) && u(i);
                  if (!r && !(h(e) && h(i))) return i;
                  let n = (r ? e : Object.keys(e)).length,
                    a = r ? i : Object.keys(i),
                    c = a.length,
                    l = r ? Array(c) : {},
                    d = 0;
                  for (let u = 0; u < c; u++) {
                    const h = r ? u : a[u],
                      c = e[h],
                      f = i[h];
                    if (c === f) {
                      (l[h] = c), (r ? u < n : o.call(e, h)) && d++;
                      continue;
                    }
                    if (null === c || null === f || 'object' != typeof c || 'object' != typeof f) {
                      l[h] = f;
                      continue;
                    }
                    const y = t(c, f, s + 1);
                    (l[h] = y), y === c && d++;
                  }
                  return n === c && d === n ? e : l;
                })(t, e)
              : e,
        'resolveQueryValue',
        0,
        (t, e) => ('function' == typeof t ? t(e) : t),
        'shallowEqualObjects',
        0,
        (t, e) => {
          if (!e || Object.keys(t).length !== Object.keys(e).length) return !1;
          for (const i in t) if (t[i] !== e[i]) return !1;
          return !0;
        },
        'shouldThrowError',
        0,
        (t, e) => ('function' == typeof t ? t(...e) : !!t),
        'skipToken',
        0,
        l,
        'sleep',
        0,
        (t) =>
          new Promise((e) => {
            i.setTimeout(e, t);
          }),
        'timeUntilStale',
        0,
        (t, e) => Math.max(t + (e || 0) - Date.now(), 0),
      ],
      43699,
    );
  },
  59514,
  (t) => {
    var e = t.i(39242),
      i = t.i(19496);
    const s = e.createContext(void 0);
    t.s([
      'QueryClientProvider',
      0,
      ({ client: t, children: r }) => (
        e.useEffect(
          () => (
            t.mount(),
            () => {
              t.unmount();
            }
          ),
          [t],
        ),
        (0, i.jsx)(s.Provider, { value: t, children: r })
      ),
      'useQueryClient',
      0,
      (t) => {
        const i = e.useContext(s);
        if (t) return t;
        if (!i) throw Error('No QueryClient set, use QueryClientProvider to set one');
        return i;
      },
    ]);
  },
]);
