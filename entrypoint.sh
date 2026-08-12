#!/bin/sh
set -e

STEP="inicialização"

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [entrypoint] $*"
}

on_exit() {
  code=$?
  if [ "$code" -ne 0 ]; then
    log "FALHA na etapa \"$STEP\" (exit=$code)"
  fi
}

trap on_exit EXIT

log "node=$(node -v) pm2=$(pm2 -v) NODE_ENV=${NODE_ENV:-} PORT=${PORT:-3000}"
log "postgres=${DB_HOST:-}:${DB_PORT:-}/${POSTGRES_DB:-} redis_cache=${REDIS_CACHE_HOST:-}:${REDIS_CACHE_PORT:-} redis_session=${REDIS_SESSION_HOST:-}:${REDIS_SESSION_PORT:-}"

STEP="migrations"
log "==> Rodando migrations..."
npm run migration:run:prod
log "<== Migrations concluídas"

STEP="seeders"
log "==> Rodando seeders..."
npm run seed:prod
log "<== Seeders concluídos"

STEP="pm2"
log "==> Subindo app com pm2 (cluster): dist/main.js"
exec pm2-runtime start ecosystem.config.js
