# Arquitetura — Eleições Brasil

Plataforma de acompanhamento da totalização das eleições brasileiras, construída para durar
vários ciclos eleitorais (2026 → 2030 → 2034 → eleições municipais) usando **exclusivamente
dados públicos oficiais do TSE**.

Este documento é a visão geral. Detalhes de cada área:

| Tema | Documento |
| --- | --- |
| Fluxos em tempo de execução, polling, cache, falhas | [docs/architecture.md](docs/architecture.md) |
| Arquivos do TSE (EA10–EA20) e o adapter | [docs/tse-integration.md](docs/tse-integration.md) |
| Modelo de dados e estratégia de snapshots | [docs/data-model.md](docs/data-model.md) |
| Tempo real (SSE) | [docs/realtime.md](docs/realtime.md) |
| Deploy | [docs/deployment.md](docs/deployment.md) |
| Como adicionar 2030 | [docs/adding-new-election.md](docs/adding-new-election.md) |
| Decisões (ADRs) | [docs/adr/](docs/adr) |

## 1. Princípios

1. **O navegador nunca fala com o TSE.** Só o worker consulta o TSE. Usuários consultam só a
   nossa API. Isso protege o TSE (limite de 100 req/s por IP) e isola a interface de mudanças
   de formato.
2. **O formato do TSE mora em um único lugar.** Apenas `packages/tse-client` conhece os campos
   brutos (`cdabr`, `pvapn`, `tvtn`...). O resto do sistema fala o modelo de domínio de
   `packages/election-core`.
3. **Uma eleição nova é dado novo, não código novo.** Nenhuma tabela ou componente tem ano no
   nome. Só adapters têm ano (`TSEAdapter2026`).
4. **Nunca inventar dado.** Indisponível é `null`, não `0`. Granularidade que a fonte não
   oferece não aparece.
5. **Falhar mantendo o último dado bom.** Erro do TSE nunca apaga resultado; a UI mostra
   “dados atrasados” com o horário da última atualização bem-sucedida.
6. **Pragmático.** Cada peça existe porque um requisito concreto precisa dela.

## 2. Visão geral

```
                ┌──────────────────────────── infraestrutura nossa ───────────────────────────┐
 TSE CDN        │                                                                             │
 resultados.    │  apps/worker                    PostgreSQL                 apps/api          │   Navegador
 tse.jus.br ───►│  Collector ─► TSEAdapter2026 ─► (estado atual +  ──NOTIFY─► Fastify ──SSE───┼──► apps/web
 (JSON EA1x/20) │  (polling    (Zod + normaliza)   snapshots +               REST + cache     │   (Next.js,
                │   inteligente)                   eventos)                  em memória       │    PWA)
                └─────────────────────────────────────────────────────────────────────────────┘
```

Fluxo: `TSE → Collector → Adapter/Normalizer → PostgreSQL → API → SSE → Browser`.

### Aplicações

| App | Papel |
| --- | --- |
| `apps/worker` | Collector (polling inteligente), motor de replay, servidor TSE fictício do modo demo. |
| `apps/api` | API REST read-only + SSE. Escuta `NOTIFY` do Postgres, invalida cache, repassa eventos. |
| `apps/web` | Next.js (App Router). Dashboard nacional, estados, municípios, operações, timeline, comparação. |

### Pacotes

| Pacote | Conteúdo | Depende de |
| --- | --- | --- |
| `@eleicoes/config` | Leitura/validação de variáveis de ambiente (Zod), feature flags, versões. | — |
| `@eleicoes/election-core` | Modelo de domínio, contratos da API, interface `ElectionProvider`, cálculos (diferenças, pp, qualidade de dados), UFs, cores de candidatos. Puro TypeScript, sem I/O. | zod |
| `@eleicoes/tse-client` | Cliente HTTP (rate limit, concorrência, retry, backoff, jitter, circuit breaker, ETag/304), schemas Zod dos arquivos TSE, `TSEAdapter2026`, registro de adapters. | core, config |
| `@eleicoes/database` | Schema Drizzle, migrações, repositórios. | core |

