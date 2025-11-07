Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""C:\Users\user\picking\start_picking.bat""", 0, False
Set WshShell = Nothing
