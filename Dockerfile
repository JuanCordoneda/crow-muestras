# 1) Compila las cinco muestras en /app/dist
FROM node:22-slim AS build
WORKDIR /app

# Dependencias primero: si solo cambia el código, Docker reaprovecha esta capa.
COPY sites/sol-y-luna/package.json sites/sol-y-luna/package-lock.json sites/sol-y-luna/
COPY sites/sculpt-detox/package.json sites/sculpt-detox/package-lock.json sites/sculpt-detox/
COPY sites/atelie-queijos/package.json sites/atelie-queijos/package-lock.json sites/atelie-queijos/
RUN for s in sol-y-luna sculpt-detox atelie-queijos; do npm ci --prefix "sites/$s" --no-audit --no-fund || exit 1; done

COPY . .
# Railway pasa sus variables al build: con el dominio público, og:image y canónicos apuntan a la muestra.
ARG SITE_URL
ARG RAILWAY_PUBLIC_DOMAIN
RUN node scripts/build.mjs

# 2) Solo Caddy y los ficheros estáticos
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
