# Storyteller API container.
#
# Multi-stage build that runs on a clean Laravel 13 tree from
# application/api. Compose wires this image as the `api` service.
#
# The Laravel `.env` file is baked into the image at build time
# (via the LARAVEL_ENV_FILE build arg, defaulting to the placeholder
# committed in the per-app repo) AND regenerated at container start
# by infra/api/entrypoint.sh, which writes /app/.env from the
# compose-time env_file + the explicit `environment:` block. This
# two-step approach exists because Docker Desktop's plan9 driver
# caches file paths as "directory" types forever once a file at
# that path has ever been a directory, so bind-mounting a real .env
# over /app/.env fails post-hoc with "not a directory: Are you
# trying to mount a directory onto a file" — see infra/api/README.md
# for the full story.
#
# NB: the runtime stage uses bash for the entrypoint (POSIX `read -d`
# is not portable).

ARG PHP_VERSION=8.4
ARG COMPOSER_VERSION=2
ARG LARAVEL_ENV_FILE=./application/api/.env.example

FROM docker.io/library/composer:${COMPOSER_VERSION} AS vendor

WORKDIR /app

COPY application/api/composer.json application/api/composer.lock /app/
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY application/api/ /app/
RUN composer dump-autoload --no-dev --ignore-platform-reqs 2>&1 | tail -5 || true


FROM docker.io/library/php:${PHP_VERSION}-cli-bookworm AS runtime

ENV COMPOSER_ALLOW_SUPERUSER=1
ENV APP_ENV=production
ENV PHP_OPCACHE_ENABLE=1
ENV PHP_OPCACHE_ENABLE_CLI=1

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates curl git libpq-dev libzip-dev libicu-dev libonig-dev unzip bash; \
    docker-php-ext-install -j"$(nproc)" pdo_pgsql pgsql bcmath intl zip opcache; \
    rm -rf /var/lib/apt/lists/*

COPY --from=vendor /app/vendor /app/vendor
COPY application/api/ /app/

# Clear package-discovery caches before baking the image. These caches
# reference service providers from BOTH dev and prod deps; if a dev-only
# package (e.g. laravel/pail) was installed during local development,
# the cached manifest will try to instantiate it at runtime and crash
# with `Class Laravel.Pail.PailServiceProvider not found`.
RUN rm -f /app/bootstrap/cache/services.php /app/bootstrap/cache/packages.php

# Bake the .env into the image. Defaults to the placeholder committed
# in the per-app repo (intentionally tiny so it can't accidentally
# carry secrets). For a real local build, pass `--build-arg
# LARAVEL_ENV_FILE=.env` to bake the compose-time .env instead.
ARG LARAVEL_ENV_FILE=./application/api/.env.example
COPY ${LARAVEL_ENV_FILE} /app/.env
# Make the baked .env world-writable so the entrypoint script (which
# runs as www-data after `USER www-data`) can overwrite it on every
# container start without needing sudo.
RUN chmod 666 /app/.env

# Pre-create the public/storage symlink so /storage/{path} URLs work
# for the local-disk-backed `s3` disk. We do this with `ln -s` rather
# than `php artisan storage:link` because the artisan command needs
# an initialized Laravel env, which isn't available during image build.
# The entrypoint script also re-runs `storage:link` on every container
# start so a deleted symlink gets recreated.
RUN ln -sf /app/storage/app/public /app/public/storage
WORKDIR /app

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Entrypoint regenerates /app/.env from the compose-time env vars
# every container start, then exec's the original CMD.
COPY infra/api/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
# Strip Windows CRLF line endings if the file was checked out on a
# Windows host (breaks bash's shebang parsing — manifests as
# "exec /usr/local/bin/entrypoint.sh: no such file or directory").
# tr -d '\r' is a POSIX-safe single-byte delete; sed -i is GNU-only.
RUN tr -d '\r' < /usr/local/bin/entrypoint.sh > /tmp/ep.sh \
    && mv /tmp/ep.sh /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

USER www-data

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]




