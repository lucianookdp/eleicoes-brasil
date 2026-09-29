# Eleições Brasil

Acompanhamento em tempo real da apuração das eleições brasileiras, usando **exclusivamente os
dados públicos oficiais do Tribunal Superior Eleitoral (TSE)**.

Mais do que reproduzir a página de resultados: além dos votos, mostra a evolução da
totalização — ritmo da apuração, o que mudou entre atualizações, frescor dos dados por estado e
a saúde da própria coleta — e guarda tudo para rever depois (“como estava às 19:32?”).

> Projeto independente. Não é um serviço oficial da Justiça Eleitoral. Resultados parciais
> refletem apenas as seções totalizadas e podem mudar até o fim da apuração.

<!-- Screenshots: docs/screenshots/ (adicionar após a primeira eleição acompanhada). -->

## O que tem

- **Visão geral**: percentual apurado, faixa de apuração por estado, candidatos com variação desde
  a última atualização, mapa (apuração ou mais votado), estados, evolução e atividade em abas.
- **Estado** e **município**: todos os cargos, candidatos ou partidos, evolução, municípios com
  busca, ordenação e paginação, zonas eleitorais.
- **Ao vivo**: ritmo (seções/votos por minuto), mapa de calor por estado, log de atualizações,
  requisições ao TSE (200/304/erros, latência média e p95), frescor por área, saúde do coletor.
- **Histórico**: linha do tempo com reprodução, “como estava às…”, evolução completa.
- **Comparar estados**, **busca global** (Ctrl/⌘ K), **favoritos** locais, **PWA** instalável.
- **Tempo real** via Server-Sent Events; claro/escuro; mobile first.

## Arquitetura em uma linha

`TSE → Collector → TSEAdapter2026 (Zod) → PostgreSQL → API (Fastify) → SSE → Next.js`

O navegador nunca acessa o TSE. Detalhes em [ARCHITECTURE.md](ARCHITECTURE.md) e em
[docs/](docs). Decisões registradas em [docs/adr](docs/adr). Plano em [ROADMAP.md](ROADMAP.md).

```
apps/
  web/        Next.js (App Router, Tailwind, TanStack Query)
  api/        Fastify: REST + SSE, cache invalidado por NOTIFY
  worker/     coletor, replay, servidor TSE fictício (demo)
packages/
  config/          variáveis de ambiente (Zod), feature flags, versão
  election-core/   modelo de domínio, contratos da API, ElectionProvider, cálculos, registro de eleições
  tse-client/      cliente HTTP do TSE, schemas dos arquivos, TSEAdapter2026
  database/        schema Drizzle e migrações
fixtures/election-demo/   eleição fictícia usada no modo demo
```

## Como executar

Requisitos: Node 22+, pnpm 12, PostgreSQL 16 (ou Docker).

### Tudo em Docker

```bash
docker compose up --build
```

Abre em http://localhost:3000 com a **eleição demonstrativa** (candidatos e partidos fictícios),
apurada do zero a 100% em 30 minutos.

### Desenvolvimento (modo demo)

```bash
pnpm install
docker compose up -d postgres
pnpm dev:demo
```

`dev:demo` sobe o servidor TSE fictício, o coletor, a API e o web com recarga automática.
Aponte `DATABASE_URL` para outro Postgres se preferir.

### Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev:demo` | pilha completa com dados fictícios |
| `pnpm lint` / `pnpm format` | Biome |
| `pnpm typecheck` | TypeScript em todos os pacotes |
| `pnpm test` | unitários e integração (defina `TEST_DATABASE_URL` para os testes da API) |
| `pnpm test:e2e` | Playwright (desktop e mobile) contra a pilha demo rodando |
| `pnpm build` | build de produção de tudo |
| `pnpm db:migrate` | aplica migrações |
| `pnpm replay --election 2026-1 --speed 10` | reproduz uma apuração gravada |

## Modos de execução

Definidos por `APP_MODE` no worker. A eleição acompanhada é `ELECTION_ROUND`
(ver [registry.ts](packages/election-core/src/registry.ts)).

| Modo | Fonte | Exemplo |
| --- | --- | --- |
| `DEVELOPMENT` | servidor TSE fictício local | `APP_MODE=DEVELOPMENT ELECTION_ROUND=demo-1` |
| `SIMULATION` | simulados oficiais do TSE (`resultados-sim.tse.jus.br`) | `APP_MODE=SIMULATION ELECTION_ROUND=2026-1` |
| `PRODUCTION` | resultados oficiais (`resultados.tse.jus.br`) | `APP_MODE=PRODUCTION ELECTION_ROUND=2026-1` |
| `REPLAY` | snapshots já gravados no banco | `APP_MODE=REPLAY ELECTION_ROUND=2026-1 REPLAY_SPEED=10` |

O replay grava em uma rodada separada (`replay-2026-1`), que aparece no seletor de eleições como
se estivesse ao vivo. Nada na interface é específico de replay.

## Variáveis de ambiente

Todas estão comentadas em [.env.example](.env.example) e validadas com Zod em
[packages/config](packages/config/src/index.ts). As principais:

| Variável | Padrão | Notas |
| --- | --- | --- |
| `DATABASE_URL` | — | Postgres |
| `APP_MODE` | `DEVELOPMENT` | ver tabela acima |
| `ELECTION_ROUND` | `demo-1` | rodada do registro |
| `TSE_REQUESTS_PER_SECOND` | `20` | o TSE permite 100/s por IP e bloqueia por 10 min acima disso |
| `TSE_CONCURRENCY` | `8` | requisições simultâneas |
| `TSE_POLL_INTERVAL` | `15` | segundos entre ciclos |
| `COLLECT_CITY_RESULTS` / `CITY_RESULT_OFFICES` | `true` / `all` | resultados por município (a maior parte do volume) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL pública da API (entra no build do web) |
| `ENABLE_*` | — | feature flags (seções, replay, operações avançadas, comparação) |

## Como funciona o `TSEProvider`

A interface `ElectionProvider` ([provider.ts](packages/election-core/src/provider.ts)) é o único
contrato que o coletor conhece. `TSEAdapter2026`
([adapter-2026.ts](packages/tse-client/src/adapter-2026.ts)) é a única parte do sistema que
entende os arquivos do TSE: monta as URLs a partir do `ele-c.json`, valida cada resposta com Zod,
converte números em texto (`"48,32"`) e horários de Brasília para UTC, e devolve o modelo de
domínio. Mudança de formato do TSE = mudança só no adapter. Ver
[docs/tse-integration.md](docs/tse-integration.md).

## Nova eleição (2030, municipais…)

Resumo: conferir a documentação nova do TSE → ajustar schemas → criar `TSEAdapter2030` se o
formato mudou → adicionar a rodada ao registro → rodar os testes e o simulado. Passo a passo em
[docs/adding-new-election.md](docs/adding-new-election.md).

## Versionamento

A aplicação segue SemVer (`Eleições Brasil v1.x`). O adapter tem versão própria
(`tse-2026@2026-v1`), gravada em cada snapshot e exibida no rodapé e em `/api/health`.

## Licença e créditos

MIT. Geometria do mapa: “Map of Brazil” de Victor Cazanave
([svg-maps](https://github.com/VictorCazanave/svg-maps)), CC BY 4.0. Dados: Tribunal Superior
Eleitoral.
