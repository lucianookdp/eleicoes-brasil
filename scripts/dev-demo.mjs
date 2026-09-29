#!/usr/bin/env node
/**
 * pnpm dev:demo — the whole platform on fictitious data, no TSE needed.
 * Starts: fictitious TSE server → collector → API → web. Needs a Postgres in DATABASE_URL
 * (default: the one from `docker compose up postgres`).
 */
import { spawn } from 'node:child_process';

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://eleicoes:eleicoes@localhost:5432/eleicoes',
  APP_MODE: 'DEVELOPMENT',
  ELECTION_ROUND: 'demo-1',
  TSE_BASE_URL: `http://localhost:${process.env.DEMO_TSE_PORT ?? 4010}`,
  TSE_POLL_INTERVAL: process.env.TSE_POLL_INTERVAL ?? '8',
  TSE_REQUESTS_PER_SECOND: process.env.TSE_REQUESTS_PER_SECOND ?? '40',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
};

const colors = { tse: 33, worker: 36, api: 35, web: 32 };
const procs = [];
function run(name, args, delay = 0) {
  setTimeout(() => {
    const p = spawn('pnpm', args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    const tag = `\x1b[${colors[name]}m${name.padEnd(6)}\x1b[0m│ `;
    const out = (d) => process.stdout.write(d.toString().replace(/^(?=.)/gm, tag));
    p.stdout.on('data', out);
    p.stderr.on('data', out);
    p.on('exit', (code) => {
      console.log(`${tag}exited with ${code}`);
      if (code) shutdown(code);
    });
    procs.push(p);
  }, delay);
}
function shutdown(code = 0) {
  for (const p of procs) p.kill('SIGTERM');
  process.exit(code);
}
process.on('SIGINT', () => shutdown());

console.log('Eleições Brasil — demo with fictitious data. Open http://localhost:3000\n');
run('tse', ['--filter', '@eleicoes/worker', 'demo:tse']);
run('worker', ['--filter', '@eleicoes/worker', 'dev'], 1500);
run('api', ['--filter', '@eleicoes/api', 'dev'], 1500);
run('web', ['--filter', '@eleicoes/web', 'dev'], 2500);
