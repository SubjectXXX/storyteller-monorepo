# Storyteller web (player SPA) container.
#
# Multi-stage build for a Vite-bundled SPA. The first stage compiles
# the bundle; the runtime stage serves the static output via a tiny
# Node HTTP server (`serve` from the `serve` CLI). Compose wires this
# image as the `web` service.

FROM docker.io/library/node:22-bookworm-slim AS build

WORKDIR /app

# Layout matches what web/package.json expects via `file:../packages/design-system`.
COPY application/web/ /app/web/
COPY packages/ /app/packages/

# Install design-system deps so tsc can resolve them when type-checking the
# symlinked source under ../packages/design-system/src/.
WORKDIR /app/packages/design-system
ENV NPM_CONFIG_LOGLEVEL=warn
RUN corepack enable || true
RUN npm install --no-audit --no-fund

WORKDIR /app/web
RUN npm install --no-audit --no-fund
RUN npm run build


FROM docker.io/library/node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

RUN npm install -g serve@14.2.4 --no-audit --no-fund

# Provide a healthcheck tool. `serve` ships only Node, so we use node directly.
RUN echo '#!/usr/bin/env node\nconst http = require("http");\nhttp.get("http://localhost:8080/", (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on("error", () => process.exit(1));' > /usr/local/bin/healthcheck.js && chmod +x /usr/local/bin/healthcheck.js

COPY --from=build /app/web/dist /app/dist

EXPOSE 8080

USER node

CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:8080"]
