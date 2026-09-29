import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';
import { createDatabase, electionRounds, runMigrations } from '@eleicoes/database';
import { type AreaResult, emptyProgress } from '@eleicoes/election-core';
import { eq } from 'drizzle-orm';
import { createLogger } from '../logger';
import { Store } from '../store';
import { aggregateOpenData } from './open-data';

/**
 * pnpm import:history --year 2022 [--path <dir|zip|csv>] [--download]
 *
 * Imports the final results of a past election from the TSE Open Data Portal into the same
 * tables the live collector uses, so it shows up in the election picker like any other.
 * Re-running replaces the previous import of that year.
 */
const { values } = parseArgs({
  options: {
    year: { type: 'string' },
    path: { type: 'string' },
    download: { type: 'boolean', default: false },
    name: { type: 'string' },
  },
});
const log = createLogger('import', process.env.LOG_LEVEL ?? 'info');
const url = process.env.DATABASE_URL;
if (!url || !values.year || !/^\d{4}$/.test(values.year)) {
  console.error(
    'Usage: DATABASE_URL=... pnpm import:history --year 2022 [--path <dir|zip|csv>] [--download]',
  );
  process.exit(1);
}
const year = values.year;
// pnpm runs scripts inside apps/worker; INIT_CWD is where the command was typed.
const cwd = process.env.INIT_CWD ?? process.cwd();
const workDir = join(cwd, '.data', 'opendata', year);
mkdirSync(workDir, { recursive: true });

const SOURCES = [
  `https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_${year}.zip`,
  `https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_${year}.zip`,
];

if (values.download) {
  for (const src of SOURCES) {
    const target = join(workDir, basename(src));
    if (existsSync(target)) continue;
    log.info({ src }, 'downloading (large file, this can take a few minutes)');
    const res = await fetch(src);
    if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status} for ${src}`);
    await pipeline(Readable.fromWeb(res.body as never), createWriteStream(target));
  }
}

// Collect CSV files: unzip archives into the work directory first.
const inputs = values.path ? [resolve(cwd, values.path)] : readdirSync(workDir).map((f) => join(workDir, f));
const csvs: string[] = [];
for (const input of inputs) {
  if (statSync(input).isDirectory()) {
    for (const f of readdirSync(input)) if (f.toLowerCase().endsWith('.csv')) csvs.push(join(input, f));
  } else if (input.toLowerCase().endsWith('.zip')) {
    execFileSync('unzip', ['-o', '-q', input, '*.csv', '-d', workDir]);
    for (const f of readdirSync(workDir))
      if (f.toLowerCase().endsWith('.csv') && !csvs.includes(join(workDir, f))) csvs.push(join(workDir, f));
  } else if (input.toLowerCase().endsWith('.csv')) csvs.push(input);
}
// Per-state files and the national "BRASIL" file carry the same rows: never read both.
const pick = (prefix: string) => {
  const all = csvs.filter((f) => basename(f).toLowerCase().startsWith(prefix) && basename(f).includes(year));
  const perState = all.filter((f) => !/_brasil\.csv$/i.test(f));
  return perState.length > 0 ? perState : all;
};
const candidateFiles = pick('votacao_candidato_munzona');
const detailFiles = pick('detalhe_votacao_munzona');
if (candidateFiles.length === 0) {
  console.error(`No votacao_candidato_munzona_${year}*.csv found. Use --download or --path.`);
  process.exit(1);
}
log.info({ candidateFiles: candidateFiles.length, detailFiles: detailFiles.length }, 'reading files');

const rounds = await aggregateOpenData(candidateFiles, detailFiles);
await runMigrations(url);
const { db, sql, close } = createDatabase(url, { max: 4 });

for (const r of rounds) {
  const slug = `${year}-${r.round}`;
  const date = r.date ?? `${year}-10-01`;
  const name =
    values.name ?? (r.kind === 'municipal' ? `Eleições Municipais ${year}` : `Eleições Gerais ${year}`);
  await db.delete(electionRounds).where(eq(electionRounds.slug, slug));
  const roundId = await Store.ensureRound(
    db,
    {
      slug,
      electionSlug: year,
      electionName: name,
      year: Number(year),
      kind: r.kind,
      round: r.round,
      date,
      adapter: 'tse-open-data',
      demo: false,
      sources: {},
    },
    'IMPORT',
    'dados-abertos',
  );
  const store = new Store(db, sql, roundId, slug);
  const offices = await store.syncConfig(
    {
      providerRoundId: 'dados-abertos',
      date,
      round: r.round,
      offices: r.offices,
      cities: [...r.cities.values()].map((c) => ({ ...c, ibgeCode: null, isCapital: false, zones: [] })),
      progressElectionCode: '',
      providerElectionCodes: [],
    },
    { id: 'tse-open-data', version: '1' },
  );
  // Final results carry the time of day the count ended only approximately; use election night.
  const capturedAt = new Date(`${date}T23:59:00-03:00`).toISOString();
  const provenance = (file: string, checksum: string) => ({
    provider: 'TSE',
    adapter: 'tse-open-data@1',
    sourceFile: file,
    sourceId: null,
    retrievedAt: new Date().toISOString(),
    sourceGeneratedAt: null,
    etag: null,
    checksum,
  });

  await store.applyProgress(
    [...r.progress.values()],
    provenance(`detalhe_votacao_munzona_${year}`, 'import'),
    capturedAt,
  );
  let n = 0;
  for (const [key, res] of r.results) {
    const office = offices.find((o) => o.code === res.office.code)!;
    const result: AreaResult = {
      officeCode: office.code,
      area: res.area,
      progress: r.progress.get(res.area.key)?.progress ?? { ...emptyProgress(), status: 'finished' },
      votes: res.votes,
      candidates: res.candidates,
      parties: res.parties,
      seats: null,
      final: true,
      mathematicallyDecided: null,
      votesPublishable: true,
      noElectedReasons: [],
    };
    await store.applyResult(
      office,
      result,
      provenance(`votacao_candidato_munzona_${year}`, `import-${slug}-${key}`),
      capturedAt,
    );
    if (++n % 2000 === 0) log.info({ round: slug, results: n, of: r.results.size }, 'importing');
  }
  await store.setRoundStatus('final');
  log.info({ round: slug, offices: offices.length, results: n, areas: r.progress.size }, 'round imported');
}
await close();
