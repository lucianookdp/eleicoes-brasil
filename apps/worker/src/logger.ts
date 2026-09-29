import pino from 'pino';

export function createLogger(service: string, level: string) {
  return pino({
    level,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Human-readable logs in a terminal, JSON everywhere else (containers, CI).
    transport: process.stdout.isTTY
      ? { target: 'pino-pretty', options: { ignore: 'pid,hostname' } }
      : undefined,
  });
}
