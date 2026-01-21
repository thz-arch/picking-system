# Script de Inicializacao - Picking System v2.0 + Checklist
# Execute: .\start_all.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema Completo - Porta 8000" -ForegroundColor Cyan
Write-Host "  - Picking System v2.0" -ForegroundColor Cyan
Write-Host "  - Checklist CTRC PWA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$venvPath = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
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

# Inicia o Checklist (Vite dev server) e Backend em processos detached com logs/pids
Write-Host "Iniciando Checklist dev server (detached, porta 5174) e Backend Flask (detached)" -ForegroundColor Yellow

# Cria pastas de logs e pids
$logsDir = Join-Path $PSScriptRoot 'logs'
$pidsDir = Join-Path $logsDir 'pids'
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
New-Item -ItemType Directory -Path $pidsDir -Force | Out-Null

# Start Vite via npm (npm.cmd on Windows) in detached process
$npm = 'npm.cmd'
$viteLog = Join-Path $logsDir 'vite.log'
$viteErr = Join-Path $logsDir 'vite.err'
$viteArgs = @('run','dev','--','--host','127.0.0.1','--port','5174')
Write-Host "Starting Vite: $npm $($viteArgs -join ' ') (working dir: $checklistPath)" -ForegroundColor Cyan
$viteProc = Start-Process -FilePath $npm -ArgumentList $viteArgs -WorkingDirectory (Join-Path $PSScriptRoot $checklistPath) -RedirectStandardOutput $viteLog -RedirectStandardError $viteErr -WindowStyle Hidden -PassThru
Set-Content -Path (Join-Path $pidsDir 'vite.pid') -Value $viteProc.Id
Write-Host "Vite PID: $($viteProc.Id)  logs: $viteLog, $viteErr" -ForegroundColor Green

# Start backend (python venv) in detached process
$backendLog = Join-Path $logsDir 'backend.log'
$backendErr = Join-Path $logsDir 'backend.err'
Write-Host "Starting Backend: $venvPath $backendPath" -ForegroundColor Cyan
$backendProc = Start-Process -FilePath $venvPath -ArgumentList $backendPath -WorkingDirectory $PSScriptRoot -RedirectStandardOutput $backendLog -RedirectStandardError $backendErr -WindowStyle Hidden -PassThru
Set-Content -Path (Join-Path $pidsDir 'backend.pid') -Value $backendProc.Id
Write-Host "Backend PID: $($backendProc.Id)  logs: $backendLog, $backendErr" -ForegroundColor Green

Write-Host "";
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sistema Iniciado (detached) com Sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "";
Write-Host "Acesse TUDO na porta 8000:" -ForegroundColor Cyan
Write-Host "  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  http://127.0.0.1:8000/checklist" -ForegroundColor White
Write-Host "";
Write-Host "Logs: $logsDir" -ForegroundColor Gray
Write-Host "PIDs: $pidsDir" -ForegroundColor Gray
Write-Host "Para encerrar execute: .\stop_all.ps1" -ForegroundColor Yellow
