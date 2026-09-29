# Arquitetura em execução

Complementa o [ARCHITECTURE.md](../ARCHITECTURE.md) com o que acontece em tempo de execução.

## Ciclo do coletor

Um ciclo começa `TSE_POLL_INTERVAL` segundos depois do anterior terminar (ciclos nunca se
sobrepõem). Cada ciclo tem um `cycleId` presente em todos os logs.

```
1. ele-c.json (condicional)            → configuração; sincroniza cargos e municípios na 1ª vez
2. EA14 de cada eleição do pleito      → quais UFs mudaram (assinatura: status | dt/ht | seções)
3. EA15 das UFs que mudaram            → quais municípios mudaram
4. fila de resultados (cargo × área)   → Brasil, depois UFs, depois capitais, depois o resto
5. EA20 dos itens da fila, até MAX_RESULT_FETCHES_PER_CYCLE; o restante fica para o próximo ciclo
6. grava estado atual, snapshots e eventos; NOTIFY para a API
7. registra métricas do ciclo (requisições, 200/304/404/erros, latência média e p95)
```

A cada ~5 minutos, uma **reconciliação** recoloca na fila todos os arquivos de Brasil e UFs
(requisições condicionais, quase sempre 304). Isso cobre o caso descrito pelo TSE em que um EA20
muda depois de o EA14 correspondente já ter sido lido.

## Cliente HTTP

Uma única instância por processo aplica, nesta ordem: semáforo de concorrência → limitador de taxa
global → requisição com timeout → classificação da resposta.

| Resposta | Ação |
| --- | --- |
| 200 | guarda ETag/Last-Modified, devolve corpo + SHA-256 |
| 304 | “sem mudança” |
| 404 | erro `ProviderNotFoundError`, sem retry; conta para o disjuntor de 404 |
| 403 / 429 | abre o circuito por 11 min (o bloqueio do TSE reinicia a cada tentativa) |
| 5xx, timeout, rede | retry com backoff exponencial e jitter completo, até `TSE_MAX_RETRIES`; 5 falhas seguidas abrem o circuito (15 s, dobrando até 5 min) |

## Falhas

| Situação | Comportamento |
| --- | --- |
| Payload fora do schema | evento `source.schema` com arquivo e problemas; ciclo `degraded`; demais arquivos seguem |
| TSE indisponível | evento `source.unavailable`; nada é apagado; UI mostra “dados atrasados” com o horário do último sucesso |
| Banco indisponível | o ciclo falha, os validadores condicionais são descartados (para baixar tudo de novo) e o próximo ciclo tenta outra vez |
| Dados incoerentes (seções > total, votos > total…) | gravados como publicados + evento `quality.issue` |
| Arquivo ainda não gerado (404) | ignorado; volta à fila quando a área mudar |

## Saúde da coleta (API)

`healthy` último ciclo concluído sem falhas e recente · `degraded` último ciclo com falhas ·
`offline` nenhum ciclo há mais de 2 minutos durante a apuração · `idle` sem coleta (rodada
encerrada, replay concluído ou nunca iniciada).

## Cache

| Dado | Onde | Validade |
| --- | --- | --- |
| Estado atual (visão geral, estados, resultados…) | memória da API, por rodada | até o próximo NOTIFY da rodada; `CACHE_TTL_SECONDS` (10 s) como rede de segurança |
| Mesmas respostas na borda | `Cache-Control: public, max-age=5, stale-while-revalidate=30` | CDN/proxy à frente da API absorve picos |
| Lista de eleições | memória + `max-age=15` | invalidada em qualquer evento |
| `/api/meta` | `max-age=300` | muda só com deploy |
| Operações e eventos | memória (até NOTIFY), `no-cache` para o navegador | — |
| Cores de candidatos | memória, vida do processo | calculadas uma vez para não trocarem no meio da apuração |
| Histórico | PostgreSQL, sob demanda | nunca enviado inteiro ao navegador (séries reduzidas a ≤ 300 pontos) |

Requisições simultâneas para a mesma chave compartilham uma única consulta ao banco.

## Frontend

Páginas renderizam no servidor com os dados iniciais (primeira pintura útil) e hidratam com
TanStack Query. Um `EventSource` por rodada invalida as consultas daquela rodada (com atraso de
800 ms para agrupar os eventos de um ciclo). Sem SSE, a revalidação periódica (60 s) mantém a tela
viva. Offline, a tela avisa e mantém os últimos dados.
