# ADR 002 — Abstração `ElectionProvider` e adapters por formato

- Status: aceito · Data: 2026-09-29

## Contexto
O TSE altera arquivos e campos entre eleições. Espalhar nomes como `cdabr`, `pvapn` ou `tvtn`
pelo sistema tornaria cada eleição nova uma reescrita.

## Decisão
O coletor depende apenas da interface `ElectionProvider` (`election-core/provider.ts`), que
devolve o modelo de domínio (`ElectionConfig`, `CountryProgress`, `StateProgress`, `AreaResult`)
e informa `{ changed: false }` quando nada mudou. Cada formato de arquivo tem um adapter
(`TSEAdapter2026`), único lugar que conhece os campos brutos, com schemas Zod próprios. Adapters
são escolhidos por id no registro de eleições (`adapter: 'tse-2026'`).

Erros têm tipos próprios (`ProviderPayloadError`, `ProviderUnavailableError`,
`ProviderNotFoundError`) para o coletor decidir entre registrar, tentar de novo ou ignorar.

## Consequências
2030 exige, no pior caso, um adapter novo e schemas novos; API, banco e interface continuam. O
servidor demo fala o formato do TSE, então o modo demo também exercita o adapter real.
