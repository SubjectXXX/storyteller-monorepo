# Storyteller admin SPA container. Mirrors infra/web/Dockerfile.

FROM docker.io/library/node:22-bookworm-slim AS build

WORKDIR /app

COPY application/admin/ /app/admin/
COPY packages/ /app/packages/

# Install design-system deps so tsc can resolve them when type-checking the
# symlinked source under ../packages/design-system/src/.
WORKDIR /app/packages/design-system
ENV NPM_CONFIG_LOGLEVEL=warn
RUN corepack enable || true
RUN npm install --no-audit --no-fund

WORKDIR /app/admin
RUN npm install --no-audit --no-fund
RUN npm run build


FROM docker.io/library/node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

RUN npm install -g serve@14.2.4 --no-audit --no-fund

# Provide a healthcheck tool. `serve` ships only Node, so we use node directly.
RUN echo '#!/usr/bin/env node\nconst http = require("http");\nhttp.get("http://localhost:8080/", (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on("error", () => process.exit(1));' > /usr/local/bin/healthcheck.js && chmod +x /usr/local/bin/healthcheck.js

COPY --from=build /app/admin/dist /app/dist

EXPOSE 8080

USER node

CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:8080"]
