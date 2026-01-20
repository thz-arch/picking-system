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
Inicie o servidor:
```bash
python backend/app_v2.py
```
O sistema estará disponível em `http://localhost:8000`.

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
