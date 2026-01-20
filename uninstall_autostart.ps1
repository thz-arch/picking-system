# Script para remover a tarefa agendada do Windows
# Execute este script como Administrador

$TaskName = "Picking v2.0 + Checklist Auto Start"

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "✓ Tarefa '$TaskName' removida com sucesso!" -ForegroundColor Green
    Write-Host "O Picking v2.0 não será mais iniciado automaticamente." -ForegroundColor Cyan
} catch {
    Write-Host "✗ Erro ao remover a tarefa: $_" -ForegroundColor Red
    Write-Host "Verifique se a tarefa existe ou execute como Administrador" -ForegroundColor Yellow
}
