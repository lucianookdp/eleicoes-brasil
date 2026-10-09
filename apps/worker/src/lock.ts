import postgres from 'postgres';

export interface CollectorLock {
  /** False while the lock is lost (database down, or another collector took over): do not collect. */
  readonly held: boolean;
  release(): Promise<void>;
}

/**
 * Only one collector per round may run: two would double our request rate to the TSE (same IP,
 * risk of a 10-minute block) and write every change twice. A deploy can briefly run the old and
 * the new container side by side, so the new one waits here until the old one has exited.
 *
 * A Postgres session-level advisory lock on a connection of its own. If that connection drops
 * (database restart, network), the lock is gone with it: `held` turns false, collection pauses,
 * and the lock is taken again as soon as possible. The process does not exit, because a platform
 * restarts a crashing service only a limited number of times, and a database outage of a few
 * minutes would use them all up.
 */
export async function holdCollectorLock(
  url: string,
  roundSlug: string,
  {
    retryMs = 5000,
    onWaiting,
    onLost,
    onRegained,
  }: { retryMs?: number; onWaiting?: () => void; onLost?: () => void; onRegained?: () => void },
): Promise<CollectorLock> {
  const key = `eleicoes-collector:${roundSlug}`;
  let held = false;
  let released = false;
  let conn: postgres.Sql | null = null;

  /** One attempt on a fresh connection; true when this process now holds the lock. */
  const attempt = async () => {
    const sql = postgres(url, {
      max: 1,
      // Never recycle the connection: closing it releases the lock.
      idle_timeout: 0,
      max_lifetime: null,
      onnotice: () => {},
      connection: { application_name: 'eleicoes-collector-lock' },
      onclose: () => {
        if (conn !== sql || !held || released) return;
        held = false;
        conn = null;
        onLost?.();
        void sql.end({ timeout: 1 }).catch(() => {});
        void acquire().then(() => {
          if (!released) onRegained?.();
        });
      },
    });
    try {
      const [row] = await sql<{ ok: boolean }[]>`select pg_try_advisory_lock(hashtext(${key})) as ok`;
      if (row?.ok) {
        conn = sql;
        held = true;
        return true;
      }
    } catch {
      // Database unreachable: try again later.
    }
    await sql.end({ timeout: 1 }).catch(() => {});
    return false;
  };

  const acquire = async () => {
    while (!released && !(await attempt())) {
      onWaiting?.();
      await new Promise((r) => setTimeout(r, retryMs));
    }
  };

  await acquire();
  return {
    get held() {
      return held && !released;
    },
    release: async () => {
      released = true;
      held = false;
      await conn?.end({ timeout: 5 });
    },
  };
}
