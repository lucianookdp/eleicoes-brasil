# Tempo real

```
worker ──NOTIFY election_events──▶ PostgreSQL ──LISTEN──▶ API ──SSE──▶ navegador
                                                          │
                                                          └─ invalida o cache da rodada
```

## Endpoint

`GET /api/realtime/elections/:roundId` — `text/event-stream`. Ao conectar, o servidor envia
`retry: 5000` e um evento `ready`. Um comentário `: ping` a cada 25 s mantém proxies abertos.

## Eventos

| Tipo | Quando |
| --- | --- |
| `country.updated` | andamento do Brasil mudou |
| `state.updated` | andamento de uma UF mudou |
| `city.updated` | um ou mais municípios de uma UF mudaram (agregado por UF, não um por município) |
| `result.updated` | resultado de um cargo mudou no Brasil ou em uma UF |
| `counting.updated` | reservado para mudanças gerais de totalização |
| `ingestion.status` | fim de cada ciclo do coletor (`ok`, `degraded`, `failed`) |

Payload (sempre < 8 KB, limite do NOTIFY):

```json
{
  "type": "state.updated",
  "timestamp": "2026-10-04T23:43:12.000Z",
  "electionId": "2026-1",
  "state": "SP",
  "areaKey": "sp",
  "changes": { "sectionsAdded": 1821, "votesAdded": 512330, "countedPct": 92.31 }
}
```

## No navegador

`RealtimeProvider` ([realtime.tsx](../apps/web/lib/realtime.tsx)) abre um `EventSource` por
rodada. Cada evento marca a área como “atualizada agora” (destaque visual por 3 s) e agenda uma
invalidação das consultas TanStack Query da rodada (chaves começam com o slug). O servidor não
empurra documentos inteiros: cada tela busca só o que exibe, e o cache da API já foi invalidado.

Estados de conexão exibidos no cabeçalho: “Ao vivo”, “Reconectando”, “Offline” (com o horário da
última atualização), “Dados atrasados” (coleta degradada) e “Apuração encerrada”.

## Escala

Uma instância da API mantém milhares de conexões SSE (limite configurado em 10.000). Com várias
instâncias, cada uma faz seu próprio `LISTEN`; não há estado compartilhado a sincronizar.
