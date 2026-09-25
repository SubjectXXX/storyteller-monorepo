FROM docker.io/library/caddy:2-alpine

# Bake the Caddyfile into the image so the gateway container doesn't need a
# host bind-mount. This avoids Docker Desktop's plan9 file-share issue where
# a file with the same path that was ever a directory gets cached as a
# directory for the lifetime of the daemon.
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
