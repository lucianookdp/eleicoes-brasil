# ADR 006 — Cache em memória invalidado por NOTIFY, sem Redis na V1

- Status: aceito · Data: 2026-09-29

## Contexto
O briefing sugeria Redis para dados atuais. O papel dele seria (a) cache de respostas e (b)
pub/sub do worker para a API.

## Decisão
- Pub/sub: `LISTEN/NOTIFY` do próprio Postgres (a mesma transação que grava também avisa).
- Cache: memória de cada instância da API, por rodada, invalidada no NOTIFY daquela rodada, com
  TTL de segurança de 10 s. Requisições simultâneas compartilham a mesma consulta.
- Borda: `Cache-Control` curto com `stale-while-revalidate` para um CDN absorver picos.

## Por quê
Um serviço a menos para hospedar e monitorar na noite da eleição. Com invalidação por evento, o
cache local é mais rápido que ir ao Redis. Cada instância escuta o NOTIFY, então várias
instâncias funcionam sem coordenação.

## Quando rever
Se a API precisar de rate limit compartilhado entre muitas instâncias, ou se o banco virar
gargalo mesmo com CDN, adicionar Redis atrás da interface `ResponseCache`.
