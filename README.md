# Eleições Brasil

Acompanhe a apuração das eleições brasileiras em tempo real, direto do celular ou do computador.

**Acesse:** https://eleicoes.lucianookdp.dev/

## O que dá para ver

- Quantas urnas já foram apuradas, no Brasil e em cada região
- Os candidatos com foto, votos e percentual, atualizados sozinhos a cada nova parcial
- O mapa do Brasil por estado
- Resultados de cada estado e de cada município, para todos os cargos
- Como estava a apuração em qualquer horário da noite

## De onde vêm os dados

Todos os números vêm dos arquivos públicos de resultados do **Tribunal Superior Eleitoral
(TSE)**. O site só busca, confere e mostra esses dados, sem opinião, pesquisa ou previsão.

Os votos necessários para cada decisão no Congresso vêm da Constituição Federal. As bandeiras
dos estados são símbolos oficiais (domínio público), em miniaturas do Wikimedia Commons.

Este é um projeto independente, sem vínculo com a Justiça Eleitoral. Resultados parciais podem
mudar até o fim da apuração.

## Para desenvolvedores

```bash
pnpm install
docker compose up -d postgres
pnpm dev:demo
```

Abre em http://localhost:3000 com uma eleição fictícia para testes. Detalhes técnicos em
[docs/](docs).

## Licença

MIT · Desenvolvido por [lucianookdp](https://lucianookdp.dev)
