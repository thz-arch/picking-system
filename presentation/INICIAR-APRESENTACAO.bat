@echo off
chcp 65001 >nul
cls
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║   APRESENTAÇÃO - SISTEMA DE PICKING                       ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo   📊 Iniciando servidor na porta 9000...
echo.
echo   🌐 Acesse: http://localhost:9000/apresentacao.html
echo.
echo   💡 Pressione CTRL+C para parar o servidor
echo.
echo ───────────────────────────────────────────────────────────
echo   Desenvolvido por: Thiago Alves / Analista Dev.
echo ───────────────────────────────────────────────────────────
echo.

python server.py

pause
