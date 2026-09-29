# ADR 001 — Monorepo com pnpm e Turborepo

- Status: aceito · Data: 2026-09-29

## Contexto
Web, API e worker compartilham o modelo de domínio, os contratos da API e a leitura das
variáveis de ambiente. A plataforma precisa durar vários ciclos eleitorais.

## Decisão
Um repositório com `apps/` (web, api, worker) e `packages/` (config, election-core, tse-client,
database), pnpm workspaces e Turborepo para orquestrar lint, typecheck, test e build. Pacotes
internos são consumidos como TypeScript fonte (sem etapa de build própria); API e worker são
empacotados com tsup e o web com o Next.

Pacotes sugeridos no briefing que **não** criamos agora:
- `ui`: só há um consumidor de componentes (web).
- `utils`: evita um pacote genérico que acumula de tudo; utilidades ficam onde são usadas.
- `schemas`: os contratos da API vivem em `election-core/contracts.ts`, já compartilhados por
  API e web. Os schemas do TSE vivem no `tse-client`, onde devem ficar isolados.

## Consequências
Uma mudança no contrato quebra o typecheck do web e da API no mesmo commit. O custo é uma
ferramenta a mais (Turborepo). Criar `ui` ou `schemas` depois é mecânico se surgir um segundo
consumidor.
