import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>['db'];

/** Channel used by the worker to announce changes and by the API to receive them. */
export const EVENTS_CHANNEL = 'election_events';

export function createDatabase(url: string, { max = 10 }: { max?: number } = {}) {
  const sql = postgres(url, { max, onnotice: () => {} });
  const db = drizzle(sql, { schema });
  return { db, sql, close: () => sql.end({ timeout: 5 }) };
}
