# Script para criar tarefa agendada no Windows
# Execute este script como Administrador

$TaskName = "Picking v2.0 + Checklist Auto Start"
$TaskDescription = "Inicia automaticamente o Picking System v2.0 e Checklist ao fazer login no Windows"
$ProjectPath = "C:\Users\custos1.extras\Documents\thiago\picking\picking\picking-system"
$VBScriptPath = Join-Path $ProjectPath "start_v2_silent.vbs"

# Verifica se o script VBS existe
if (-not (Test-Path $VBScriptPath)) {
    Write-Host "✗ Arquivo start_v2_silent.vbs não encontrado em:" -ForegroundColor Red
    Write-Host "  $VBScriptPath" -ForegroundColor Yellow
    exit 1
}

# Criar a ação (executar o script VBS silencioso)
$Action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$VBScriptPath`""

# Criar o gatilho (ao fazer login)
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# Criar as configurações
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Registrar a tarefa
try {
    Register-ScheduledTask -TaskName $TaskName -Description $TaskDescription -Action $Action -Trigger $Trigger -Settings $Settings -Force
    Write-Host "✓ Tarefa '$TaskName' criada com sucesso!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Cyan
    Write-Host "O sistema será iniciado automaticamente ao fazer login:" -ForegroundColor Cyan
    Write-Host "  - Picking System: http://localhost:8000" -ForegroundColor White
    Write-Host "  - Checklist CTRC: http://localhost:8000/checklist" -ForegroundColor White
    Write-Host "" -ForegroundColor Cyan
    Write-Host "Para desinstalar, execute: .\uninstall_autostart.ps1" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro ao criar a tarefa: $_" -ForegroundColor Red
    Write-Host "Execute este script como Administrador (clique direito -> Executar como Administrador)" -ForegroundColor Yellow
}
