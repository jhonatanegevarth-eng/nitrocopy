#!/bin/bash
# NitroCopy — deploy no VPS com CloudPanel
# Uso: ./deploy.sh
# Pré-requisito: git remote origin apontando para o repositório

set -e

APP_DIR="/var/www/nitrocopy/app"
PM2_APP="nitrocopy"

echo "==> Pull"
cd "$APP_DIR"
git pull --ff-only

echo "==> Install"
npm ci

echo "==> Build"
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Next.js standalone não inclui public/ nem .next/static/ automaticamente.
# Precisam ser copiados para que CSS, JS e assets funcionem.
echo "==> Copy static assets"
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# knowledge/ é lido em runtime via fs.readFileSync com process.cwd().
# PM2 roda com cwd=/var/www/nitrocopy/app, então process.cwd() aponta
# para a raiz do projeto onde knowledge/ já existe — cópia é seguro-fallback.
echo "==> Copy knowledge"
cp -r knowledge .next/standalone/knowledge

echo "==> Reload PM2"
pm2 reload "$PM2_APP" --update-env

echo "==> Done"
