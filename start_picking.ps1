# Script PowerShell para iniciar o Picking v2.0
Set-Location "C:\Users\user\picking"
& .\\.venv\Scripts\Activate.ps1
Start-Process python -ArgumentList "app_v2.py" -WindowStyle Minimized
Write-Host "Picking v2.0 iniciado com sucesso!" -ForegroundColor Green
