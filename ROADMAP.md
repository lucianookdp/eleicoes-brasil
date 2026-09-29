# Roadmap

Datas que guiam a V1:

- **29/09/2026, 15h–17h (BRT)** — último simulado oficial do TSE (`resultados-sim.tse.jus.br`).
  Única chance de validar o adapter contra arquivos reais antes da eleição.
- **04/10/2026** — 1º turno (pleito 3220; eleições 6257 federal, 6259 estadual, 6261 conselho distrital).
- **25/10/2026** — 2º turno (códigos publicados no `ele-c.json`).

Legenda: ✅ feito · 🟡 em andamento · ⬜ pendente

## Phase 0 — Foundation 🟡
- Monorepo pnpm + Turborepo, TypeScript estrito, Biome (lint + format)
- Pacotes `config`, `election-core`, `tse-client`, `database`
- Docker Compose (Postgres + api + worker + web), Dockerfiles
- GitHub Actions: lint → typecheck → test → build

## Phase 1 — TSE Integration ⬜
- Cliente HTTP: rate limiter, limite de concorrência, timeout, retry com backoff + jitter,
  circuit breaker, ETag/Last-Modified → 304
- Schemas Zod de EA11, EA12, EA14, EA15, EA16, EA20 (tolerantes a campos novos)
- `TSEAdapter2026` + registro de adapters
- Números em texto (`"123"`, `"48,43"`) normalizados; datas BRT → UTC

## Phase 2 — Election Core ⬜
- Entidades de domínio, contratos da API, UFs, cores de candidatos
- Schema do banco, migrações, repositórios

## Phase 3 — Collector ⬜
- Polling inteligente EA14 → EA15 → EA20 só do que mudou
- Snapshots por mudança, eventos de atividade, métricas por ciclo
- Ingestão degradada sem derrubar o worker

## Phase 4 — API ⬜
- REST (`/api/elections/...`), SSE, cache em memória invalidado por `NOTIFY`
- Helmet, CORS, rate limit, validação

## Phase 5 — UI ⬜
- Nacional (overview, candidatos, mapa, tabela de estados), estado, município, busca, favoritos
- Mobile-first com navegação inferior, PWA

## Phase 6 — Operations ⬜
- Live activity, taxa de processamento, ingestão (200/304/erros, p95), frescor por UF, saúde do worker, heatmap

## Phase 7 — Historical ⬜
- Timeline (“como estava às 19:32?”), gráfico de evolução, `pnpm replay --speed 10`

## Phase 8 — Production Hardening ⬜
- ⬜ Testes unitários (parsers, adapter, cálculos), integração (API), E2E Playwright
- ⬜ Validar adapter no simulado de 29/09 e ajustar schemas
- ⬜ Deploy (Railway/Fly para api+worker, Vercel para web, Neon para Postgres)
- ⬜ Subdomínio `election.lucianookdp.dev`

## Phase 9 — Eleições passadas ⬜
- Importador de resultados finais a partir do Portal de Dados Abertos do TSE
  (`votacao_candidato_munzona_<ano>`, `detalhe_votacao_munzona_<ano>`), gerando um snapshot
  final por área. Alvo: 2022, 2018 (gerais) e 2024, 2020 (municipais).
- Seletor de eleição no header; comparação entre anos.

## Phase 10 — Granularidade fina ⬜
- Resultados por zona eleitoral (arquivos EA20 de zona, coletados após totalização do município)
- Lista de seções (EA16) e situação (EA18), atrás de `ENABLE_SECTIONS_VIEW`
- Fotos de candidatos majoritários (servidas pela nossa API, nunca direto do TSE)

## Riscos

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Formato real diferente da documentação | Adapter rejeita payload | Schemas tolerantes (`passthrough`), números aceitam texto ou número, erro registrado com contexto e ingestão marcada degradada; validação no simulado de 29/09 |
| Bloqueio de IP (100 req/s, 404s repetidos) | Coleta para por 10 min+ | Rate limit global configurável (padrão 20 req/s), URLs só a partir de códigos do `ele-c.json`/`mun-cm.json` (nunca adivinhadas), circuit breaker |
| Volume de arquivos municipais (~5.570 municípios × 5 cargos) | Atraso na coleta | Só busca municípios com `dt/ht` alterado no EA15; fila com coalescência; cargos proporcionais municipais configuráveis |
| Volume de histórico | Banco caro | Snapshot só na mudança; votos por candidato no histórico municipal só para majoritários |
| Pico de acesso na noite da eleição | API lenta | Cache em memória + `Cache-Control` curto com `stale-while-revalidate` para CDN; SSE com payload pequeno |
| TSE fora do ar | Tela vazia | Último dado bom sempre mantido; UI mostra “dados atrasados” |
| Hospedagem com IP compartilhado | Bloqueio por vizinhos | Documentado; preferir provedor com IP de saída dedicado se possível |
