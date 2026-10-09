# Arquitetura

```
 resultados.tse.jus.br          nossa infraestrutura                                  navegador
 (arquivos JSON) ──► worker ──► TSEAdapter2026 ──► PostgreSQL ──NOTIFY──► API ──SSE──► site
                     coleta      valida (Zod)       estado atual,          REST + cache
                                 e normaliza        histórico, eventos     em memória
```

## Princípios

1. **O navegador nunca fala com o TSE.** Só o worker consulta o TSE; o público lê a nossa API.
   Isso respeita o limite do TSE (100 requisições/s por IP) e isola o site de mudanças de formato.
2. **O formato do TSE mora em um só lugar.** Apenas `packages/tse-client` conhece os campos
   brutos dos arquivos. O resto do sistema usa o modelo de `packages/election-core`.
3. **Eleição nova é dado novo, não código novo.** Nenhuma tabela ou tela tem ano no nome; só os
   adapters (`TSEAdapter2026`).
4. **Nunca inventar dado.** Indisponível é `null` (“—” na tela), nunca zero.
5. **Falhar mantendo o último dado bom.** Erro do TSE nunca apaga resultado; o site avisa
   “dados atrasados” com o horário da última atualização.

## Coleta: dois ritmos

O worker divide o limite de requisições entre dois trabalhos.

**Ciclo rápido**, a cada `TSE_POLL_INTERVAL` (5 s), com prioridade alta:

1. `ele-c.json` (configuração; sincroniza cargos e municípios na primeira vez);
2. andamento do Brasil (EA14), que indica quais estados mudaram;
3. resultados do Brasil e dos cargos majoritários desses estados (Presidente, depois Governador
   e Senador);
4. andamento dos estados que mudaram (EA15) vai para a fila de fundo.

Cada dado é gravado e anunciado (`NOTIFY`) na hora, sem esperar o fim do ciclo.

**Fila de fundo**, contínua e de prioridade baixa: municípios que mudaram, fotos, deputados,
capitais e demais municípios. Pedidos repetidos para o mesmo arquivo se fundem. A cada ~5 minutos
uma reconciliação revisita Brasil e estados, porque o TSE gera os arquivos em paralelo.

**Cliente HTTP** (um por processo): concorrência limitada → limite de taxa global → requisição
condicional (ETag/304) com timeout.

| Resposta | Ação |
| --- | --- |
| 304 | sem mudança |
| 404 | sem nova tentativa; mais de 30 por minuto pausam a coleta por 5 min (404 em excesso pode bloquear o IP) |
| 403 / 429 | pausa de 11 min (o bloqueio do TSE recomeça a cada nova tentativa) |
| 5xx, timeout | novas tentativas com espera exponencial e aleatória; falhas seguidas pausam a coleta |

## Tempo real

```
worker ──NOTIFY──► PostgreSQL ──LISTEN──► API ──SSE──► navegador
                                           └─ invalida o cache da rodada
```

- `GET /api/realtime/elections/:roundId` envia, a cada 500 ms, um quadro `batch` com os eventos
  agrupados (`country.updated`, `state.updated`, `city.updated`, `result.updated`,
  `ingestion.status`) e a versão dos dados.
- O navegador espera 0,25–1,25 s aleatórios e então busca de novo só o que está na tela, com
  `?v=<versão>` na URL. Assim milhares de leitores não chegam no mesmo milissegundo e todos pedem
  a mesma URL, que um CDN pode responder.
- Sem conexão ao vivo, a tela revalida a cada 60 s; offline, avisa e mantém os últimos dados.

## Muitos leitores

- Cada resposta é serializada e comprimida (Brotli/gzip) **uma vez por atualização**, com ETag.
- Cache em memória por rodada, invalidado pelo `NOTIFY` (sem Redis: o Postgres é a fonte da
  verdade). Várias instâncias da API funcionam lado a lado, cada uma com o seu `LISTEN`.
- Limite por IP generoso (6.000/min) e a conexão ao vivo fora dele, porque operadoras móveis
  colocam milhares de pessoas atrás do mesmo IP.

**Medido** (notebook Apple Silicon, simulação no pior caso, coleta a 20 req/s):

| O quê | Resultado |
| --- | --- |
| Arquivo gerado na fonte → gravado no banco (Presidente, Brasil) | média 3,8 s, máx. 5,7 s |
| `NOTIFY` → primeiro navegador | ~90 ms |
| 2.273 conexões ao vivo: diferença entre o primeiro e o último a receber | média 42 ms, máx. 94 ms |
| API, `/overview` comprimido, 200 conexões | 30.247 req/s por processo, p99 13 ms |

## Dados

Uma estrutura serve a todas as eleições ([schema.ts](../packages/database/src/schema.ts)).

| Tabela | Conteúdo |
| --- | --- |
| `elections`, `election_rounds` | eleição e turno (`2026-1`): data, status, adapter, ambiente |
| `offices`, `parties`, `candidates` | cargos, partidos e candidatos da rodada |
| `cities` | municípios (código TSE, IBGE, capital, zonas), compartilhados entre eleições |
| `area_progress`, `area_results` | estado atual por área e por cargo |
| `progress_snapshots`, `result_snapshots` | histórico da apuração |
| `ingestion_events`, `collector_cycles` | atualizações recentes e métricas da coleta |
| `candidate_photos` | fotos oficiais, baixadas uma vez |

- Áreas têm chave estável: `br`, `sp`, `sp-71072`.
- **Histórico por mudança**: uma linha nova só quando o arquivo de origem mudou, sempre com o
  estado completo (não delta). “Como estava às 19h32” é um `DISTINCT ON (area_key) … WHERE
  captured_at <= '19:32'`. Para municípios, o histórico de candidatos guarda só cargos
  majoritários, o que mantém a eleição em centenas de milhares de linhas.
- Cada resultado guarda a **proveniência**: arquivo de origem, versão do adapter, horário de
  recebimento e de geração no TSE, ETag e hash.
- Horários em UTC no banco; o TSE publica horário de Brasília, convertido pelo adapter.
- O worker aplica as migrações (`packages/database/drizzle`) ao iniciar.

## Falhas

| Situação | Comportamento |
| --- | --- |
| Arquivo fora do formato esperado | evento `source.schema`; ciclo marcado como instável; os demais arquivos seguem |
| TSE fora do ar | nada é apagado; o site mostra “dados atrasados” com o horário do último sucesso |
| Números incoerentes (seções > total…) | gravados como publicados, com evento `quality.issue` |
| Banco fora do ar | o ciclo falha e o próximo baixa tudo de novo; a API serve a última resposta boa, com cache curto (`x-data-stale: 1`), para o CDN não guardá-la |
| Dois coletores da mesma rodada (deploy sobreposto) | o segundo espera o primeiro sair (advisory lock no Postgres) |

## Modo de desenvolvimento

`apps/worker/src/demo` é um servidor local que gera arquivos no formato oficial (EA11, EA12,
EA14, EA15, EA20) para uma eleição **fictícia**, apurada de 0 a 100%. O pipeline inteiro roda de
verdade, sem depender do dia da eleição; o teste `demo-adapter.test.ts` garante que o servidor e
o adapter concordam.
