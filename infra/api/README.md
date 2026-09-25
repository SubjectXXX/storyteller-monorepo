# `infra/api` — Storyteller API image

The `storyteller-api` Docker image is built from `application/api/` via this
directory's `Dockerfile`. Compose wires it as the `api` service.

## Why the entrypoint script exists

Docker Desktop's `plan9` driver caches file paths as "directory" types
for the lifetime of the daemon — once a file at that path has ever been
a directory, the bind-mount of that path post-hoc fails with
`not a directory: Are you trying to mount a directory onto a file (or vice-versa)?`.

We hit this when trying to bind-mount the host's `.env` over `/app/.env`
inside the api container. The plan9 cache has a stale entry for that path
on the Windows-symlink-to-WSL layout this repo uses, so every attempt
ended with the same opaque runtime error.

### The two-step fix

1. **Build time**: `LARAVEL_ENV_FILE` build arg (default
   `./application/api/.env`) bakes a starting `.env` into the image.
   The Dockerfile `chmod 666`s it so the runtime user (`www-data`) can
   overwrite it without `sudo`.

2. **Container start**: `entrypoint.sh` runs as PID 1 before
   `php artisan serve`. It snapshots `env -0` from the current process
   environment (which compose populates from `env_file: .env` + the
   explicit `environment:` block in `compose.yaml`) and writes the
   result to `/app/.env`.

That way every container start sees the latest `LMSTUDIO_*`,
`APP_KEY`, and `DB_*` values without needing a bind-mount.

### Trade-offs

- **Secrets in the image**: the build-time bake means secrets
  (`APP_KEY`, AWS credentials) can leak into `docker history` if the
  `--build-arg LARAVEL_ENV_FILE=.env` path is used. Don't ship that
  image. For local dev, the placeholder `.env` baked in by default is
  intentionally tiny so it can't accidentally carry real secrets.

- **Config cache stale-ness**: `entrypoint.sh` runs
  `php artisan config:clear` before exec'ing the CMD, so prior
  `php artisan config:cache` output from earlier runs can't pin stale
  env values.

## Manual `.env` regen without rebuilding

```bash
docker exec --user root storyteller_api bash -c '
  set -euo pipefail
  env -0 | {
    first=1
    while IFS= read -r -d "" entry; do
      case "$entry" in *=*) ;; *) continue ;; esac
      key=${entry%%=*}; val=${entry#*=}
      esc=$(printf "%s" "$val" | sed "s/\\\\/\\\\\\\\/g; s/\"/\\\\\"/g")
      if [ "$first" = 1 ]; then printf "%s=\"%s\"" "$key" "$esc" > /app/.env; first=0
      else printf "\n%s=\"%s\"" "$key" "$esc" >> /app/.env; fi
    done
    printf "\n" >> /app/.env
  }
  chmod 666 /app/.env
'
```
