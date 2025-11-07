# Script para criar tarefa agendada no Windows
# Execute este script como Administrador

$TaskName = "Picking v2.0 Auto Start"
$TaskDescription = "Inicia automaticamente o sistema Picking v2.0 ao fazer login no Windows"
$ScriptPath = "C:\Users\user\picking\start_picking.bat"

# Criar a ação (executar o script)
$Action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "C:\Users\user\picking\start_picking_silent.vbs"

# Criar o gatilho (ao fazer login)
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# Criar as configurações
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Registrar a tarefa
try {
    Register-ScheduledTask -TaskName $TaskName -Description $TaskDescription -Action $Action -Trigger $Trigger -Settings $Settings -Force
    Write-Host "✓ Tarefa '$TaskName' criada com sucesso!" -ForegroundColor Green
    Write-Host "O Picking v2.0 será iniciado automaticamente ao fazer login no Windows." -ForegroundColor Cyan
} catch {
    Write-Host "✗ Erro ao criar a tarefa: $_" -ForegroundColor Red
    Write-Host "Execute este script como Administrador (clique direito -> Executar como Administrador)" -ForegroundColor Yellow
}
