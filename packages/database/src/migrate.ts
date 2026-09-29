import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Applies pending SQL migrations. The folder can be overridden for bundled builds, where the
 * migrations are copied next to the output (see Dockerfiles).
 */
export async function runMigrations(url: string, folder = process.env.MIGRATIONS_DIR) {
  const migrationsFolder = folder ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(sql), { migrationsFolder });
  } finally {
    await sql.end();
  }
}
