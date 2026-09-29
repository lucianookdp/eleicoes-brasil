# syntax=docker/dockerfile:1.7
# One Dockerfile, three runtime targets: api, worker, web.
#   docker build --target api -t eleicoes-api .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/database/package.json packages/database/
COPY packages/election-core/package.json packages/election-core/
COPY packages/tse-client/package.json packages/tse-client/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @eleicoes/api --filter @eleicoes/worker --filter @eleicoes/web build

# API and worker are single bundled files (tsup bundles every dependency).
FROM node:22-alpine AS runtime-node
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

FROM runtime-node AS api
COPY --from=build /app/apps/api/dist ./dist
USER app
EXPOSE 4000
CMD ["node", "dist/main.js"]

FROM runtime-node AS worker
COPY --from=build /app/apps/worker/dist ./dist
COPY --from=build /app/packages/database/drizzle ./drizzle
COPY --from=build /app/fixtures ./fixtures
ENV MIGRATIONS_DIR=/app/drizzle DEMO_FIXTURE=/app/fixtures/election-demo/election.json
USER app
CMD ["node", "dist/main.js"]

FROM runtime-node AS web
ENV PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
USER app
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
