# Script de Inicializacao - Checklist CTRC PWA
# Execute: .\start_checklist.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Checklist CTRC PWA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$checklistPath = "checklist"

# Verifica se a pasta checklist existe
if (-not (Test-Path $checklistPath)) {
    Write-Host "[ERRO] Pasta checklist nao encontrada!" -ForegroundColor Red
    exit 1
}

# Verifica se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Node.js nao encontrado! Instale o Node.js para executar o Checklist" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Checklist encontrado" -ForegroundColor Green
Write-Host ""

# Inicia o Checklist (Vite dev server)
Write-Host "Iniciando Checklist dev server (porta 5173 - interno)..." -ForegroundColor Yellow
Set-Location $checklistPath
npm run dev