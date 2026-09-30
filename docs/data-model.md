# Modelo de dados

Uma única estrutura serve a todas as eleições. Uma eleição nova é linhas novas, nunca tabelas
novas. Schema completo em [schema.ts](../packages/database/src/schema.ts).

## Entidades

```
elections ──< election_rounds ──< offices ──< candidates
                     │                 └────< area_results ──< (result_snapshots)
                     ├──< parties
                     ├──< area_progress ──< (progress_snapshots)
                     ├──< ingestion_events
                     └──< collector_cycles
cities (compartilhada entre eleições; código TSE é estável)
```

| Tabela | Conteúdo | Chave |
| --- | --- | --- |
| `elections` | eleição (ex.: “Eleições Gerais 2026”) | UUID, `slug` único |
| `election_rounds` | turno: data, status, provedor, `provider_id` (pleito), adapter e versão, ambiente | UUID, `slug` (`2026-1`) |
| `offices` | cargos da rodada com código do provedor, tipo (majoritário/proporcional) e abrangência | UUID, (`round`, `slug`) |
| `cities` | municípios: código TSE (5 dígitos), IBGE, nome, capital, zonas | UUID, (`provider`, `uf`, `provider_id`) |
| `parties`, `candidates` | listas pesquisáveis, com `provider_id` (`sqcand`) | (`round`, …) |
| `area_progress` | andamento atual por área | (`round`, `area_key`) |
| `area_results` | resultado atual por cargo e área, como documento JSONB + proveniência | (`round`, `office`, `area_key`) |
| `progress_snapshots`, `result_snapshots` | histórico | `bigserial` |
| `ingestion_events` | feed de atividade + log de ingestão | `bigserial` |
| `collector_cycles` | métricas de cada ciclo | UUID (`cycleId`) |
| `candidate_photos` | fotos oficiais de candidatos majoritários (bytes), baixadas uma vez; linha sem dados = sem foto na fonte | (`round`, `candidate_key`) |

`area_key` é uma chave estável: `br`, `sp`, `sp-71072`, `sp-71072-z0001`. Nomes nunca são chave.
Estados (26 + DF + exterior) são dados estáticos em código (`election-core/geo.ts`), não tabela.

## Estratégia de snapshots

Escolha: **snapshot completo por mudança** (ver [ADR 004](adr/004-snapshot-strategy.md)).

- Uma linha nova só quando o arquivo de origem mudou (comparação por checksum/assinatura).
- Cada linha é o estado completo daquele recorte, não um delta. Ler “como estava às 19:32” é
  `DISTINCT ON (area_key) … WHERE captured_at <= '19:32' ORDER BY area_key, captured_at DESC`,
  sem reconstruir cadeias de deltas.
- Candidatos no histórico em formato compacto: `[[sqcand, votos, percentual], …]`.
- **Brasil e UFs**: histórico completo de candidatos. **Municípios**: histórico de candidatos só
  para cargos majoritários; para deputados por município guardamos só totais (o estado atual
  continua completo).
- `area_results.previous_candidates` guarda a versão anterior, para calcular a variação sem ler o
  histórico.

Ordem de grandeza para uma eleição geral (≈ 5.570 municípios, ≈ 10 mudanças por área):
`progress_snapshots` ≈ 60 mil linhas; `result_snapshots` ≈ 300 mil linhas, a maioria pequena.
Cabe folgado em um Postgres gratuito/barato.

## Proveniência

Cada resultado e snapshot guarda `provenance`: provedor, adapter com versão, arquivo de origem,
`idg` do TSE (identificador da geração), horário de recebimento, horário de geração na fonte,
ETag e SHA-256 do conteúdo.

## Tempo

Tudo em UTC (`timestamptz`). O TSE publica horário de Brasília sem fuso; o adapter converte com
UTC−03:00 fixo. A apresentação usa `America/Sao_Paulo` e o fuso é parâmetro das funções de
formatação (`election-core/time.ts`).

## Migrações

`pnpm db:generate` (drizzle-kit) gera SQL versionado em `packages/database/drizzle`;
`pnpm db:migrate` aplica. O worker aplica migrações pendentes ao iniciar.
