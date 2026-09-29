# Integração com o TSE

Resumo do que o `TSEAdapter2026` implementa, extraído das especificações oficiais publicadas em
[Informações técnicas sobre a divulgação de resultados 2026](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados)
(aba *Documentos*). Versões consultadas: EA10 (26/03/2026), EA14 e EA15 (10/06/2026),
EA11 (23/06/2026), EA20 (10/07/2026). Sempre confira a versão vigente antes de uma eleição.

## Ambientes

| Ambiente | Base | `<ambiente>` | Pleito / eleições |
| --- | --- | --- | --- |
| Oficial 2026, 1º turno | `https://resultados.tse.jus.br` | `oficial` | pleito 3220 · 6257 federal (Presidente), 6259 estaduais, 6261 conselho distrital |
| Simulado 2026 | `https://resultados-sim.tse.jus.br/simulado` | `simulado2026` | pleito 17801 · 21270 federal, 21272 estadual, 21274 municipal |
| 2º turno | oficial | `oficial` | publicado no `ele-c.json` (`cdt2`) |

Exemplos do simulado (documentação do TSE):

```
<base>/<amb>/comum/config/ele-c.json                               EA11 configuração de eleições
<base>/<amb>/ele2026/21270/config/mun-e021270-cm.json              EA12 municípios
<base>/<amb>/ele2026/21270/dados/br/br-e021270-ab.json             EA14 acompanhamento Brasil
<base>/<amb>/ele2026/21270/dados/ac/ac-e021270-ab.json             EA15 acompanhamento UF
<base>/<amb>/ele2026/21270/dados/br/br-c0001-e021270-u.json        EA20 Presidente, Brasil
<base>/<amb>/ele2026/21272/dados/ac/ac-c0003-e021272-u.json        EA20 Governador, AC
<base>/<amb>/ele2026/21272/dados/ac/ac01120-c0005-e021272-u.json   EA20 Senador, Acrelândia/AC
```

O diretório usa o código da eleição sem zeros (`21270`); o nome do arquivo usa 6 dígitos
(`e021270`). Município sempre com 5 dígitos, zona com 4, cargo com 4.

## Regras de acesso (obrigatórias)

- **100 requisições por segundo por IP.** Acima disso, bloqueio de 10 minutos, **reiniciado a cada
  nova tentativa**. Por isso o cliente abre o circuito por 11 minutos ao receber 403/429, em vez de
  tentar de novo.
- **Muitos 404 podem bloquear o IP.** URLs são montadas só a partir de códigos lidos no
  `ele-c.json` e no `mun-e…-cm.json`; nunca adivinhadas. Mais de 30 404 em um minuto abrem o
  circuito por 5 minutos.
- A CDN suporta **ETag / Last-Modified**; respostas **304 também contam** no limite.
- Não há arquivo de índice de mudanças: o EA14 indica quais UFs mudaram e o EA15 quais municípios.
- O arquivo de eleitos (EA10) só existe após a primeira totalização final de uma UF (antes: 404).
  Não o usamos: o EA20 já traz `e` (eleito) e `st` (situação).

## Arquivos e campos usados

| Arquivo | Uso no sistema |
| --- | --- |
| EA11 `ele-c.json` | pleitos, eleições (`tp` 8 federal, 1 estadual, 3 municipal), cargos por abrangência (`cp`), diretórios (`arq`) |
| EA12 `mun-e…-cm.json` | municípios: código TSE (`cd`), IBGE (`cdi`), nome, capital, zonas (`z`) |
| EA14 `br-e…-ab.json` | andamento do Brasil e de cada UF |
| EA15 `<uf>-e…-ab.json` | andamento da UF e de cada município |
| EA20 `…-u.json` | resultado de um cargo em uma abrangência (Brasil, UF, município, zona) |
| EA16 `<uf>-p…-cs.json` | seções por zona e horário do arquivo auxiliar (implementado no adapter, coleta em fase futura) |

Campos de andamento (EA14/15/20): `and` (`n` não iniciada, `p` parcial, `f` finalizada),
`dt`/`ht` (data/hora da última totalização, horário de Brasília), `s` (seções: `ts` total, `st`
totalizadas, `pstn` %), `e` (eleitorado: `te`, `est`, `c` comparecimento, `a` abstenção).

Campos de resultado (EA20): `carg[].agr[]` (coligação/federação/partido isolado) →
`par[]` (partido) → `cand[]` (candidato: `n`, `sqcand`, `nmu`, `vap` votos, `pvapn` % com 9
casas, `e`, `st`, `dvt` destinação, `vs` vice/suplentes). Totais em `v`: `tv`, `vv` válidos,
`vb` brancos, `tvn` nulos, `van`/`vansj` anulados. `dv = n` significa que a votação **não pode
ser divulgada** (votos vêm zerados): a interface mostra “não divulgado”, nunca zero.
`tf = s` indica totalização final; `md` indica eleição matematicamente definida.

## Normalização

- Todo valor chega como texto. `"391842"` → inteiro; `"48,32"` e `"48.321234567"` → decimal;
  qualquer outra coisa → `null` (nunca `NaN`).
- `dd/mm/aaaa` + `hh:mm:ss` (Brasília, sem horário de verão desde 2019) → ISO UTC.
- Siglas de partidos inaptos vêm com `**`; são removidos.
- O adapter confere se `cdabr` do arquivo corresponde à área pedida.
- Objetos Zod são “loose”: campos novos do TSE não quebram a ingestão.

## Pontos ainda não verificados contra arquivos reais

A documentação foi seguida, mas estes detalhes só serão confirmados no simulado:

1. O tipo de abrangência dos municípios no EA15 (`mu` ou `mun`, a especificação usa os dois):
   ambos aceitos.
2. Os decimais `…n` podem vir como número ou texto: ambos aceitos.
3. O diretório do EA16 (`cs`) é lido de `arq` no `ele-c.json`; o padrão de fallback é uma
   suposição.

Se um payload divergir, o coletor registra `source.schema` em `ingestion_events` com o arquivo e
os problemas, marca o ciclo como `degraded` e segue com os demais recursos.
