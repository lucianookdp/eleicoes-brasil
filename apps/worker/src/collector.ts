import { randomUUID } from 'node:crypto';
import {
  type AreaRef,
  area,
  checkResult,
  type ElectionConfig,
  type ElectionProvider,
  hasErrors,
  ProviderNotFoundError,
  ProviderPayloadError,
  ProviderUnavailableError,
  type RealtimeEvent,
  type StateCode,
} from '@eleicoes/election-core';
import type { RequestRecord } from '@eleicoes/tse-client';
import type { Logger } from 'pino';
import type { CycleStats, ProgressChange, Store, StoredOffice } from './store';

export interface CollectorOptions {
  mode: string;
  collectCityResults: boolean;
  cityResultOffices: 'all' | 'majoritarian';
  maxResultFetchesPerCycle: number;
  /** Every N cycles, re-check all country/state result files (conditional GETs, mostly 304). */
  reconcileEvery: number;
}

interface ResultJob {
  office: StoredOffice;
  area: AreaRef;
  priority: number;
}

type Notification = Omit<RealtimeEvent, 'electionId' | 'timestamp'>;

/**
 * Smart polling (docs/architecture.md §Polling):
 *   EA14 (Brazil) → which states changed → EA15 (those states) → which cities changed →
 *   EA20 only for (office, area) pairs whose area changed.
 * A change is detected by comparing each area's totalization time, counted sections and status
 * with the last value seen for that provider election.
 */
export class Collector {
  private offices: StoredOffice[] = [];
  private capitals = new Set<string>();
  private configLoaded = false;
  private readonly seen = new Map<string, string>();
  private readonly pending = new Map<string, ResultJob>();
  private cycles = 0;
  private stats: CycleStats = emptyStats();

  constructor(
    private readonly provider: ElectionProvider,
    private readonly store: Store,
    private readonly log: Logger,
    private readonly options: CollectorOptions,
  ) {}

  /** Hook this to the HTTP client so every request is counted in the current cycle. */
  readonly onRequest = (r: RequestRecord) => {
    this.stats.requests++;
    this.stats.latencies.push(r.durationMs);
    if (r.outcome === 'ok') this.stats.ok++;
    else if (r.outcome === 'not-modified') this.stats.notModified++;
    else if (r.outcome === 'not-found') this.stats.notFound++;
    else this.stats.errors++;
    this.log.debug(
      { source: shortName(r.url), status: r.status, duration: r.durationMs, outcome: r.outcome },
      'request',
    );
  };