Pacotes sugeridos no briefing que **não** foram criados, por enquanto: `ui` (só existe um
consumidor de UI, o `web`), `utils` (evita “gaveta de bagunça”; utilidades vivem no pacote
que as usa) e `schemas` (os contratos da API vivem em `election-core/contracts`, compartilhados
por `api` e `web`). Ver [ADR 001](docs/adr/001-monorepo.md).

## 3. Abstração de provedor

```ts
interface ElectionProvider {
  readonly id: string;              // "tse-2026"
  readonly version: string;         // "2026-v1"
  getElectionConfig(): Promise<ElectionConfig>;
  getCountryProgress(): Promise<Fetched<CountryProgress>>;   // EA14
  getStateProgress(uf: StateCode): Promise<Fetched<StateProgress>>; // EA15
  getResult(q: ResultQuery): Promise<Fetched<AreaResult>>;   // EA20 (br/uf/município/zona)
  getSections(uf: StateCode): Promise<Fetched<SectionConfig>>; // EA16
}
```

`Fetched<T>` é `{ changed: true, data, provenance }` ou `{ changed: false }` (HTTP 304). O
collector não sabe nada de URL, JSON ou vírgula decimal. Um adapter novo (2030) implementa a
mesma interface. Ver [ADR 002](docs/adr/002-election-provider-abstraction.md).

## 4. Dados e snapshots (resumo)

- **Estado atual**: uma linha por (turno, cargo, área) em `area_results` e por (turno, área) em
  `area_progress`. Leitura rápida, upsert a cada mudança.
- **Histórico**: *snapshots por mudança*. Uma linha nova só quando o arquivo de origem mudou
  (dedupe por `idg`/hash). Cada linha é o estado completo daquele recorte (não delta), então
  “como estava às 19:32” é um `DISTINCT ON (área) … WHERE captured_at <= 19:32`.
- Votos por candidato no histórico: sempre para Brasil e UFs; para municípios, só cargos
  majoritários (deputados por município ficam só no estado atual). Isso limita o volume a
  centenas de milhares de linhas por eleição, não dezenas de milhões.

Detalhes e números em [docs/data-model.md](docs/data-model.md) e
[ADR 004](docs/adr/004-snapshot-strategy.md).

## 5. Tempo real

Worker grava e executa `NOTIFY election_events, '<json>'`. A API mantém uma conexão `LISTEN`,
invalida o cache daquele turno e repassa o evento via **SSE** para clientes inscritos em
`GET /api/realtime/elections/:roundId`. O web aplica os eventos no cache do TanStack Query.
Sem Redis, sem broker: o Postgres já é o ponto de verdade. Ver
[ADR 003](docs/adr/003-sse-over-websocket.md) e [ADR 006](docs/adr/006-cache-without-redis.md).

## 6. Modos de execução

| Modo | Origem dos dados |
| --- | --- |
| `PRODUCTION` | `https://resultados.tse.jus.br/oficial` |
| `SIMULATION` | `https://resultados-sim.tse.jus.br/simulado` (simulados oficiais) |
| `DEVELOPMENT` | Servidor TSE fictício local (`fixtures/election-demo`), mesmo formato oficial |
| `REPLAY` | Snapshots já gravados no banco, reemitidos com fator de velocidade |

No modo demo o pipeline inteiro é real: o collector consulta um servidor local que gera
arquivos no formato EA14/EA15/EA20 com candidatos **claramente fictícios**. Assim o adapter é
exercitado de verdade sem depender do dia da eleição.

## 7. Versionamento

- Aplicação: SemVer em `package.json` da raiz (`Eleições Brasil v1.x`).
- Adapter: `TSEAdapter2026.version = "2026-v1"`, gravado em cada snapshot (`provenance.adapter`).
- Ambos aparecem no rodapé e em `/api/health`.

## 8. Segurança e operação

API read-only, sem autenticação na V1. Helmet (headers + CSP), CORS restrito, rate limit por IP,
validação Zod de todo parâmetro, SQL só via Drizzle (parametrizado), logs Pino sem dados
pessoais. Cada ciclo do collector tem `cycleId` nos logs. Métricas de ingestão (requisições,
200/304/erros, latência média e p95) ficam em `collector_cycles` e alimentam `/operations`.
