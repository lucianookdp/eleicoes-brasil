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
  /** Upper bound of Brazil/state result files per headline cycle. */
  maxResultFetchesPerCycle: number;
  /** Every N cycles, re-check all country/state result files (conditional GETs, mostly 304). */
  reconcileEvery: number;
  /** Municipal files fetched in parallel by the background drain. */
  cityConcurrency: number;
  /** False while this process must not collect (collector lock lost): the drain pauses. */
  active?: () => boolean;
}

interface ResultJob {
  office: StoredOffice;
  area: AreaRef;
  priority: number;
}

type Notification = Omit<RealtimeEvent, 'electionId' | 'timestamp'>;

interface BackgroundTask {
  priority: number;
  /** Returns false on failure, so the task is retried. */
  run: () => Promise<boolean>;
}

/**
 * Two rhythms share one rate-limited HTTP client:
 *
 * 1. Headline cycle (every TSE_POLL_INTERVAL seconds): EA14 → EA15 of changed states → EA20 of
 *    Brazil and changed states. High-priority requests, so what most readers look at is
 *    refreshed within seconds of the TSE publishing it.
 * 2. City drain (continuous): municipal EA20 files queued by the headline cycle, capitals first,
 *    at low priority. It uses whatever request budget the headline cycle leaves.
 *
 * A change is detected by comparing each area's status, totalization time and counted sections
 * with the last value seen for that provider election; only changed areas are fetched.
 */
export class Collector {
  private offices: StoredOffice[] = [];
  private capitals = new Set<string>();
  private configLoaded = false;
  private readonly seen = new Map<string, string>();
  private readonly headlineJobs = new Map<string, ResultJob>();
  /** Background work, lowest priority number first: EA15 reads, state deputies, then cities. */
  private readonly background = new Map<string, BackgroundTask>();
  /** City results stored by the drain since the last headline cycle, per state. */
  private cityUpdates = new Map<string, number>();
  private backgroundErrors = 0;
  private cycles = 0;
  /**
   * When the count reached 100% (as seen by this process): for the next 30 minutes the final marks
   * ("Eleito") are what is left to arrive, so Brazil and the states are re-checked every cycle.
   */
  private finishedAt: number | null = null;
  private stats: CycleStats = emptyStats();
  private stopped = false;

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

  stop() {
    this.stopped = true;
  }

  /**
   * The round finished more than 30 minutes ago (the "Eleito" marks are in): nothing will change,
   * so the main loop polls every few minutes instead of every few seconds.
   */
  settled() {
    return this.finishedAt !== null && Date.now() - this.finishedAt >= 30 * 60_000;
  }

  // ------------------------------------------------------------------ headline cycle

