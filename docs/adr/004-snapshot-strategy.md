# ADR 004 — Snapshots completos por mudança

- Status: aceito · Data: 2026-09-29

## Contexto
Queremos reconstruir a apuração ao longo do tempo (“como estava às 19:32?”), calcular variações
e reproduzir eleições, sem gerar milhões de linhas redundantes. Alternativas: snapshot completo a
intervalos fixos, deltas, event sourcing, tabelas de série temporal.

## Decisão
- **Estado atual** em `area_progress` / `area_results` (uma linha por área, upsert).
- **Histórico** em `progress_snapshots` / `result_snapshots`: uma linha **só quando a fonte
  mudou** (checksum/assinatura), contendo o estado completo daquele recorte, não um delta.
- Candidatos no histórico em JSON compacto `[sqcand, votos, %]`; para municípios, só cargos
  majoritários (deputados por município ficam apenas no estado atual).

## Por quê
- Intervalo fixo grava cópias idênticas quando nada muda e perde mudanças entre intervalos.
- Deltas exigem reconstruir cadeias para responder “como estava às X”; estado completo por
  mudança responde com um `DISTINCT ON` indexado.
- Event sourcing completo reescreveria a lógica de agregação que o TSE já faz.
- Volume estimado para uma eleição geral: ~60 mil snapshots de andamento e ~300 mil de resultado.

## Consequências
Replay de municípios em cargos proporcionais mostra apenas o estado final. Se isso fizer falta,
basta mudar `keepCandidateHistory` no worker.
