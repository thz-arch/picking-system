# 🚀 Guia Rápido - Picking System v2.0

## Início Rápido

### Opção 1: Script PowerShell (Recomendado)
```powershell
.\start_v2.ps1
```

### Opção 2: Comando Direto
```powershell
C:/Users/user/picking/.venv/Scripts/python.exe app_v2.py
```

### Opção 3: Flask Run
```powershell
$env:FLASK_APP = "app_v2.py"
C:/Users/user/picking/.venv/Scripts/flask.exe run --host=0.0.0.0 --port=8000
```

## ⚙️ Funcionalidade: Unidades por Caixa

### 📦 Como Funciona

**Cenário:** Produto com unidade "UN"

1. **Primeira Bipagem**
   - Bipe o código de barras da caixa
   - Sistema detecta que é produto em "UN"
   - Mostra modal: "Quantas unidades vêm nesta caixa?"
   - Digite o número (ex: 12) e confirme

2. **Próximas Bipagens**
   - Sistema já sabe que cada caixa = X unidades
   - Bipe a caixa e o sistema multiplica automaticamente
   - Não precisa digitar novamente

3. **Exemplo Prático**
   ```
   Produto: Refrigerante Coca-Cola 350ml
   Pedido: 48 unidades
   Caixa: 12 unidades
   
   Bipagens necessárias: 4 caixas
   
   Bipagem 1: 12 un (total: 12)
   Bipagem 2: 12 un (total: 24)
   Bipagem 3: 12 un (total: 36)
   Bipagem 4: 12 un (total: 48) ✓ Completo!
   ```

### 🎯 Dicas

- ✅ A configuração é salva por EAN
- ✅ Mesmo produto em CTRCs diferentes usa a configuração salva
- ✅ Para mudar a configuração, limpe o cache: `localStorage.clear()`
- ✅ Funciona apenas para produtos com unidade "UN"
- ✅ Outros tipos de unidade (CX, KG, etc) funcionam normalmente

## 🔍 Busca de Produtos

Digite no campo de busca:
- Código do produto
- EAN completo ou parcial
- Nome do produto

A tabela filtra automaticamente enquanto você digita.

## 📊 Status dos Itens

| Cor | Status | Significa |
|-----|--------|-----------|
| 🟢 Verde | Finalizado | Quantidade completa bipada |
| 🔵 Azul | Parcial | Alguma quantidade já bipada |
| ⚪ Branco | Pendente | Nenhuma bipagem ainda |

## 🎨 Indicadores Visuais

- **Barra de progresso**: Mostra % de itens bipados
- **Flash verde**: Bipagem bem-sucedida
- **Flash vermelho**: Erro na bipagem
- **Notificação**: Toast no topo da tela

## ⌨️ Atalhos

- **Scanner**: Basta bipar, o sistema detecta automaticamente
- **Enter**: Confirma entrada manual (se necessário)
- **Escape**: Fecha modais

## 🐛 Solução de Problemas

### Produto não encontrado
- Verifique se o EAN está correto
- O sistema tenta várias estratégias de busca
- Logs aparecem no console do navegador (F12)

### Unidades por caixa não aparecem
- Certifique-se que o produto tem unidade "UN"
- Limpe o cache se precisar reconfigurar:
  ```javascript
  localStorage.removeItem('picking_unidades_caixa_v2');
  ```

### Progresso não foi salvo
- Verifique se não está em modo anônimo
- LocalStorage deve estar habilitado
- Recarregue a página para tentar restaurar

## 📝 Console de Debug

No navegador (F12 > Console):

```javascript
// Ver logs
Utils.Logger.mostrar();

// Ver estado atual
pickingManager.getEstado();

// Ver unidades por caixa configuradas
pickingManager.unidadesPorCaixa;

// Ver histórico
pickingManager.getHistorico();

// Limpar tudo
localStorage.clear();
```

## 🔄 Voltar para v1.0

Se quiser usar a versão original:

```powershell
# Pare o servidor v2.0 (Ctrl+C)

# Inicie o servidor v1.0
C:/Users/user/picking/.venv/Scripts/python.exe app.py
```

O sistema serve automaticamente `index.html` (v1.0).

## 📞 Suporte

- Logs do servidor: `picking.log`
- Logs do navegador: F12 > Console
- Dados salvos: F12 > Application > Local Storage

---

**Dica Final:** Use o campo de scanner! O sistema foi otimizado para leitura de código de barras. 📱
