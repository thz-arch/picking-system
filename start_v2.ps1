# Script de Inicializacao - Picking System v2.0
# Execute: .\start_v2.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Picking System v2.0 - Iniciando" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$venvPath = "C:/Users/user/picking/.venv/Scripts/python.exe"
$appPath = "app_v2.py"

# Verifica se o ambiente virtual existe
if (-not (Test-Path $venvPath)) {
    Write-Host "[ERRO] Ambiente virtual nao encontrado!" -ForegroundColor Red
    exit 1
}

# Verifica se o app_v2.py existe
if (-not (Test-Path $appPath)) {
    Write-Host "[ERRO] Arquivo app_v2.py nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Ambiente virtual encontrado" -ForegroundColor Green
Write-Host "[OK] Arquivo app_v2.py encontrado" -ForegroundColor Green
Write-Host ""

Write-Host "Iniciando servidor na porta 8000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Acesse em:" -ForegroundColor Cyan
Write-Host "   http://127.0.0.1:8000" -ForegroundColor White
Write-Host "   http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Inicia o servidor
& $venvPath $appPath
