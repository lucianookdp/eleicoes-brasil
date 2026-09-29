(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  {
    otherChunks: [
      'static/chunks/0sbttzm5vtbst.js',
      'static/chunks/0luvx3lorvy9e.js',
      'static/chunks/3oyuh0q5owgiv.js',
      'static/chunks/2hgb1_fjpvvc4.js',
    ],
    runtimeModuleIds: [3769],
  },
]),
  (() => {
    let e;
    if (!Array.isArray(globalThis.TURBOPACK)) return;
    var t,
      r = (() => {
        if (null != self.TURBOPACK_ASSET_SUFFIX) return self.TURBOPACK_ASSET_SUFFIX;
        const e = document?.currentScript?.getAttribute?.('src') ?? '',
          t = e.indexOf('?');
        return t >= 0 ? e.slice(t) : '';
      })(),
      n =
        (((t = n || {})[(t.Runtime = 0)] = 'Runtime'),
        (t[(t.Parent = 1)] = 'Parent'),
        (t[(t.Update = 2)] = 'Update'),
        t);
    const o = new WeakMap();
    function l(e, t) {
      (this.m = e), (this.e = t);
    }
    const i = l.prototype,
      u = Object.prototype.hasOwnProperty,
      s = 'u' > typeof Symbol && Symbol.toStringTag;
    function c(e, t, r) {
      u.call(e, t) || Object.defineProperty(e, t, r);
    }
    function a(e, t) {
      let r = e[t];
      return r || ((r = f(t)), (e[t] = r)), r;
    }
    function f(e) {
      return { exports: {}, error: void 0, id: e, namespaceObject: void 0 };
    }
    function p(e, t, r) {
      c(e, '__esModule', { value: !0 }), s && c(e, s, { value: 'Module' });
      let n = 0;
      for (; n < t.length; ) {
        const r = t[n++],
          o = t[n++];
        if ('number' == typeof o)
          if (0 === o) c(e, r, { value: t[n++], enumerable: !0, writable: !1 });
          else throw Error(`unexpected tag: ${o}`);
        else
          'function' == typeof t[n]
            ? c(e, r, { get: o, set: t[n++], enumerable: !0 })
            : c(e, r, { get: o, enumerable: !0 });
      }
      r || Object.seal(e);
    }
    function h(e, t) {
      (null != t ? a(this.c, t) : this.m).exports = e;
    }
    (i.s = function (e, t, r) {
      let n, o;
      null != t ? (o = (n = a(this.c, t)).exports) : ((n = this.m), (o = this.e)),
        (n.namespaceObject = o),
        p(o, e, r);
    }),
      (i.j = function (e, t) {
        let r, n;
        null != t ? (n = (r = a(this.c, t)).exports) : ((r = this.m), (n = this.e));
        const l = ((e, t) => {
          let r = o.get(e);
          if (!r) {
            o.set(e, (r = []));
            const n = (e) => {
              if ('default' !== e) {
                for (const t of r) if (u.call(t, e)) return t;
              }
            };
            e.exports = e.namespaceObject = new Proxy(t, {
              get(e, t) {
                if (u.call(e, t) || 'default' === t || '__esModule' === t) return Reflect.get(e, t);
                const r = n(t);
                return r && Reflect.get(r, t);
              },
              set: () => !1,
              defineProperty: () => !1,
              deleteProperty: () => !1,
              has: (e, t) =>
                !!Reflect.has(e, t) || ('default' !== t && '__esModule' !== t && void 0 !== n(t)),
              ownKeys(e) {
                const t = Reflect.ownKeys(e);
                for (const e of r)
                  for (const r of Reflect.ownKeys(e)) 'default' === r || t.includes(r) || t.push(r);
                return t;
              },
              getOwnPropertyDescriptor(e, t) {
                const r = Reflect.getOwnPropertyDescriptor(e, t);
                if (r || 'default' === t || '__esModule' === t) return r;
                const o = n(t);
                if (o) return { enumerable: !0, configurable: !0, get: () => Reflect.get(o, t) };
              },
            });
          }
          return r;
        })(r, n);
        'object' == typeof e && null !== e && l.push(e);
      }),
      (i.v = h),
      (i.n = function (e, t) {
        let r;
        (r = null != t ? a(this.c, t) : this.m).exports = r.namespaceObject = e;
      });
    const d = Object.getPrototypeOf ? (e) => Object.getPrototypeOf(e) : (e) => e.__proto__,
      m = [null, d({}), d([]), d(d)];
    function y(e, t, r) {
      let n = [],
        o = -1;
      for (let t = e; ('object' == typeof t || 'function' == typeof t) && !m.includes(t); t = d(t))
        for (const r of Object.getOwnPropertyNames(t))
          n.push(
            r,
            (
              (e, t) => () =>
                e[t]
            )(e, r),
          ),
            -1 === o && 'default' === r && (o = n.length - 1);
      return (r && o >= 0) || (o >= 0 ? n.splice(o, 1, 0, e) : n.push('default', 0, e)), p(t, n), t;
    }
    function g(e) {
      const t = K(e, this.m);
      if (t.namespaceObject) return t.namespaceObject;
      const r = t.exports;
      return (t.namespaceObject = y(
        r,
        'function' == typeof r
          ? function (...e) {
              return r.apply(this, e);
            }
          : Object.create(null),
        r && r.__esModule,
      ));
    }
    function b(e) {
      const t = e.indexOf('#');
      -1 !== t && (e = e.substring(0, t));
      const r = e.indexOf('?');
      return -1 !== r && (e = e.substring(0, r)), e;
    }
    (i.i = g),
      (i.A = function (e) {
        return this.r(e)(g.bind(this));
      }),
      (i.t =
        'function' == typeof require
          ? require
          : () => {
              throw Error('Unexpected use of runtime require');
            }),
      (i.r = function (e) {
        return K(e, this.m).exports;
      }),
      (i.f = (e) => {
        function t(t) {
          if (((t = b(t)), u.call(e, t))) return e[t].module();
          const r = Error(`Cannot find module '${t}'`);
          throw ((r.code = 'MODULE_NOT_FOUND'), r);
        }
        return (
          (t.keys = () => Object.keys(e)),
          (t.resolve = (t) => {
            if (((t = b(t)), u.call(e, t))) return e[t].id();
            const r = Error(`Cannot find module '${t}'`);
            throw ((r.code = 'MODULE_NOT_FOUND'), r);
          }),
          (t.import = async (e) => await t(e)),
          t
        );
      });
    const O = function (e) {
      const t = new URL(e, 'x:/'),
        r = {};
      for (const e in t) r[e] = t[e];
      for (const t in ((r.href = e),
      (r.pathname = e.replace(/[?#].*/, '')),
      (r.origin = r.protocol = ''),
      (r.toString = r.toJSON = (...t) => e),
      r))
        Object.defineProperty(this, t, { enumerable: !0, configurable: !0, value: r[t] });
    };
    function w(e, t) {
      throw Error(`Invariant: ${t(e)}`);
    }
    (O.prototype = URL.prototype),
      (i.U = O),
      (i.z = (e) => {
        throw Error('dynamic usage of require is not supported');
      }),
      (i.g = globalThis);
    const v = l.prototype,
      R =
        'string' == typeof TURBOPACK_CHUNK_BASE_PATH ? TURBOPACK_CHUNK_BASE_PATH : '/eleicoes-brasil/_next/',
      k = new Map();
    i.M = k;
    const U = new Map(),
      _ = new Map(),
      P = new Map();
    async function C(e, t, r) {
      let n;
      if ('string' == typeof r) return ((e, t, r) => A(e, t, r))(e, t, E(r));
      const o = r.included || [],
        l = o.map((e) => !!k.has(e) || U.get(e));
      if (l.length > 0 && l.every((e) => e)) return void (await Promise.all(l));
      for (const l of ((n = A(e, t, E(r.path))), o)) U.has(l) || U.set(l, n);
      await n;
    }
    v.l = function (e) {
      return C(n.Parent, this.m.id, e);
    };
    const j = Promise.resolve(void 0),
      $ = new WeakMap();
    function A(t, r, o) {
      let l = e.loadChunkCached(t, o),
        i = $.get(l);
      if (void 0 === i) {
        const e = $.set.bind($, l, j);
        (i = l.then(e).catch((e) => {
          let l;
          switch (t) {
            case n.Runtime:
              l = `as a runtime dependency of chunk ${r}`;
              break;
            case n.Parent:
              l = `from module ${r}`;
              break;
            case n.Update:
              l = 'from an HMR update';
              break;
            default:
              w(t, (e) => `Unknown source type: ${e}`);
          }
          const i = Error(`Failed to load chunk ${o} ${l}${e ? `: ${e}` : ''}`, e ? { cause: e } : void 0);
          throw ((i.name = 'ChunkLoadError'), i);
        })),
          $.set(l, i);
      }
      return i;
    }
    v.L = function (e) {
      var t, r;
      return (t = n.Parent), (r = this.m.id), A(t, r, e);
    };
    (v.R = function (e) {
      const t = this.r(e);
      return t?.default ?? t;
    }),
      (v.P = (e) => `/ROOT/${e ?? ''}`),
      (v.F = (e) => (e ? `file:///ROOT/${e.split('/').map(encodeURIComponent).join('/')}` : 'file:///ROOT/')),
      (v.q = function (e, t) {
        h.call(this, `${e}${r}`, t);
      });
    const T = /[^A-Za-z0-9\-_.!~*'()/]/;
    function E(e, t = R) {
      const n = T.test(e) ? e.split('/').map(encodeURIComponent).join('/') : e;
      return `${t}${n}${r}`;
    }
    function S(e, t) {
      let r,
        n = e.indexOf('?');
      if (-1 !== n) r = n;
      else {
        const t = e.indexOf('#');
        r = -1 !== t ? t : e.length;
      }
      return r >= t.length && e.startsWith(t, r - t.length);
    }
    (v.b = R), (v.X = r), (v.h = E);
    function M(e) {
      return S(e, '.css');
    }
    const x = {};
    i.c = x;
    const K = (e, t) => {
      const r = x[e];
      if (r) {
        if (r.error) throw r.error;
        return r;
      }
      return N(e, n.Parent, t.id);
    };
    function N(e, t, r) {
      const n = k.get(e);
      if ('function' != typeof n)
        throw Error(
          ((e, t, r) => {
            let n;
            switch (t) {
              case 0:
                n = `as a runtime entry of chunk ${r}`;
                break;
              case 1:
                n = `because it was required from module ${r}`;
                break;
              case 2:
                n = 'because of an HMR update';
                break;
              default:
                w(t, (e) => `Unknown source type: ${e}`);
            }
            return `Module ${e} was instantiated ${n}, but the module factory is not available.`;
          })(e, t, r),
        );
      const o = f(e),
        i = o.exports;
      x[e] = o;
      const u = new l(o, i);
      try {
        n(u, o, i);
      } catch (e) {
        throw ((o.error = e), e);
      }
      return o.namespaceObject && o.exports !== o.namespaceObject && y(o.exports, o.namespaceObject), o;
    }
    function B(t) {
      let r;
      if (!Array.isArray(t)) return e.registerChunk(void 0, t);
      const n = ((e) => {
        if ('string' == typeof e) return e;
        if (e) return { src: e.getAttribute('src') };
        if ('u' > typeof TURBOPACK_NEXT_CHUNK_URLS) return { src: TURBOPACK_NEXT_CHUNK_URLS.pop() };
        throw Error('chunk path empty but not in a worker');
      })(t[0]);
      return (
        2 === t.length
          ? (r = t[1])
          : ((r = void 0),
            !((e, t) => {
              let r = 1;
              for (; r < e.length; ) {
                let n,
                  o = r + 1;
                for (; o < e.length && 'function' != typeof e[o]; ) o++;
                if (o === e.length) throw Error('malformed chunk format, expected a factory function');
                const l = e[o];
                for (let l = r; l < o; l++) {
                  const r = e[l],
                    o = t.get(r);
                  if (o) {
                    n = o;
                    break;
                  }
                }
                let i = n ?? l,
                  u = !1;
                for (let n = r; n < o; n++) {
                  const r = e[n];
                  t.has(r) ||
                    (u ||
                      (i === l && Object.defineProperty(l, 'name', { value: 'module evaluation' }), (u = !0)),
                    t.set(r, i));
                }
                r = o + 1;
              }
            })(t, k)),
        e.registerChunk(n, r)
      );
    }
    const L = new Map();
    function I(e) {
      let t = L.get(e);
      if (!t) {
        let r, n;
        (t = {
          resolved: !1,
          loadingStarted: !1,
          retryAttempts: 0,
          promise: new Promise((e, t) => {
            (r = e), (n = t);
          }),
          resolve: () => {
            (t.resolved = !0), r();
          },
          reject: n,
        }),
          L.set(e, t);
      }
      return t;
    }
    function q(e, t, r, n, o) {
      !(null == n || (n instanceof DOMException && 'NetworkError' === n.name)) ||
      r.retryAttempts >= 1 ||
      L.get(t) !== r
        ? (L.get(t) === r && L.delete(t), r.reject(n))
        : (r.retryAttempts++,
          setTimeout(
            () => {
              r.resolved || L.get(t) !== r || (o ? o() : ((r.loadingStarted = !1), H(e, t)));
            },
            200 + Math.floor(401 * Math.random()),
          ));
    }
    function H(e, t) {
      const r = I(t);
      if (r.loadingStarted) return r.promise;
      if (e === n.Runtime) return (r.loadingStarted = !0), M(t) && r.resolve(), r.promise;
      if ('function' == typeof importScripts)
        if (M(t));
        else if (S(t, '.js')) {
          self.TURBOPACK_NEXT_CHUNK_URLS.push(t);
          try {
            importScripts(t);
          } catch (n) {
            q(e, t, r, n);
          }
        } else throw Error(`can't infer type of chunk from URL ${t} in worker`);
      else {
        const n = decodeURI(t);
        if (M(t))
          if (
            document.querySelectorAll(
              `link[rel=stylesheet][href="${t}"],link[rel=stylesheet][href^="${t}?"],link[rel=stylesheet][href="${n}"],link[rel=stylesheet][href^="${n}?"]`,
            ).length > 0
          )
            r.resolve();
          else {
            const n = () => {
              const o = document.createElement('link');
              return (
                (o.rel = 'stylesheet'),
                (o.crossOrigin = null),
                (o.href = t),
                (o.onerror = () => {
                  const l = document.createComment('');
                  o.replaceWith(l), q(e, t, r, void 0, () => l.replaceWith(n()));
                }),
                (o.onload = () => {
                  r.resolve();
                }),
                o
              );
            };
            document.head.appendChild(n());
          }
        else if (S(t, '.js')) {
          const o = document.querySelectorAll(
            `script[src="${t}"],script[src^="${t}?"],script[src="${n}"],script[src^="${n}?"]`,
          );
          if (o.length > 0)
            for (const n of Array.from(o))
              n.addEventListener(
                'error',
                () => {
                  n.remove(), q(e, t, r);
                },
                { once: !0 },
              );
          else {
            const n = document.createElement('script');
            (n.crossOrigin = null),
              (n.src = t),
              (n.onerror = () => {
                n.remove(), q(e, t, r);
              }),
              document.head.appendChild(n);
          }
        } else throw Error(`can't infer type of chunk from URL ${t}`);
      }
      return (r.loadingStarted = !0), r.promise;
    }
    e = {
      async registerChunk(e, t) {
        let r;
        if (
          (null != e &&
            ((r = ((e) => {
              if ('string' == typeof e) return e;
              const t = decodeURIComponent(e.src.replace(/[?#].*$/, ''));
              return t.startsWith(R) ? t.slice(R.length) : t;
            })(e)),
            I('string' == typeof e ? E(e) : e.src).resolve()),
          null != t)
        ) {
          for (const e of t.otherChunks) I(E('string' == typeof e ? e : e.path));
          if (
            (await Promise.all(
              t.otherChunks.map((e) => {
                var t;
                return (t = r), C(n.Runtime, t, e);
              }),
            ),
            t.runtimeModuleIds.length > 0)
          )
            for (const e of t.runtimeModuleIds)
              !((e, t) => {
                const r = x[t];
                if (r) {
                  if (r.error) throw r.error;
                  return;
                }
                N(t, n.Runtime, e);
              })(r, e);
        }
      },
      loadChunkCached: (e, t) => H(e, t),
    };
    var F = globalThis.TURBOPACK;
    (globalThis.TURBOPACK = { push: B }), F.forEach(B);
  })();