  /** Returns the cycle status; "waiting" means the source has not published this round yet. */
  async runCycle(): Promise<'ok' | 'degraded' | 'failed' | 'waiting'> {
    const cycleId = randomUUID();
    const log = this.log.child({ cycleId });
    const started = Date.now();
    this.stats = emptyStats();
    this.cycles++;
    await this.store.startCycle(cycleId, this.options.mode, new Date().toISOString());

    // Every change is announced as soon as it is stored, not at the end of the cycle.
    const emit = async (events: Notification[]) => {
      if (events.length > 0) await this.store.notify(events, new Date().toISOString());
    };
    let degraded = false;
    let fatal: string | null = null;
    const fail = async (err: unknown, what: string, target?: AreaRef) => {
      degraded = true;
      await this.recordFailure(log, err, what, target);
    };

    let waiting = false;
    try {
      let config: ElectionConfig;
      try {
        config = await this.provider.getElectionConfig();
      } catch (err) {
        // Before election day the official configuration may not exist yet (HTTP 404).
        if (!(err instanceof ProviderNotFoundError)) throw err;
        waiting = true;
        throw err;
      }
      if (!this.configLoaded) await this.loadConfig(config);

      const codes = [...new Set(this.offices.map((o) => o.providerElectionCode))];
      const changedStates: { code: string; uf: StateCode }[] = [];

      // 1. Brazil-level progress, once per provider election (federal, state...).
      for (const code of codes) {
        try {
          const res = await this.provider.getCountryProgress(code);
          if (!res.changed) continue;
          const now = new Date().toISOString();
          if (code === config.progressElectionCode) {
            const changes = await this.store.applyProgress(
              [{ area: area.country(), progress: res.data.progress }, ...res.data.states],
              res.provenance,
              now,
            );
            await emit(changes.map(toNotification));
            if (res.data.progress.status !== 'not-started') {
              await this.store.setRoundStatus(res.data.progress.status === 'finished' ? 'final' : 'live');
            }
            // From the TSE's own totalization time when it has one: a worker restarted days after
            // the count must not treat the round as "just finished" (30 min of re-checks).
            const tseDone = Date.parse(res.data.progress.totalizedAt ?? '');
            this.finishedAt =
              res.data.progress.status === 'finished'
                ? (this.finishedAt ?? (Number.isFinite(tseDone) ? Math.min(Date.now(), tseDone) : Date.now()))
                : null;
          }
          if (this.markSeen(code, 'br', res.data.progress)) this.queueArea(code, area.country());
          for (const s of res.data.states) {
            if (this.markSeen(code, s.area.key, s.progress)) {
              changedStates.push({ code, uf: s.area.state! });
              this.queueArea(code, s.area);
            }
          }
        } catch (err) {
          if (err instanceof ProviderUnavailableError && err.message.startsWith('circuit open')) throw err;
          await fail(err, `country progress ${code}`);
        }
      }

      // Periodic reconciliation: files are generated in parallel and synced to the CDN at
      // different moments, so an EA20 may change after its EA14 entry was already seen. For 30 minutes
      // after the count reaches 100%, every cycle: the TSE marks the winners ("Eleito") a little after the
      // last ballot box, without touching the progress files, and that is the news people wait
      // for. Conditional requests, so an unchanged file costs a 304.
      const justFinished = this.finishedAt !== null && Date.now() - this.finishedAt < 30 * 60_000;
      if (justFinished || this.cycles % this.options.reconcileEvery === 1) {
        for (const code of codes) {
          this.queueArea(code, area.country());
          for (const uf of new Set(config.cities.map((c) => c.state))) this.queueArea(code, area.state(uf));
        }
      }

      // 3. Brazil and state results, now, at high priority.
      const jobs = [...this.headlineJobs.values()]
        .sort((a, b) => a.priority - b.priority)
        .slice(0, this.options.maxResultFetchesPerCycle);
      await Promise.all(
        jobs.map(async (job) => {
          const outcome = await this.fetchResult(job, false, log);
          if (outcome === 'failed') degraded = true;
          if (outcome !== 'failed') this.headlineJobs.delete(jobKey(job));
          if (outcome === 'stored') {
            await emit([
              {
                type: 'result.updated',
                areaKey: job.area.key,
                state: job.area.state ?? undefined,
                officeCode: job.office.code,
              },
            ]);
          }
        }),
      );
      // 4. State-level progress (EA15) of changed states finds changed municipalities. It runs
      //    in the background queue, ahead of any municipal file, so it never delays step 3.
      for (const { code, uf } of changedStates) {
        this.enqueue(`ea15:${code}:${uf}`, 0, () =>
          this.readStateProgress(code, uf, config.progressElectionCode),
        );
      }
    } catch (err) {
      if (!waiting) {
        fatal = err instanceof Error ? err.message : String(err);
        await fail(err, 'cycle');
      }
    }

    // Municipal results stored by the background drain since the last cycle.
    const notifications: Notification[] = [];
    for (const [uf, count] of this.cityUpdates)
      notifications.push({ type: 'result.updated', state: uf, changes: { count } });
    this.cityUpdates = new Map();
    if (this.backgroundErrors > 0) degraded = true;
    this.backgroundErrors = 0;

    const status = waiting ? 'waiting' : fatal ? 'failed' : degraded ? 'degraded' : 'ok';
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
        backgroundQueue: this.background.size,
      },
      'cycle finished',
    );
    return status;
  }

  // ------------------------------------------------------------------ background drain

  /** Runs until stop(): works through the background queue at low request priority. */
  async drainCities(): Promise<void> {
    while (!this.stopped) {
      if (this.background.size === 0 || this.options.active?.() === false) {
        await sleep(250);
        continue;
      }
      const batch = [...this.background.entries()]
        .sort(([, a], [, b]) => a.priority - b.priority)
        .slice(0, this.options.cityConcurrency * 4);
      for (const [key] of batch) this.background.delete(key);
      await mapLimit(batch, this.options.cityConcurrency, async ([key, task]) => {
        // A database blip must not stop the background loop: count it and retry later.
        const ok = await task.run().catch((err) => {
          this.provider.resetConditionalCache();
          this.log.error({ err, key }, 'background task failed');
          return false;
        });
        if (!ok) {
          this.backgroundErrors++;
          // Retry later unless newer work for the same file was queued meanwhile.
          if (!this.background.has(key)) this.background.set(key, task);
        }
      });
      if (this.backgroundErrors > 20) await sleep(5000); // source struggling: back off
    }
  }

  private enqueue(key: string, priority: number, run: () => Promise<boolean>) {
    this.background.set(key, { priority, run });
  }

  private async readStateProgress(
    code: string,
    uf: StateCode,
    progressElectionCode: string,
  ): Promise<boolean> {
    const log = this.log.child({ loop: 'background' });
    try {
      const res = await this.provider.getStateProgress(code, uf, { background: true });
      if (!res.changed) return true;
      if (code === progressElectionCode) {
        const changes = await this.store.applyProgress(
          [{ area: area.state(uf), progress: res.data.progress }, ...res.data.cities],
          res.provenance,
          new Date().toISOString(),
        );
        await this.store.notify(summarise(changes, uf), new Date().toISOString());
      }
      for (const c of res.data.cities) {
        if (this.markSeen(code, c.area.key, c.progress) && c.progress.status !== 'not-started')
          this.queueArea(code, c.area);
      }
      return true;
    } catch (err) {
      await this.recordFailure(log, err, `state progress ${code}/${uf}`, area.state(uf));
      return false;
    }
  }

  private async backgroundResult(job: ResultJob): Promise<boolean> {
    const outcome = await this.fetchResult(job, true, this.log.child({ loop: 'background' }));
    if (outcome === 'stored') {
      if (job.area.type === 'city') {
        this.cityUpdates.set(job.area.state!, (this.cityUpdates.get(job.area.state!) ?? 0) + 1);
      } else {
        await this.store.notify(
          [
            {
              type: 'result.updated',
              areaKey: job.area.key,
              state: job.area.state ?? undefined,
              officeCode: job.office.code,
            },
          ],
          new Date().toISOString(),
        );
      }
    }
    return outcome !== 'failed';
  }

  // ------------------------------------------------------------------ shared

  private async fetchResult(
    job: ResultJob,
    background: boolean,
    log: Logger,
  ): Promise<'stored' | 'unchanged' | 'missing' | 'failed'> {
    try {
      const res = await this.provider.getResult({ office: job.office, area: job.area, background });
      if (!res.changed) return 'unchanged';
      const now = new Date().toISOString();
      const issues = checkResult(res.data);
      if (issues.length > 0) {
        log.warn({ area: job.area.key, office: job.office.slug, issues }, 'data quality issues');
        await this.store.recordIssue(
          'quality.issue',
          issues.map((i) => i.message).join('; '),
          { office: job.office.slug, issues },
          now,
          job.area,
        );
        if (hasErrors(issues) && !background) this.backgroundErrors++;
      }
      const stored = await this.store.applyResult(job.office, res.data, res.provenance, now);
      // Also when unchanged: after a restart, stored results still need their photos.
      this.queuePhotos(job.office, job.area, res.data.candidates);
      return stored ? 'stored' : 'unchanged';
    } catch (err) {
      // Not generated yet (the TSE answers 404 until then). It is queued again when the area changes.
      if (err instanceof ProviderNotFoundError) return 'missing';
      await this.recordFailure(log, err, `result ${job.office.slug} ${job.area.key}`, job.area);
      return 'failed';
    }
  }

  /** Photos of majoritarian candidates, once each: a few hundred files, ahead of deputies and cities. */
  private queuePhotos(office: StoredOffice, target: AreaRef, candidates: { key: string }[]) {
    const provider = this.provider;
    if (!provider.getCandidatePhoto || target.type === 'city' || target.type === 'zone') return;
    // President/governor/senator photos early; deputies' (thousands) only after every result.
    const priority = office.kind === 'majoritarian' ? 3 : 13;
    for (const c of candidates) {
      if (this.store.knownPhotos.has(c.key) || this.background.has(`photo:${c.key}`)) continue;
      this.enqueue(`photo:${c.key}`, priority, async () => {
        try {
          await this.store.savePhoto(c.key, await provider.getCandidatePhoto!(office, target.state, c.key));
          return true;
        } catch (err) {
          await this.recordFailure(this.log, err, `photo ${c.key}`, target);
          return false;
        }
      });
    }
  }

  private async recordFailure(log: Logger, err: unknown, what: string, target?: AreaRef) {
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
    } else if (err instanceof ProviderUnavailableError && err.message.startsWith('circuit open')) {
      // Requests refused locally while the circuit is open: one issue was recorded when it opened.
      log.debug({ what }, 'skipped: circuit open');
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
      // Usually the database: the file may have been downloaded but not stored. Forget the
      // ETags so the next poll downloads it again instead of getting a 304 and losing it
      // (a final result never changes again).
      this.provider.resetConditionalCache();
      log.error({ err }, `unexpected error: ${what}`);
      await this.store.recordIssue('collector.error', String(err), { what }, now, target);
    }
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

  /**
   * Queues every office of this provider election that applies to the area.
   * Headline (next cycle, high priority): Brazil, and president/governor/senator per state.
   * Background: EA15 reads (0), photos of majoritarian candidates (3), state-level deputies (5), capitals (10),
   * other municipalities (11), deputies per municipality (12), deputies' photos (13): what readers look at first.
   */
  private queueArea(code: string, target: AreaRef) {
    for (const office of this.offices) {
      if (office.providerElectionCode !== code) continue;
      if (!appliesTo(office, target)) continue;
      if (target.type === 'city') {
        if (!this.options.collectCityResults) continue;
        if (this.options.cityResultOffices === 'majoritarian' && office.kind !== 'majoritarian') continue;
      }
      const job: ResultJob = { office, area: target, priority: 0 };
      if (target.type === 'country' || (target.type === 'state' && office.kind === 'majoritarian')) {
        const rank = { presidente: 0, governador: 1, senador: 2 }[office.slug] ?? 3;
        job.priority = target.type === 'country' ? 0 : 1 + rank;
        this.headlineJobs.set(jobKey(job), job);
      } else {
        const priority =
          target.type === 'state'
            ? 5
            : office.kind !== 'majoritarian'
              ? 12
              : this.capitals.has(target.key)
                ? 10
                : 11;
        this.enqueue(`result:${jobKey(job)}`, priority, () => this.backgroundResult(job));
      }
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
    type:
      c.area.type === 'country'
        ? 'country.updated'
        : c.area.type === 'state'
          ? 'state.updated'
          : 'city.updated',
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
      changes: {
        sectionsAdded: cityChanges.reduce((s, c) => s + (c.sectionsAdded ?? 0), 0),
        count: cityChanges.length,
      },
    });
  }
  return out;
}

/** Runs `fn` over `items` with at most `limit` in flight. */
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]!);
    }),
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const shortName = (url: string) => url.slice(url.lastIndexOf('/') + 1);
