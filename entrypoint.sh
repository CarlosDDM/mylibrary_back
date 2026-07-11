#!/bin/sh
set -e

echo "==> Rodando migrations..."
npm run migration:run:prod

echo "==> Rodando seeders..."
npm run seed:prod

echo "==> Subindo app com pm2 (cluster)..."
exec pm2-runtime start ecosystem.config.js
