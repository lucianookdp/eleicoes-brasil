# Adicionando uma nova eleição

Objetivo: em 2030 (ou numa eleição municipal) a maior parte do sistema continuar igual. O
trabalho se concentra em três lugares: **registro**, **adapter** e **schemas**.

## 1. Ler a documentação nova do TSE

Página “Informações técnicas sobre a divulgação de resultados <ano>” no site do TSE, aba
*Documentos* (EA10, EA11, EA12, EA14, EA15, EA16, EA18, EA20). Compare com
[tse-integration.md](tse-integration.md) e anote:

- base, `ambiente`, códigos de pleito e de eleição (oficial e simulado);
- mudanças de nome de arquivo, diretórios (`arq` do `ele-c.json`) e campos;
- cargos novos e seus códigos;
- limites de acesso (requisições por segundo, política de 404).

## 2. Registrar as rodadas

Em [registry.ts](../packages/election-core/src/registry.ts):

```ts
{
  slug: '2030-1',
  electionSlug: '2030',
  electionName: 'Eleições Gerais 2030',
  year: 2030,
  kind: 'general',
  round: 1,
  date: '2030-10-06',
  adapter: 'tse-2030',            // ou 'tse-2026' se o formato não mudou
  demo: false,
  sources: {
    PRODUCTION: { baseUrl: 'https://resultados.tse.jus.br', environment: 'oficial', providerRoundId: '<pleito>' },
    SIMULATION: { baseUrl: 'https://resultados-sim.tse.jus.br/simulado', environment: 'simulado2030', providerRoundId: '<pleito>' },
  },
},
```

Se o formato **não mudou**, pare aqui e vá ao passo 5: o `TSEAdapter2026` serve.

## 3. Criar o adapter (só se o formato mudou)

1. Copie `packages/tse-client/src/adapter-2026.ts` para `adapter-2030.ts` e `schemas.ts` para
   `schemas-2030.ts` (ou reaproveite o que não mudou).
2. Ajuste schemas Zod e mapeamentos. **Nada fora de `tse-client` deve saber dos campos novos**:
   o adapter continua devolvendo `ElectionConfig`, `CountryProgress`, `StateProgress` e
   `AreaResult`.
3. `id = 'tse-2030'`, `version = '2030-v1'`.
4. Registre em `ADAPTERS` e `ADAPTER_VERSIONS` ([registry.ts](../packages/tse-client/src/registry.ts)).
5. Cargo novo com código desconhecido já é mapeado genericamente a partir do `ele-c.json`; se
   quiser um `slug` e ordem de exibição próprios, adicione em `KNOWN_OFFICES` e em
   `election-core/offices.ts`.

## 4. Testes do adapter

Em `packages/tse-client/test/fixtures`, salve exemplos reais (do simulado) de cada arquivo e
escreva testes como os de `adapter.test.ts`: configuração, andamento, resultado, 304, payload
inválido. Se o formato mudou, atualize também o servidor fictício (`apps/worker/src/demo/files.ts`)
para que o modo demo continue exercitando o adapter novo; o teste
`apps/worker/test/demo-adapter.test.ts` garante que os dois concordam.

## 5. Validar no simulado oficial

```bash
APP_MODE=SIMULATION ELECTION_ROUND=2030-1 pnpm --filter @eleicoes/worker dev
```

Durante a janela de testes do TSE, acompanhe a página **Bastidores**: eventos `source.schema`
mostram exatamente qual arquivo e qual campo divergiram.

## 6. Na eleição

`APP_MODE=PRODUCTION ELECTION_ROUND=2030-1`. Depois do 1º turno, adicione `2030-2` (o pleito do
2º turno aparece no `ele-c.json`, campo `cdt2`) ou deixe `providerRoundId` vazio para o adapter
escolher pela data e turno.

## Eleições municipais

O modelo já cobre: cargos com `scope = 'city'` (Prefeito, Vereador), resultados por município e
zona, e a visão geral funciona sem cargo nacional (mostra andamento, mapa e estados). Registre a
rodada com `kind: 'municipal'`.

## Checklist

- [ ] Documentação nova lida e diferenças anotadas em `tse-integration.md`
- [ ] Rodadas no registro
- [ ] Adapter novo (se necessário) + versão + registro de adapters
- [ ] Fixtures reais e testes do adapter
- [ ] Servidor demo atualizado (se o formato mudou)
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes
- [ ] Coleta validada no simulado oficial
- [ ] `APP_VERSION` com major novo (ex.: v2.0)
