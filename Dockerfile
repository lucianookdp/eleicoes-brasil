
# API and collector images come from the default stage, chosen by the APP build argument:
#   docker build --build-arg APP=api -t eleicoes-api .
#   docker build --build-arg APP=worker -t eleicoes-worker .
# The static web build (normally GitHub Pages) is the "web" target:
#   docker build --target web -t eleicoes-web .

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
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @eleicoes/api --filter @eleicoes/worker build

FROM deps AS web-build
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_BASE_PATH=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @eleicoes/web build

FROM nginx:1.27-alpine AS web
COPY --from=web-build /app/apps/web/out /usr/share/nginx/html
RUN printf 'server {\n  listen 3000;\n  root /usr/share/nginx/html;\n  location / { try_files $uri $uri/ /404.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 3000

# Default stage: one self-contained bundle (tsup bundles every dependency), no node_modules.
FROM node:22-alpine AS app
ARG APP=api
WORKDIR /app
ENV NODE_ENV=production MIGRATIONS_DIR=/app/drizzle DEMO_FIXTURE=/app/fixtures/election-demo/election.json
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/apps/${APP}/dist ./dist
COPY --from=build /app/packages/database/drizzle ./drizzle
COPY --from=build /app/fixtures ./fixtures
USER app
EXPOSE 4000
CMD ["node", "dist/main.js"]
