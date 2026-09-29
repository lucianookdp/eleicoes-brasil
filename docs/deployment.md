# Deploy

A aplicação é um Postgres e três processos Node. Nada depende de um provedor específico.

| Componente | Sugestão barata | Alternativas |
| --- | --- | --- |
| web | Vercel (projeto `apps/web`) | qualquer host de Node ou a imagem `web` |
| api | Railway / Fly.io (imagem `api`) | VM, Render, Cloud Run |
| worker | mesmo provedor da API (imagem `worker`), **uma única instância** | — |
| PostgreSQL | Neon / Supabase / Railway | qualquer Postgres 14+ |

Redis não é necessário (ver [ADR 006](adr/006-cache-without-redis.md)).

## Imagens

```bash
docker build --build-arg APP=api -t eleicoes-api .
docker build --build-arg APP=worker -t eleicoes-worker .
docker build --target web --build-arg NEXT_PUBLIC_API_URL=https://api.election.lucianookdp.dev -t eleicoes-web .
```

API e worker são um único arquivo JavaScript cada (todas as dependências embutidas); o web usa a
saída `standalone` do Next. O worker aplica as migrações ao iniciar.

## Variáveis por serviço

- **worker**: `DATABASE_URL`, `APP_MODE`, `ELECTION_ROUND`, `TSE_*`. Não expõe porta.
- **api**: `DATABASE_URL`, `CORS_ORIGINS` (ex.: `https://election.lucianookdp.dev`), `PORT`.
- **web**: `NEXT_PUBLIC_API_URL` (no build), `API_URL` (em execução, pode ser endereço interno).

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
5. Acompanhe `/elections/2026/operations`.

## Subdomínio

`election.lucianookdp.dev` → web; `api.election.lucianookdp.dev` → api. Ajuste `CORS_ORIGINS` e
`NEXT_PUBLIC_API_URL` para esses domínios.

## Postgres local sem Docker

Qualquer Postgres 16 serve. Em macOS sem Docker, por exemplo:

```bash
micromamba create -p .data/pgenv -c conda-forge postgresql=16
.data/pgenv/bin/initdb -D .data/pgdata -U postgres --auth=trust
.data/pgenv/bin/pg_ctl -D .data/pgdata -o "-p 55433" start
```

Para os testes de integração da API: `TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55433/eleicoes_test pnpm test`.
