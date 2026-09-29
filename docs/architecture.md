# Arquitetura em execução

Complementa o [ARCHITECTURE.md](../ARCHITECTURE.md) com o que acontece em tempo de execução.

## Coletor: dois ritmos

O coletor divide o limite de requisições do TSE entre dois trabalhos:

**Ciclo rápido** (a cada `TSE_POLL_INTERVAL`, padrão 5 s, em ritmo fixo; ciclos nunca se
sobrepõem). Prioridade alta no cliente HTTP.

```
1. ele-c.json (condicional)            → configuração; sincroniza cargos e municípios na 1ª vez
2. EA14 de cada eleição do pleito      → quais UFs mudaram (assinatura: status | dt/ht | seções)
3. EA20 do Brasil e dos cargos majoritários das UFs que mudaram
   (Presidente primeiro, depois Governador, depois Senador)
4. EA15 das UFs que mudaram            → vai para a fila de fundo
```

Cada dado é anunciado (`NOTIFY`) **assim que é gravado**, sem esperar o fim do ciclo.

**Fila de fundo** (contínua, prioridade baixa): leituras de EA15 (descobrem municípios que
mudaram), deputados por UF, capitais e demais municípios, nessa ordem. Itens repetidos para o
mesmo arquivo se fundem, então a fila nunca passa do número de arquivos distintos.

A cada ~5 minutos, uma **reconciliação** recoloca Brasil e UFs na fila (requisições condicionais,
quase sempre 304), porque o TSE gera os arquivos em paralelo e um EA20 pode mudar depois do EA14.

## Desempenho medido

Medições em um notebook (Apple Silicon), modo demo no **pior caso** (todos os 27 estados e
208 municípios mudando a cada 10 s), coletor a 20 req/s:

| O quê | Resultado |
| --- | --- |
| Arquivo gerado na fonte → gravado no banco, Presidente/Brasil | média 3,8 s, máx 5,7 s |
| Idem, Governador/Senador por UF | média 4,9–6,3 s |
| NOTIFY → primeiro navegador (SSE) | ~90 ms |
| 2.273 conexões SSE simultâneas: diferença entre o 1º e o último a receber | média 42 ms, máx 94 ms |
| API, `/overview` comprimido (4,5 KB), 200 conexões | 30.247 req/s por processo, p99 13 ms |

Com intervalo de 5 s, o piso teórico de detecção é ~2,5 s em média; o restante é o tempo de
buscar o arquivo. O painel **Ao vivo** mostra esse atraso em tempo real (“Atraso entre o TSE
publicar e o dado estar aqui”).

## Muitos leitores ao mesmo tempo

- **Respostas prontas**: cada resposta é serializada e comprimida (Brotli/gzip) **uma vez por
  atualização**, com ETag; revalidações sem mudança recebem 304.
- **URLs versionadas**: cada evento traz a versão dos dados; o navegador pede `…?v=<versão>`.
  Todos os leitores pedem a mesma URL, então um CDN responde quase tudo. A API só permite cache
  longo de uma versão que ela já conhece (evita guardar dado velho sob chave nova).
- **Eventos agrupados**: a API junta os eventos de cada rodada a cada 500 ms em um único quadro
  SSE, sem repetição por área.
- **Espalhamento**: cada navegador espera 0,25–1,25 s (aleatório) antes de buscar, para que
  milhares não cheguem no mesmo milissegundo.
- **Limite por IP generoso** (6.000/min) e a conexão ao vivo fora dele: operadoras móveis põem
  milhares de pessoas atrás do mesmo IP.

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
