import { apiEnvSchema, loadEnv } from '@eleicoes/config';
import { EVENTS_CHANNEL } from '@eleicoes/database';
import postgres from 'postgres';
import { buildApp } from './app';

const env = loadEnv(apiEnvSchema);
const sql = postgres(env.DATABASE_URL, { max: 10, onnotice: () => {} });

const { app, onEvent } = await buildApp({
  sql,
  env,
  logger: {
    level: env.LOG_LEVEL,
    base: { service: 'api' },
    transport: process.stdout.isTTY
      ? { target: 'pino-pretty', options: { ignore: 'pid,hostname' } }
      : undefined,
  },
});

// postgres.js re-subscribes automatically after a connection drop.
await sql.listen(EVENTS_CHANNEL, onEvent, () =>
  app.log.info({ channel: EVENTS_CHANNEL }, 'listening for worker events'),
);

const shutdown = async () => {
  await app.close();
  await sql.end({ timeout: 5 });
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ host: env.HOST, port: env.PORT });
