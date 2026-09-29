# ADR 005 — PostgreSQL com Drizzle

- Status: aceito · Data: 2026-09-29

## Contexto
Precisamos de estado atual, histórico consultável por tempo, JSON flexível para resultados e um
mecanismo de aviso para a API. Hospedagem deve ser barata e trocável.

## Decisão
PostgreSQL como única fonte de verdade: `jsonb` para documentos de resultado, índices por
(área, tempo), `DISTINCT ON` para consultas pontuais no tempo e `LISTEN/NOTIFY` para eventos.
Drizzle ORM para schema tipado e migrações SQL versionadas (drizzle-kit); consultas analíticas da
API em SQL parametrizado (postgres.js), mais legível que um query builder para essas formas.

Prisma foi descartado: o motor extra e a geração de cliente não trazem ganho aqui, e `jsonb` +
SQL puro são mais naturais com Drizzle.

## Consequências
Qualquer Postgres 14+ gerenciado serve (Neon, Supabase, Railway, RDS). Não há segundo banco para
operar.
