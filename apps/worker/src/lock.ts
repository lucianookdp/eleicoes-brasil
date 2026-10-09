import postgres from 'postgres';

/**
 * Only one collector per round may run: two would double our request rate to the TSE (same IP,
 * risk of a 10-minute block) and write every change twice. A deploy can briefly run the old and
 * the new container side by side, so the new one waits here until the old one has exited.
 *
 * A Postgres session-level advisory lock on a connection of its own, held for the life of the
 * process. If that connection drops, the lock is gone with it: `onLost` must stop the process.
 */
export async function holdCollectorLock(
  url: string,
  roundSlug: string,
  { retryMs = 5000, onWaiting, onLost }: { retryMs?: number; onWaiting?: () => void; onLost: () => void },
) {
  let released = false;
  const sql = postgres(url, {
    max: 1,
    // Never recycle the connection: closing it releases the lock.
    idle_timeout: 0,
    max_lifetime: null,
    onnotice: () => {},
    onclose: () => {
      if (!released) onLost();
    },
  });
  const key = `eleicoes-collector:${roundSlug}`;
  for (;;) {
    const [row] = await sql<{ ok: boolean }[]>`select pg_try_advisory_lock(hashtext(${key})) as ok`;
    if (row?.ok) break;
    onWaiting?.();
    await new Promise((r) => setTimeout(r, retryMs));
  }
  return {
    release: async () => {
      released = true;
      await sql.end({ timeout: 5 });
    },
  };
}
