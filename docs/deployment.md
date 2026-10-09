# Deploy

Um Postgres e três processos: site estático, API e worker. Nada depende de um provedor
específico.

Em uso hoje: **site** no GitHub Pages (workflow `pages.yml`, variáveis de repositório
`NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_BASE_PATH`); **api** (2 instâncias), **worker** (sempre uma
única instância) e **Postgres** no Railway, cada serviço com o `Dockerfile` da raiz e a variável
`APP`.

## Imagens

```bash
docker build --build-arg APP=api -t eleicoes-api .
docker build --build-arg APP=worker -t eleicoes-worker .
docker build --target web --build-arg NEXT_PUBLIC_API_URL=https://api-production-39d40.up.railway.app -t eleicoes-web .
```

API e worker são um único arquivo JavaScript cada (todas as dependências embutidas); o web é a
exportação estática do Next servida por nginx. O worker aplica as migrações ao iniciar.

## Variáveis por serviço

- **worker**: `DATABASE_URL`, `APP_MODE`, `ELECTION_ROUND`, `TSE_*`. Não expõe porta.
- **api**: `DATABASE_URL`, `CORS_ORIGINS` (ex.: `https://eleicoes.lucianookdp.dev`), `PORT`.
- **web**: `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_BASE_PATH` (no build).

## Noite da eleição

1. Um dia antes: `APP_MODE=PRODUCTION`, `ELECTION_ROUND=2026-1`; o worker já sincroniza a
   configuração (tudo com zero votos antes das 17h).
2. `TSE_REQUESTS_PER_SECOND=40` e `TSE_POLL_INTERVAL=5` (o limite do TSE é 100/s por IP, e
   respostas 304 também contam; o IP de saída pode ser compartilhado com outros clientes do
   provedor, por isso a margem). Nunca rode dois coletores com o mesmo IP. Dois coletores da
   mesma rodada não rodam juntos: num deploy, o novo espera o antigo sair (log `another collector
   is running this round, or the database is down; waiting`).
3. Se a coleta municipal atrasar demais, `CITY_RESULT_OFFICES=majoritarian` reduz o volume à
   metade sem afetar Brasil e UFs.
4. Coloque um CDN à frente da API (Cloudflare, por exemplo). URLs com `?v=` já saem com
   `s-maxage=3600` quando seguras; as demais com 3 s. O caminho `/api/realtime/*` deve passar
   sem buffer e sem cache (`X-Accel-Buffering: no` já é enviado). Uma instância aguenta
   ~30 mil req/s de respostas em cache (medido em 05/10: 24–38 mil/s; busca sem cache ~3 mil/s com os índices de trigramas) e milhares de conexões ao vivo; com CDN, a origem recebe
   poucas requisições por atualização.
5. Acompanhe a página **Bastidores** (`/eleicao/bastidores/?e=2026&t=1`).

## 2º turno (25/10)

1. Assim que o TSE publicar o 2º turno no `ele-c.json` (um pleito de 25/10/2026 com `t: "2"`):
   `ELECTION_ROUND=2026-2` no worker (`railway variable set … --skip-deploys` e depois
   `railway up --service worker`). Antes disso o worker só espera ("waiting"), sem erro.
2. O 1º turno fica guardado, encerrado; os links com `t=1` continuam funcionando, e as Bancadas
   sempre leem o 1º turno.
3. O site abre no 2º turno a partir da meia-noite (Brasília) do dia 25, mesmo antes da apuração.
4. Depois de 100%, o worker reconfere Brasil e estados a cada ciclo por 30 minutos: é quando o
   TSE marca o "Eleito" (aparece o aviso de vencedor).
5. Arquivos que "voltam no tempo" (mais de 1 ponto a menos de urnas apuradas) são ignorados e
   registrados no log como `going back ignored`.
6. Ensaio completo com dados fictícios: `DEMO_EMBEDDED=true ELECTION_ROUND=demo-2 DEMO_ROUND=2
   DEMO_DURATION_MINUTES=3` no worker local.

## Plano B (emergências)

Congelamento: de 23/10 (depois do ensaio geral) a 26/10, nada é publicado salvo emergência.
Em qualquer problema, o site continua mostrando os últimos dados bons e avisa "Dados atrasados"
ou "Sem conexão"; nada aqui apaga dados.

| Sintoma | O que fazer |
| --- | --- |
| O worker grava algo errado ou entra em loop de erros | Parar a coleta: `railway down --service worker` (o site congela nos últimos números, com aviso de atraso). Corrigir, e `railway up --service worker --detach` para voltar. |
| Um deploy novo quebrou a API ou o worker | No painel do Railway, serviço → Deployments → no deploy anterior, "Redeploy". Ou `git revert <commit>` e `railway up --service <api\|worker> --detach`. |
| O site (GitHub Pages) quebrou depois de um push | `git revert <commit> && git push`: o Pages publica a versão anterior em ~1 min. |
| Leitores veem números velhos depois de uma correção | Limpar o CDN da API: `railway cdn purge all --service api`. |
| O TSE fora do ar ou lento | Nada a fazer: o worker reduz o ritmo sozinho (circuito/backoff) e volta quando o TSE voltar. Acompanhar em `/eleicao/bastidores/`. |
| O TSE muda o formato dos arquivos | O worker rejeita o arquivo (validação Zod) e mantém o último dado bom; ver `railway logs --service worker` e ajustar o adaptador em `packages/tse-client`. |
| Banco corrompido ou dados perdidos | Restaurar o backup mais recente de `~/eleicoes-backups` (feito em 24/10) num Postgres 18 novo do Railway: `pg_restore --no-owner --no-acl -d <novo banco> <arquivo>`, depois apontar `DATABASE_URL` da API e do worker para ele. Ferramentas do Postgres 18 em `.data/pg18/bin` (micromamba, como abaixo, com `postgresql=18`). |
| Tráfego muito acima do esperado | O CDN segura as leituras; se a API sofrer, aumentar as réplicas da API no painel do Railway (hoje 2). |

Vigilância automática: o workflow `health` confere o site e a API de hora em hora, e a cada
5 minutos no dia 25/10 a partir das 16h (Brasília), incluindo coleta recente e o resultado do
2º turno respondendo rápido. Uma falha manda e-mail do GitHub; não há alerta no celular.

## Postgres local sem Docker

Qualquer Postgres 16 serve. Em macOS sem Docker, por exemplo:

```bash
micromamba create -p .data/pgenv -c conda-forge postgresql=16
.data/pgenv/bin/initdb -D .data/pgdata -U postgres --auth=trust
.data/pgenv/bin/pg_ctl -D .data/pgdata -o "-p 55433" start
```

Para os testes de integração da API: `TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55433/eleicoes_test pnpm test`.