  async runCycle(): Promise<void> {
    const cycleId = randomUUID();
    const log = this.log.child({ cycleId });
    const started = Date.now();
    this.stats = emptyStats();
    this.cycles++;
    await this.store.startCycle(cycleId, this.options.mode, new Date().toISOString());

    const notifications: Notification[] = [];
    let degraded = false;
    let fatal: string | null = null;
    const fail = async (err: unknown, what: string, target?: AreaRef) => {
      degraded = true;
      const now = new Date().toISOString();
      if (err instanceof ProviderPayloadError) {
        log.error({ source: shortName(err.sourceFile), issues: err.issues }, `schema mismatch: ${what}`);
        await this.store.recordIssue(
          'source.schema',
          err.message,
          { sourceFile: err.sourceFile, issues: err.issues },
          now,
          target,
        );
      } else if (err instanceof ProviderUnavailableError) {
        log.warn({ source: shortName(err.sourceFile), status: err.status }, `source unavailable: ${what}`);
        await this.store.recordIssue(
          'source.unavailable',
          err.message,
          { sourceFile: err.sourceFile, status: err.status },
          now,
          target,
        );
      } else {
        log.error({ err }, `unexpected error: ${what}`);
        await this.store.recordIssue('collector.error', String(err), { what }, now, target);
      }
    };

    try {
      const config = await this.provider.getElectionConfig();
      if (!this.configLoaded) await this.loadConfig(config);

      const codes = [...new Set(this.offices.map((o) => o.providerElectionCode))];
      const changedStates: { code: string; uf: StateCode }[] = [];

      // 1. Brazil-level progress, once per provider election (federal, state...).
      for (const code of codes) {
        try {
          const res = await this.provider.getCountryProgress(code);
          if (!res.changed) continue;
          const now = new Date().toISOString();
          const isMain = code === config.progressElectionCode;
          const entries = [{ area: area.country(), progress: res.data.progress }, ...res.data.states];
          if (isMain) {
            const changes = await this.store.applyProgress(entries, res.provenance, now);
            notifications.push(...changes.map(toNotification));
            if (res.data.progress.status !== 'not-started')
              await this.store.setRoundStatus(res.data.progress.status === 'finished' ? 'final' : 'live');
          }
          if (this.markSeen(code, area.country().key, res.data.progress))
            this.queueArea(code, area.country());
          for (const s of res.data.states) {
            if (this.markSeen(code, s.area.key, s.progress)) changedStates.push({ code, uf: s.area.state! });
          }
        } catch (err) {
          if (err instanceof ProviderUnavailableError && err.message.startsWith('circuit open')) throw err;
          await fail(err, `country progress ${code}`);
        }
      }

      // 2. State-level progress, only for states whose EA14 entry changed.
      await Promise.all(
        changedStates.map(async ({ code, uf }) => {
          try {
            const stateArea = area.state(uf);
            this.queueArea(code, stateArea);
            const res = await this.provider.getStateProgress(code, uf);
            if (!res.changed) return;
            const now = new Date().toISOString();
            if (code === config.progressElectionCode) {
              const changes = await this.store.applyProgress(
                [{ area: stateArea, progress: res.data.progress }, ...res.data.cities],
                res.provenance,
                now,
              );
              notifications.push(...summarise(changes, uf));
            }
            for (const c of res.data.cities) {
              if (this.markSeen(code, c.area.key, c.progress) && c.progress.status !== 'not-started') {
                this.queueArea(code, c.area);
              }
            }
          } catch (err) {
            await fail(err, `state progress ${code}/${uf}`, area.state(uf));
          }
        }),
      );

      // Periodic reconciliation: files are generated in parallel and synced to the CDN at
      // different moments, so an EA20 may change after its EA14 entry was already seen.
      if (this.cycles % this.options.reconcileEvery === 1) {
        for (const code of codes) {
          this.queueArea(code, area.country());
          for (const uf of new Set(config.cities.map((c) => c.state))) this.queueArea(code, area.state(uf));
        }
      }

      // 3. Results for queued (office, area) pairs, highest priority first, bounded per cycle.
      const jobs = [...this.pending.values()]
        .sort((a, b) => a.priority - b.priority)
        .slice(0, this.options.maxResultFetchesPerCycle);
      await Promise.all(
        jobs.map(async (job) => {
          const key = jobKey(job);
          try {
            const res = await this.provider.getResult({ office: job.office, area: job.area });
            this.pending.delete(key);
            if (!res.changed) return;
            const issues = checkResult(res.data);
            const now = new Date().toISOString();
            if (issues.length > 0) {
              log.warn({ area: job.area.key, office: job.office.slug, issues }, 'data quality issues');
              if (hasErrors(issues)) degraded = true;
              await this.store.recordIssue(
                'quality.issue',
                issues.map((i) => i.message).join('; '),
                { office: job.office.slug, issues },
                now,
                job.area,
              );
            }
            const stored = await this.store.applyResult(job.office, res.data, res.provenance, now);
            if (stored && job.area.type !== 'city' && job.area.type !== 'zone') {
              notifications.push({
                type: 'result.updated',
                areaKey: job.area.key,
                state: job.area.state ?? undefined,
                officeCode: job.office.code,
              });
            }
          } catch (err) {
            if (err instanceof ProviderNotFoundError) {
              // Not generated yet (the TSE answers 404 until then). It will be queued again.
              this.pending.delete(key);
              return;
            }
            await fail(err, `result ${job.office.slug} ${job.area.key}`, job.area);
          }
        }),
      );
    } catch (err) {
      fatal = err instanceof Error ? err.message : String(err);
      await fail(err, 'cycle');
    }

    const status = fatal ? 'failed' : degraded ? 'degraded' : 'ok';
    await this.store.finishCycle(cycleId, this.stats, status, fatal);
    notifications.push({ type: 'ingestion.status', changes: { status } });
    await this.store.notify(notifications, new Date().toISOString());
    log.info(
      {
        status,
        duration: Date.now() - started,
        requests: this.stats.requests,
        ok: this.stats.ok,
        notModified: this.stats.notModified,
        errors: this.stats.errors,
        pending: this.pending.size,
      },
      'cycle finished',
    );
  }

