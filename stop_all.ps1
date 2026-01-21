# Stop all started by start_all.ps1
$logsDir = Join-Path $PSScriptRoot 'logs'
$pidsDir = Join-Path $logsDir 'pids'

if (-not (Test-Path $pidsDir)) {
    Write-Host "No PID directory found: $pidsDir" -ForegroundColor Yellow
    exit 0
}

function Stop-IfPidFile($name) {
    $pidFile = Join-Path $pidsDir "$name.pid"
    if (Test-Path $pidFile) {
        try {
            $pid = (Get-Content $pidFile).Trim()
            if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
                Write-Host "Stopping $name (PID $pid)" -ForegroundColor Cyan
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "$name stopped" -ForegroundColor Green
            } else {
                Write-Host "$name pid $pid not found/running" -ForegroundColor Yellow
            }
        } catch {
            Write-Host ("Failed to stop {0}: {1}" -f $name, $_) -ForegroundColor Red
        } finally {
            Remove-Item $pidFile -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "No PID file for $name" -ForegroundColor Gray
    }
}

Stop-IfPidFile 'vite'
Stop-IfPidFile 'backend'

Write-Host "Done. Logs: $logsDir" -ForegroundColor Gray
