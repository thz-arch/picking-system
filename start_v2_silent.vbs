Set WshShell = CreateObject("WScript.Shell")
' Executa o script PowerShell de forma silenciosa (sem janela)
WshShell.Run "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File ""C:\Users\custos1.extras\Documents\thiago\picking\picking\picking-system\start_v2.ps1""", 0, False
Set WshShell = Nothing
