# Script de Inicializacao - Picking System v2.0 + Checklist
# Execute: .\start_all.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema Completo - Porta 8000" -ForegroundColor Cyan
Write-Host "  - Picking System v2.0" -ForegroundColor Cyan
Write-Host "  - Checklist CTRC PWA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$venvPath = "C:/Users/user/picking/.venv/Scripts/python.exe"
$backendPath = "backend/app_v2.py"
$checklistPath = "checklist"

# Verifica se o ambiente virtual existe
if (-not (Test-Path $venvPath)) {
    Write-Host "[ERRO] Ambiente virtual Python nao encontrado!" -ForegroundColor Red
    Write-Host "       Esperado em: $venvPath" -ForegroundColor Yellow
    exit 1
}

# Verifica se o backend existe
if (-not (Test-Path $backendPath)) {
    Write-Host "[ERRO] Arquivo backend/app_v2.py nao encontrado!" -ForegroundColor Red
    exit 1
}

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

Write-Host "[OK] Ambiente virtual Python encontrado" -ForegroundColor Green
Write-Host "[OK] Backend encontrado" -ForegroundColor Green
Write-Host "[OK] Checklist encontrado" -ForegroundColor Green
Write-Host ""

# Inicia o Checklist (Vite dev server) em background
Write-Host "Iniciando Checklist dev server (porta 5173 - interno)..." -ForegroundColor Yellow
Set-Location $checklistPath
$checklistJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList (Get-Location).Path
Set-Location ..
Start-Sleep -Seconds 10

# Inicia o backend (Flask com proxy)
Write-Host "Iniciando Backend Flask (porta 8000)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sistema Iniciado com Sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Acesse TUDO na porta 8000:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Picking System:" -ForegroundColor Yellow
Write-Host "    http://127.0.0.1:8000" -ForegroundColor White
Write-Host "    http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "  Checklist CTRC:" -ForegroundColor Yellow
Write-Host "    http://127.0.0.1:8000/checklist" -ForegroundColor White
Write-Host "    http://localhost:8000/checklist" -ForegroundColor White
Write-Host ""
Write-Host "  (Checklist roda em modo dev com hot reload!)" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

# Inicia o servidor Flask
try {
    & $venvPath $backendPath
} finally {
    # Cleanup: para o job do Vite quando Flask for interrompido
    Write-Host ""
    Write-Host "Encerrando Checklist dev server..." -ForegroundColor Yellow
    Stop-Job -Job $checklistJob -ErrorAction SilentlyContinue
    Remove-Job -Job $checklistJob -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Sistema encerrado" -ForegroundColor Green
}
