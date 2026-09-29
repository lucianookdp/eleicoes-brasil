# ADR 003 — Server-Sent Events em vez de WebSocket

- Status: aceito · Data: 2026-09-29

## Contexto
O fluxo é unidirecional: o servidor avisa que algo mudou. O navegador não envia nada além das
requisições HTTP normais.

## Decisão
SSE (`text/event-stream`) em `/api/realtime/elections/:id`. Os eventos são avisos pequenos
(tipo, área, variação); o navegador invalida o cache do TanStack Query e busca o que exibe.

## Consequências
Funciona sobre HTTP comum, atravessa proxies e CDNs, reconecta sozinho (`retry`) e não exige
biblioteca no cliente. Cada aba mantém uma conexão HTTP aberta (limite configurado por
instância). Se um dia houver interação bidirecional real, WebSocket pode ser adicionado sem mudar
o resto.
