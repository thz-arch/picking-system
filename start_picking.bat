@echo off
REM Script de inicialização automática do Picking v2.0
cd /d "C:\Users\user\picking"
call .venv\Scripts\activate.bat
start "Picking v2.0" python app_v2.py
echo Picking v2.0 iniciado com sucesso!
