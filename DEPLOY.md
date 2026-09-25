# Production Deployment Runbook

This document captures the operational steps to take a fresh server from
zero to a running, seeded, HTTPS-enabled Storyteller stack.

## 0. Prerequisites

- Linux host with Docker 24+ and `docker compose` v2
- Public DNS A record pointing at the host (for HTTPS via Caddy)
- Outbound HTTPS to GitHub (for submodule clone) and your SMTP relay
- Outbound HTTPS to your LLM provider (e.g. OpenAI-compatible endpoint)

## 1. Clone the wrapper

```bash
git clone --recurse-submodules https://github.com/SubjectXXX/storyteller-monorepo.git /srv/storyteller
cd /srv/storyteller
```

## 2. Generate secrets

```bash
# Laravel APP_KEY — must be 32 random bytes base64-encoded
php -r 'echo "APP_KEY=base64:" . base64_encode(random_bytes(32)) . PHP_EOL;'

# DB / Redis / MinIO passwords — generate four strong random passwords
for i in 1 2 3 4; do openssl rand -hex 24; done

# Session + Reverb secrets
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 32   # REVERB_APP_KEY

# Admin bootstrap password — **save to your password manager NOW**
openssl rand -hex 16   # ADMIN_BOOTSTRAP_PASSWORD
```

## 3. Configure .env

```bash
cp .env.example .env
chmod 600 .env
$EDITOR .env
```

Required edits:

| Variable | Value |
|---|---|
| `APP_KEY` | output of step 2 |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://api.YOUR-DOMAIN` |
| `DB_PASSWORD` | random from step 2 |
| `REDIS_PASSWORD` | random from step 2 |
| `MINIO_ROOT_PASSWORD` | random from step 2 |
| `SESSION_SECRET` | output of step 2 |
| `REVERB_APP_KEY` | output of step 2 |
| `ADMIN_BOOTSTRAP_PASSWORD` | **capture to password manager** |
| `CACHE_STORE` | `redis` |
| `SESSION_DRIVER` | `redis` |
| `QUEUE_CONNECTION` | `redis` |
| `MAIL_*` | your SMTP credentials |
| `BROADCAST_CONNECTION` | `redis` |

## 4. Required code change (one-liner) — bootstrap admin password from env

The current `application/api/database/seeders/DatabaseSeeder.php` hardcodes the
admin password as `abc123`. For production you **must** change it. Apply this
diff before building:

```diff
--- a/application/api/database/seeders/DatabaseSeeder.php
+++ b/application/api/database/seeders/DatabaseSeeder.php
@@ -33,7 +33,11 @@ class DatabaseSeeder extends Seeder
             ['email' => 'admin@storyteller.test'],
             [
                 'name' => 'admin',
                 'display_name' => 'Storyteller Admin',
-                'password' => Hash::make('abc123'),
+                'password' => Hash::make((string) env('ADMIN_BOOTSTRAP_PASSWORD', 'abc123')),
                 'locale' => 'en',
```

Then commit on the api sub-repo (or just patch the submodule working copy).

## 5. Build and start

```bash
docker compose build
docker compose up -d
docker compose ps     # verify all services healthy
```

## 6. First-time DB bootstrap

```bash
# Idempotent — creates admin, roles, AI providers, scenarios, media
docker exec storyteller_api php artisan migrate --seed

# Populate memory embeddings (slow first run; safe to interrupt and resume)
docker exec storyteller_api php artisan memory:embed-all

# (Optional) smoke-test the API directly
docker exec storyteller_api php artisan route:list --path=api/auth | head
```

## 7. Smoke test

```bash
# Gateway
curl -fsS https://YOUR-DOMAIN/health/up

# SPA shells (HTML, no JS rendering needed)
curl -fsS https://YOUR-DOMAIN/web/ | head -5
curl -fsS https://YOUR-DOMAIN/admin/ | head -5

# Admin login (use ADMIN_BOOTSTRAP_PASSWORD from your password manager)
curl -fsS -X POST https://YOUR-DOMAIN/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@storyteller.test","password":"YOUR_ADMIN_BOOTSTRAP_PASSWORD"}'
```

## 8. HTTPS

Caddy ships with `auto_https off` in `infra/gateway/Caddyfile` for local dev.
For production:

1. Edit `infra/gateway/Caddyfile` — remove the `auto_https off` block
2. `docker compose restart gateway`

Caddy will issue a Let's Encrypt cert on first request and auto-renew.

## 9. Locked-out admin recovery

If you lose the admin password (and the bootstrap capture):

```bash
docker exec storyteller_api php artisan tinker --execute='
  $u = App\Models\User::where("email", "admin@storyteller.test")->first();
  $u->password = Illuminate\Support\Facades\Hash::make("NEW_PASSWORD_HERE");
  $u->save();
  echo "OK id=" . $u->id;
'
```

Requires SSH to the docker host. Anyone with host SSH + `docker exec` can
reset. There is **no** in-app self-service password reset in this codebase.

## 10. Submodule updates

To pick up new commits from a sub-repo's `development` branch:

```bash
cd /srv/storyteller
git submodule update --remote --merge
docker compose build api web admin   # rebuild affected images
docker compose up -d
```

## 11. Backup

Postgres data lives in the named volume `storyteller_postgres_data`. Backup:

```bash
docker exec storyteller_postgres pg_dump -U storyteller storyteller | \
  gzip > /srv/backups/storyteller-$(date +%F).sql.gz
```

Schedule via cron. Restore: `gunzip | docker exec -i storyteller_postgres psql -U storyteller`.
