# Eleições Brasil

Apuração das eleições brasileiras em tempo real, usando **apenas os dados públicos oficiais do
Tribunal Superior Eleitoral (TSE)**.

**No ar:** https://lucianookdp.github.io/eleicoes-brasil/

> Projeto independente, sem vínculo com a Justiça Eleitoral. Resultados parciais consideram só as
> urnas já apuradas e podem mudar até o fim da apuração.

## O que mostra

- **Resultados**: urnas apuradas no Brasil e por região, candidatos com foto e variação desde a
  última atualização, mapa, estados, evolução e atualizações recentes.
- **Estados e municípios**: todos os cargos, por candidato ou por partido.
- **Linha do tempo**: como estava a apuração em qualquer momento da noite.
- **Bastidores**: ritmo da apuração e funcionamento da coleta.
- Comparação entre estados, busca (Ctrl/⌘ K), favoritos, tema claro/escuro, instalável (PWA).

## Arquitetura

```
TSE → worker (coleta + TSEAdapter2026) → PostgreSQL → API (REST + SSE) → site
```

O navegador nunca acessa o TSE. O site é estático (GitHub Pages); API, worker e Postgres rodam
no Railway. Detalhes em [docs/architecture.md](docs/architecture.md).

```
apps/web         Next.js (exportação estática), Tailwind, TanStack Query
apps/api         Fastify: REST + Server-Sent Events, cache em memória
apps/worker      coleta do TSE, replay e servidor TSE fictício para desenvolvimento
packages/
  election-core  modelo de domínio, contratos da API, cálculos, registro de eleições
  tse-client     cliente HTTP do TSE e TSEAdapter2026 (único código que conhece os arquivos do TSE)
  database       schema Drizzle e migrações
  config         variáveis de ambiente (Zod) e feature flags
```

## Rodando localmente

Requisitos: Node 22+, pnpm 12 e PostgreSQL 16 (ou Docker).

```bash
pnpm install
docker compose up -d postgres
pnpm dev:demo
```

Abre em http://localhost:3000 com uma **eleição fictícia** no formato oficial do TSE, apurada de
0 a 100% em 30 minutos. Ou, tudo em Docker: `docker compose up --build`.

| Comando | O que faz |
| --- | --- |
| `pnpm dev:demo` | servidor TSE fictício, worker, API e site com recarga automática |
| `pnpm test` | testes unitários e de integração (`TEST_DATABASE_URL` para os da API) |
| `pnpm test:e2e` | Playwright (desktop e celular) com o `dev:demo` rodando |
| `pnpm lint` · `pnpm typecheck` · `pnpm build` | Biome, TypeScript, build |
| `pnpm replay --election 2026-1 --speed 10` | reproduz uma apuração gravada |

## Modos do worker

| `APP_MODE` | Fonte |
| --- | --- |
| `DEVELOPMENT` | servidor TSE fictício local (`ELECTION_ROUND=demo-1`) |
| `SIMULATION` | simulado oficial do TSE (`resultados-sim.tse.jus.br`) |
| `PRODUCTION` | resultados oficiais (`resultados.tse.jus.br`) |
| `REPLAY` | apuração já gravada no banco, em velocidade acelerada |

Variáveis de ambiente comentadas em [.env.example](.env.example).

## Documentação

- [Arquitetura](docs/architecture.md): coleta, tempo real, dados e desempenho medido
- [Integração com o TSE](docs/tse-integration.md): arquivos, limites de acesso e normalização
- [Deploy](docs/deployment.md): imagens, variáveis e checklist da noite da eleição
- [Nova eleição](docs/adding-new-election.md): como preparar 2030 ou uma eleição municipal

## Licença

MIT. Dados: Tribunal Superior Eleitoral. Mapa: “Map of Brazil”, de Victor Cazanave
([svg-maps](https://github.com/VictorCazanave/svg-maps)), CC BY 4.0.
