# Storyteller — Deployment Wrapper

This repository is the **deployment orchestrator** for the Storyteller monorepo.
It bundles three independently-versioned sub-repos as git submodules, plus the
vendored design-system package, and a top-level `compose.yaml` that builds and
runs the entire stack with `docker compose`.

## Layout

```
storyteller-monorepo/
├── application/
│   ├── api/    → SubjectXXX/storyteller-api    (git submodule, branch: development)
│   ├── web/    → SubjectXXX/storyteller-web    (git submodule, branch: development)
│   └── admin/  → SubjectXXX/storyteller-admin  (git submodule, branch: development)
├── packages/
│   └── design-system/   (vendored source — no separate repo)
├── infra/
│   ├── gateway/         (Caddyfile for /api, /web, /admin routing)
│   ├── api/             (api entrypoint)
│   ├── web/             (web Dockerfile)
│   └── admin/           (admin Dockerfile)
├── compose.yaml         (top-level orchestration)
└── .env.example         (template — copy to .env and fill secrets)
```

## Clone (with submodules)

```bash
git clone --recurse-submodules https://github.com/SubjectXXX/storyteller-monorepo.git
cd storyteller-monorepo
cp .env.example .env
# Edit .env — set APP_KEY, DB_PASSWORD, REDIS_PASSWORD, MINIO_ROOT_PASSWORD,
# SESSION_SECRET, REVERB_APP_KEY, ADMIN_BOOTSTRAP_PASSWORD
./storage/git-remotes/refresh.sh   # only needed for design-system dev — vendored, noop
```

## Run

```bash
docker compose build          # builds api, web, admin, gateway, postgres, redis, minio, mailpit, reverb
docker compose up -d          # starts the stack
docker compose logs -f         # watch startup

# First-time DB bootstrap (creates admin, roles, AI providers, scenarios, media)
docker exec storyteller_api php artisan migrate --seed

# Populate memory embeddings
docker exec storyteller_api php artisan memory:embed-all
```

## Verify

```bash
# Gateway should serve SPA shells and proxy API calls
curl -fsS http://localhost:8088/health/up
curl -fsS http://localhost:8088/web/
curl -fsS http://localhost:8088/admin/
```

## Submodule maintenance

Each sub-repo has its own `development` branch. To pick up new commits:

```bash
git submodule update --remote --merge
```

To bump to a specific tag or commit:

```bash
cd application/api
git fetch origin
git checkout v1.2.3            # or specific SHA
cd ../..
git add application/api
git commit -m "bump(api): api to v1.2.3"
git push
```

## CI

Each sub-repo has its own GitHub Actions workflow:
- `SubjectXXX/storyteller-api/.github/workflows/ci.yml`
- `SubjectXXX/storyteller-web/.github/workflows/ci.yml`
- `SubjectXXX/storyteller-admin/.github/workflows/ci.yml`

CI runs on pushes to `development` and `main`. The monorepo itself has no
top-level CI — submodules are independently verified.

## Production checklist

- [ ] Set `APP_DEBUG=false`
- [ ] Set real `APP_URL` (https://...)
- [ ] Rotate all secrets in `.env`
- [ ] Set `ADMIN_BOOTSTRAP_PASSWORD` (see DEPLOY.md)
- [ ] Enable Caddy `auto_https` and point DNS A record at host
- [ ] Configure real `MAIL_*` env (SMTP relay)
- [ ] Configure real LLM provider in `/admin/ai` UI
- [ ] Set up postgres backup rotation
- [ ] Schedule `memory:embed-all` via cron or scheduler
