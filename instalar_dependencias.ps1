# ══════════════════════════════════════════════════════════════
#  instalar_dependencias.ps1
#  Instala todas las dependencias del proyecto Internet Conservatorio
#  Uso: .\instalar_dependencias.ps1
# ══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Internet Conservatorio — Instalación" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Verificar Node.js ──────────────────────────────────────────
Write-Host "[1/3] Verificando entorno..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "  ERROR: Node.js no está instalado. Descárgalo desde https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
Write-Host "  ✓ npm $(npm --version)" -ForegroundColor Green
Write-Host ""

# ── Backend ────────────────────────────────────────────────────
Write-Host "[2/3] Instalando dependencias del Backend..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR al instalar dependencias del backend." -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "  ✓ Backend listo." -ForegroundColor Green
Set-Location ..
Write-Host ""

# ── Frontend ───────────────────────────────────────────────────
Write-Host "[3/3] Instalando dependencias del Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR al instalar dependencias del frontend." -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "  ✓ Frontend listo." -ForegroundColor Green
Set-Location ..
Write-Host ""

# ── Fin ────────────────────────────────────────────────────────
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✓ Instalación completada exitosamente." -ForegroundColor Green
Write-Host ""
Write-Host "  Para iniciar en desarrollo:" -ForegroundColor White
Write-Host "    Backend:  cd backend  && npm run dev" -ForegroundColor Gray
Write-Host "    Frontend: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
