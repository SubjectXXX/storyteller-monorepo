#!/bin/bash
# Storyteller API container entrypoint.
#
# Regenerates /app/.env from the compose-time env vars on every
# container start. This is the workaround for Docker Desktop's
# plan9 file-cache breaking bind-mounts of /app/.env post-hoc.
#
# Strategy: snapshot the current process environment into /app/.env
# (overwriting whatever the image baked at build time). The
# `env -i` form strips the inherited container shell env so we
# only see the explicitly-set vars from compose. Anything set in
# compose's `env_file` + `environment:` block becomes the Laravel
# config the artisan serve child sees.
#
# Runs as www-data (the runtime user); /app/.env is pre-chmodded
# 666 in the Dockerfile so this script can overwrite it without
# sudo.
set -euo pipefail

ENV_FILE=/app/.env

# Ensure we can write to /app/.env (the Dockerfile bakes it 666 so
# this works regardless of the original owner). If the file got
# re-created with stricter perms somehow, bail out cleanly with the
# baked-in .env as the fallback.
if [ ! -w "$ENV_FILE" ]; then
    echo "[entrypoint] WARNING: cannot write to $ENV_FILE as $(id -un); the container's baked .env will be used as-is." >&2
    exec "$@"
fi

# Write to a /tmp staging file, then overwrite the target in place.
# (Creating new files in /app/ would require write access to the
# directory itself, which www-data doesn't have; truncating + writing
# the existing /app/.env only needs write access on the file, which
# the Dockerfile's chmod 666 grants.)
TMP_FILE=/tmp/laravel-env.regen

# Snapshot just the env vars explicitly set on PID 1 (skip everything
# docker/the shell would otherwise inject). Use `env -0` for safe
# NUL-separated output that handles newlines / quotes in values.
env -0 | {
    first=1
    while IFS= read -r -d '' entry; do
        # Skip entries without `=` (shouldn't happen, defensive).
        case "$entry" in
            *=*) ;;
            *) continue ;;
        esac
        # key=value split — escape any double quotes / backslashes in
        # the value so the resulting file stays shell-sourceable.
        key=${entry%%=*}
        val=${entry#*=}
        escaped=$(printf '%s' "$val" | sed 's/\\/\\\\/g; s/"/\\"/g')
        if [ "$first" = 1 ]; then
            printf '%s="%s"' "$key" "$escaped" > "$TMP_FILE"
            first=0
        else
            printf '\n%s="%s"' "$key" "$escaped" >> "$TMP_FILE"
        fi
    done
    printf '\n' >> "$TMP_FILE"
}

# Overwrite /app/.env in place (preserves the 666 chmod the image set).
cat "$TMP_FILE" > "$ENV_FILE"
rm -f "$TMP_FILE"

# Clear any prior config cache so changed env vars take effect
# immediately on the next request, even if the image had been
# built with `php artisan config:cache`.
su -s /bin/sh www-data -c 'php artisan config:clear' >/dev/null 2>&1 || true

exec "$@"
