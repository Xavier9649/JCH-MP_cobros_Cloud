#!/bin/bash
# ══════════════════════════════════════════════════════════════
#  instalar_dependencias.sh
#  Instala todas las dependencias del proyecto Internet Conservatorio
#  Uso: bash instalar_dependencias.sh
# ══════════════════════════════════════════════════════════════

set -e  # Detiene el script si cualquier comando falla

echo ""
echo "═══════════════════════════════════════════════"
echo "  Internet Conservatorio — Instalación"
echo "═══════════════════════════════════════════════"
echo ""

# ── Verificar Node.js ──────────────────────────────────────────
echo "[1/3] Verificando entorno..."
if ! command -v node &> /dev/null; then
    echo "  ERROR: Node.js no está instalado."
    echo "  Instálalo desde https://nodejs.org o con: nvm install --lts"
    exit 1
fi
echo "  ✓ Node.js $(node --version)"
echo "  ✓ npm $(npm --version)"
echo ""

# ── Backend ────────────────────────────────────────────────────
echo "[2/3] Instalando dependencias del Backend..."
cd backend
npm install
cd ..
echo "  ✓ Backend listo."
echo ""

# ── Frontend ───────────────────────────────────────────────────
echo "[3/3] Instalando dependencias del Frontend..."
cd frontend
npm install
cd ..
echo "  ✓ Frontend listo."
echo ""

# ── Fin ────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════"
echo "  ✓ Instalación completada exitosamente."
echo ""
echo "  Para iniciar en desarrollo:"
echo "    Backend:  cd backend  && npm run dev"
echo "    Frontend: cd frontend && npm run dev"
echo "═══════════════════════════════════════════════"
echo ""