  private async loadConfig(config: ElectionConfig) {
    this.offices = await this.store.syncConfig(config, this.provider);
    this.capitals = new Set(
      config.cities.filter((c) => c.isCapital).map((c) => `${c.state.toLowerCase()}-${c.code}`),
    );
    await this.store.load();
    this.configLoaded = true;
    this.log.info(
      { offices: this.offices.map((o) => o.slug), cities: config.cities.length },
      'election configuration loaded',
    );
  }

  /** Records the area's signature; true when it differs from the last one seen. */
  private markSeen(
    code: string,
    areaKey: string,
    p: { totalizedAt: string | null; sectionsCounted: number | null; status: string },
  ) {
    const key = `${code}:${areaKey}`;
    const signature = `${p.status}|${p.totalizedAt}|${p.sectionsCounted}`;
    if (this.seen.get(key) === signature) return false;
    this.seen.set(key, signature);
    return true;
  }

  /** Queues every office of this provider election that applies to the area. */
  private queueArea(code: string, target: AreaRef) {
    for (const office of this.offices) {
      if (office.providerElectionCode !== code) continue;
      if (!appliesTo(office, target)) continue;
      if (target.type === 'city') {
        if (!this.options.collectCityResults) continue;
        if (this.options.cityResultOffices === 'majoritarian' && office.kind !== 'majoritarian') continue;
      }
      // Brazil, then states, then capitals, then everything else.
      const priority =
        target.type === 'country' ? 0 : target.type === 'state' ? 1 : this.capitals.has(target.key) ? 2 : 3;
      const job = { office, area: target, priority };
      this.pending.set(jobKey(job), job);
    }
  }
}

function appliesTo(office: StoredOffice, target: AreaRef): boolean {
  if (target.type === 'country') return office.scope === 'country';
  if (target.state === 'ZZ') return office.scope === 'country';
  if (office.scope === 'city' && target.type === 'state') return false;
  return office.states == null || office.states.includes(target.state!);
}

const jobKey = (j: { office: StoredOffice; area: AreaRef }) => `${j.office.id}|${j.area.key}`;

function emptyStats(): CycleStats {
  return { requests: 0, ok: 0, notModified: 0, notFound: 0, errors: 0, latencies: [] };
}

function toNotification(c: ProgressChange): Notification {
  return {
    type: c.area.type === 'country' ? 'country.updated' : 'state.updated',
    areaKey: c.area.key,
    state: c.area.state ?? undefined,
    changes: {
      sectionsAdded: c.sectionsAdded,
      votesAdded: c.votesAdded,
      countedPct: c.countedPct,
      status: c.status,
    },
  };
}

/** One state event plus one aggregated city event per state, instead of one per city. */
function summarise(changes: ProgressChange[], uf: StateCode): Notification[] {
  const out = changes.filter((c) => c.area.type === 'state').map(toNotification);
  const cityChanges = changes.filter((c) => c.area.type === 'city');
  if (cityChanges.length > 0) {
    out.push({
      type: 'city.updated',
      state: uf,
      changes: { sectionsAdded: cityChanges.reduce((s, c) => s + (c.sectionsAdded ?? 0), 0) },
    });
  }
  return out;
}

const shortName = (url: string) => url.slice(url.lastIndexOf('/') + 1);
