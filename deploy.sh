#!/usr/bin/env bash
#
# SIGO · Despliegue de traccar-web personalizado
# --------------------------------------------------
# Baja los ultimos cambios del repo, compila y publica en Traccar.
# Uso:  ./deploy.sh
#
set -euo pipefail

# --- Configuracion (ajustar si tu instalacion es distinta) ---
BRANCH="main"                          # rama de trabajo
WEB_DIR="/opt/traccar/web"              # carpeta que sirve Traccar
# -------------------------------------------------------------

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo "==> 1/5  Trayendo ultimos cambios ($BRANCH)"
git fetch origin "$BRANCH"
git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> 2/5  Instalando dependencias"
npm install --no-audit --no-fund

echo "==> 3/5  Compilando (vite build)"
npm run build

echo "==> 4/5  Respaldando web actual"
STAMP="$(date +%Y%m%d-%H%M%S)"
if [ -d "$WEB_DIR" ]; then
  sudo cp -r "$WEB_DIR" "${WEB_DIR}.bak.${STAMP}"
  echo "    backup: ${WEB_DIR}.bak.${STAMP}"
fi

echo "==> 5/5  Publicando build nuevo"
sudo rm -rf "${WEB_DIR:?}/"*
sudo cp -r build/* "$WEB_DIR"/

echo ""
echo "OK  Despliegue completo. Refresca el navegador con Ctrl+Shift+R."
echo "    (Si algo salio mal, restaura con: sudo cp -r ${WEB_DIR}.bak.${STAMP}/* ${WEB_DIR}/)"
