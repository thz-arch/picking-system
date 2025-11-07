@echo off
echo Iniciando servidor de apresentacao na porta 9000...
echo.
echo Abra seu navegador em: http://localhost:9000/apresentacao.html
echo.
echo Pressione Ctrl+C para parar o servidor
echo.
cd /d "%~dp0"
python -m http.server 9000
