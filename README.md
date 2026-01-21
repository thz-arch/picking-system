# 📦 Picking System v2.0

Sistema de picking moderno e modular para conferência de itens logísticos.

## 🚀 Como Executar

### Pré-requisitos
- Python 3.8+
- Pip

### Instalação
1. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure o ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env conforme necessário
   ```

### Execução
Você pode iniciar apenas o backend localmente com:
```bash
python backend/app_v2.py
```
O sistema estará disponível em `http://localhost:8000`.

Para desenvolvimento integrado (recomendado no Windows) iniciamos **Checklist (Vite)** e **Backend** em processos *detached* com logs e PIDs: use o script PowerShell `start_all.ps1`.

- Iniciar (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File .\start_all.ps1
```
- Parar:
```powershell
powershell -ExecutionPolicy Bypass -File .\stop_all.ps1
```

Logs e PIDs são gravados em `./logs/` e `./logs/pids/`. Os scripts de start individuais foram deprecados; use `start_all.ps1` e `stop_all.ps1` para um fluxo consistente durante desenvolvimento.

## 📂 Estrutura do Projeto
- `backend/`: Código Python (Flask)
- `frontend/`:
  - `templates/`: Arquivos HTML
  - `static/`: Ativos estáticos (JS, CSS, Imagens)
- `docs/`: Documentação detalhada

## 🧪 Testes
Para rodar os testes:
```bash
pytest backend/tests/
node frontend/static/js/tests/test_ean.js
```
