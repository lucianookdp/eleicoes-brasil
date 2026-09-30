import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';
import { createDatabase } from '@eleicoes/database';
import { createLogger } from '../logger';

/**
 * pnpm import:photos --year 2022
 *
 * Loads the official candidate photos of an imported past election from the TSE Open Data
 * Portal (foto_cand<year>_<UF>_div.zip) into candidate_photos, for the majoritarian offices
 * (president, governor, senator): the only ones the interface shows photos for. Photos are read
 * from the archives in place; only the ones needed are stored. Safe to re-run.
 */
const { values } = parseArgs({ options: { year: { type: 'string' } } });
const log = createLogger('import-photos', process.env.LOG_LEVEL ?? 'info');
const url = process.env.DATABASE_URL;
if (!url || !values.year || !/^\d{4}$/.test(values.year)) {
  console.error('Usage: DATABASE_URL=... pnpm import:photos --year 2022');
  process.exit(1);
}
const year = values.year;
const cwd = process.env.INIT_CWD ?? process.cwd();
const workDir = join(process.env.OPEN_DATA_DIR ?? join(cwd, '.data', 'opendata'), year, 'fotos');
mkdirSync(workDir, { recursive: true });

const { sql, close } = createDatabase(url, { max: 2 });
const wanted = await sql<{ roundId: string; key: string; uf: string }[]>`
  select c.round_id as "roundId", c.provider_id as key, coalesce(c.state_code, 'br') as uf
  from candidates c
  join offices o on o.id = c.office_id
  join election_rounds r on r.id = c.round_id
  where r.slug like ${`${year}-%`} and o.kind = 'majoritarian'`;
if (!wanted.length) {
  console.error(`No imported candidates for ${year}. Run pnpm import:history --year ${year} first.`);
  process.exit(1);
}

let stored = 0;
let missing = 0;
for (const uf of [...new Set(wanted.map((w) => w.uf))].sort()) {
  const zip = join(workDir, `foto_cand${year}_${uf.toUpperCase()}_div.zip`);
  if (!existsSync(zip)) {
    const src = `https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes${year}/fotos/foto_cand${year}_${uf.toUpperCase()}_div.zip`;
    log.info({ src }, 'downloading');
    const res = await fetch(src);
    if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status} for ${src}`);
    // Download to .part first so an interrupted run never leaves a truncated archive behind.
    await pipeline(Readable.fromWeb(res.body as never), createWriteStream(`${zip}.part`));
    renameSync(`${zip}.part`, zip);
  }
  // Entries look like F<UF><SQ_CANDIDATO>_div.jpeg (or .jpg): index them by SQ_CANDIDATO.
  const entries = new Map<string, string>();
  const listing = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8', maxBuffer: 64 << 20 });
  for (const e of listing.split('\n')) {
    const m = /^F[A-Z]{2}(\d+)_div\.jpe?g$/i.exec(e.split('/').pop() ?? '');
    if (m) entries.set(m[1] as string, e);
  }
  for (const w of wanted.filter((x) => x.uf === uf)) {
    const entry = entries.get(w.key);
    if (!entry) {
      missing++;
      continue;
    }
    const data = execFileSync('unzip', ['-p', zip, entry], { maxBuffer: 16 << 20 });
    await sql`
      insert into candidate_photos (round_id, candidate_key, content_type, data)
      values (${w.roundId}, ${w.key}, 'image/jpeg', ${data})
      on conflict (round_id, candidate_key)
      do update set content_type = excluded.content_type, data = excluded.data, fetched_at = now()`;
    stored++;
  }
  log.info({ uf, stored, missing }, 'state done');
}
log.info({ year, stored, missing }, 'photos imported');
await close();
