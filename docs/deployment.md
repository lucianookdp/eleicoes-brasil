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
- **api**: `DATABASE_URL`, `CORS_ORIGINS` (ex.: `https://lucianookdp.github.io`), `PORT`.
- **web**: `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_BASE_PATH` (no build).

## Noite da eleição

1. Um dia antes: `APP_MODE=PRODUCTION`, `ELECTION_ROUND=2026-1`; o worker já sincroniza a
   configuração (tudo com zero votos antes das 17h).
2. `TSE_REQUESTS_PER_SECOND=40` e `TSE_POLL_INTERVAL=5` (o limite do TSE é 100/s por IP, e
   respostas 304 também contam; o IP de saída pode ser compartilhado com outros clientes do
   provedor, por isso a margem). Nunca rode dois coletores com o mesmo IP.
3. Se a coleta municipal atrasar demais, `CITY_RESULT_OFFICES=majoritarian` reduz o volume à
   metade sem afetar Brasil e UFs.
4. Coloque um CDN à frente da API (Cloudflare, por exemplo). URLs com `?v=` já saem com
   `s-maxage=3600` quando seguras; as demais com 3 s. O caminho `/api/realtime/*` deve passar
   sem buffer e sem cache (`X-Accel-Buffering: no` já é enviado). Uma instância aguenta
   ~30 mil req/s de respostas em cache e milhares de conexões ao vivo; com CDN, a origem recebe
   poucas requisições por atualização.
5. Acompanhe a página **Bastidores** (`/eleicao/bastidores/?e=2026&t=1`).

## Postgres local sem Docker

Qualquer Postgres 16 serve. Em macOS sem Docker, por exemplo:

```bash
micromamba create -p .data/pgenv -c conda-forge postgresql=16
.data/pgenv/bin/initdb -D .data/pgdata -U postgres --auth=trust
.data/pgenv/bin/pg_ctl -D .data/pgdata -o "-p 55433" start
```

Para os testes de integração da API: `TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55433/eleicoes_test pnpm test`.
