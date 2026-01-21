# Correção de Sintaxe SQL - Filtro por Filial

## ❌ Erro Atual

```
syntax error at or near ":"
```

**Causa:** A sintaxe `:filial` não funciona em PostgreSQL/n8n. Cada banco de dados tem sua própria sintaxe para parâmetros.

---

## ✅ Sintaxe Correta por Banco de Dados

### 🐘 **PostgreSQL (n8n)**

Use `$1`, `$2`, etc para parâmetros posicionais:

```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = $1
ORDER BY ctrc, conferente, filial;
```

**No n8n:**
- No node PostgreSQL, use `{{ $json.filial }}` diretamente na query
- Ou configure parameters: `[valorFilial]`

**Alternativa com interpolação direta (n8n):**
```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = '{{ $json.filial }}'
ORDER BY ctrc, conferente, filial;
```

---

### 🐬 **MySQL/MariaDB**

Use `?` para parâmetros:

```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = ?
ORDER BY ctrc, conferente, filial;
```

**Ou com named parameters:**
```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = :filial
ORDER BY ctrc, conferente, filial;
```

---

### 🪟 **SQL Server**

Use `@filial` para parâmetros:

```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = @filial
ORDER BY ctrc, conferente, filial;
```

---

### 🦆 **SQLite**

Use `?` ou `:filial`:

```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = ?
ORDER BY ctrc, conferente, filial;
```

---

## 🔧 Configuração no n8n (PostgreSQL)

### **Opção 1: Query com Interpolação Direta** (RECOMENDADO)

No node **Postgres** do n8n:

```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = '{{ $json.filial }}'
ORDER BY ctrc, conferente, filial;
```

### **Opção 2: Query com Parâmetros**

**Query:**
```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = $1
ORDER BY ctrc, conferente, filial;
```

**Query Parameters:**
```json
{
  "parameters": ["{{ $json.filial }}"]
}
```

---

## 📋 Exemplo Completo no n8n

### **Workflow n8n:**

```
1. Webhook (Trigger)
   ↓
2. Set (Extrair filial do JSON)
   ↓
3. Postgres (Query com filtro)
   ↓
4. Respond to Webhook (Retornar resultados)
```

### **Node 1: Webhook**
```json
{
  "path": "picking-process",
  "method": "POST",
  "responseMode": "lastNode"
}
```

### **Node 2: Set (Processar dados)**
```javascript
// Código do node Set
return [
  {
    json: {
      acao: $input.item.json.body.acao,
      filial: ($input.item.json.body.filial || '').toUpperCase()
    }
  }
];
```

### **Node 3: Postgres Query**

**Condition (If):**
```javascript
{{ $json.acao === 'listar_ctrcs' }}
```

**SQL Query:**
```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = '{{ $json.filial }}'
ORDER BY ctrc, conferente, filial;
```

### **Node 4: Response**
```json
{
  "statusCode": 200,
  "body": "={{ $json }}"
}
```

---

## 🧪 Teste Manual no PostgreSQL

### **Teste 1: Listar CTRCs da filial DCX**
```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = 'DCX'
ORDER BY ctrc, conferente, filial;
```

### **Teste 2: Verificar dados disponíveis**
```sql
-- Ver todas as filiais com CTRCs pendentes
SELECT 
    filial,
    COUNT(DISTINCT ctrc) as total_ctrcs
FROM picklist
WHERE status IS NULL OR status != 'Finalizado'
GROUP BY filial
ORDER BY filial;
```

### **Teste 3: Ver exemplo de dados**
```sql
-- Ver primeiros 5 CTRCs de cada filial
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE status IS NULL OR status != 'Finalizado'
ORDER BY filial, ctrc
LIMIT 5;
```

---

## ⚠️ Validações Importantes

### **1. Sanitização do Input**
```javascript
// No n8n Set node, sempre converta para maiúsculas e remova espaços
filial: ($input.item.json.body.filial || '').toUpperCase().trim()
```

### **2. Validação de Filial Existente**
```sql
-- Adicionar validação antes da query principal
SELECT COUNT(*) FROM (
  SELECT DISTINCT filial 
  FROM picklist 
  WHERE filial = '{{ $json.filial }}'
) AS check_filial;
```

### **3. Evitar SQL Injection**
```javascript
// Validar que filial contém apenas letras
const filial = $input.item.json.body.filial || '';
const isValid = /^[A-Z]{2,10}$/.test(filial.toUpperCase());

if (!isValid) {
  throw new Error('Filial inválida');
}
```

---

## 🎯 Solução Rápida para o Erro Atual

**Substitua esta linha:**
```sql
AND filial = :filial  -- ❌ Sintaxe incorreta
```

**Por esta:**
```sql
AND filial = '{{ $json.filial }}'  -- ✅ Sintaxe correta n8n
```

**Ou (se usar parâmetros):**
```sql
AND filial = $1  -- ✅ PostgreSQL parameter
```

---

## 📊 Resultado Esperado

```json
[
  {
    "ctrc": "123456",
    "conferente": "João Silva",
    "filial": "DCX"
  },
  {
    "ctrc": "123457",
    "conferente": "Maria Santos",
    "filial": "DCX"
  }
]
```

---

## 🔍 Debug no n8n

1. **Ative "Execute workflow"** no modo manual
2. **Envie requisição de teste:**
```bash
curl -X POST http://localhost:5678/webhook/picking-process \
  -H "Content-Type: application/json" \
  -d '{"acao": "listar_ctrcs", "filial": "DCX"}'
```
3. **Verifique logs do node PostgreSQL**
4. **Veja query executada** no output do node

---

## ✅ Checklist de Implementação

- [ ] Substituir `:filial` por `'{{ $json.filial }}'` no n8n
- [ ] Validar que `$json.filial` contém valor
- [ ] Converter filial para maiúsculas (UPPER)
- [ ] Testar com cada filial (DCX, GYN, SPO, CWB, RIO)
- [ ] Verificar que retorna array vazio se não houver CTRCs
- [ ] Adicionar tratamento de erro se filial não existir
