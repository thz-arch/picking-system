# Integração Webhook - Filtro por Filial

## Endpoint do Webhook
`POST https://tritton.dev.br/webhook/picking-process`

## Modificação Necessária: Filtro por Filial

### Requisição - Listar CTRCs

**Antes (sem filtro):**
```json
{
  "acao": "listar_ctrcs"
}
```

**Agora (com filtro de filial):**
```json
{
  "acao": "listar_ctrcs",
  "filial": "DCX"
}
```

### Query SQL no Backend

O webhook deve modificar a query para incluir o filtro de filial:

```sql
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = :filial  -- NOVO: Filtro por filial
ORDER BY ctrc, conferente, filial;
```

### Exemplo de Implementação (Python/Flask)

```python
@app.route('/webhook/picking-process', methods=['POST'])
def picking_process():
    data = request.json
    acao = data.get('acao')
    
    if acao == 'listar_ctrcs':
        filial = data.get('filial', '').upper()
        
        # Validação
        if not filial:
            return jsonify({"error": "Filial não informada"}), 400
        
        # Query com filtro
        query = """
            SELECT DISTINCT ctrc, conferente, filial
            FROM picklist
            WHERE (status IS NULL OR status != 'Finalizado')
              AND filial = %s
            ORDER BY ctrc, conferente, filial
        """
        
        cursor.execute(query, (filial,))
        resultados = cursor.fetchall()
        
        return jsonify([
            {
                "ctrc": row[0],
                "conferente": row[1],
                "filial": row[2]
            }
            for row in resultados
        ])
```

### Exemplo de Implementação (Node.js/Express)

```javascript
app.post('/webhook/picking-process', async (req, res) => {
  const { acao, filial } = req.body;
  
  if (acao === 'listar_ctrcs') {
    if (!filial) {
      return res.status(400).json({ error: 'Filial não informada' });
    }
    
    const query = `
      SELECT DISTINCT ctrc, conferente, filial
      FROM picklist
      WHERE (status IS NULL OR status != 'Finalizado')
        AND filial = ?
      ORDER BY ctrc, conferente, filial
    `;
    
    const [rows] = await db.query(query, [filial.toUpperCase()]);
    
    res.json(rows.map(row => ({
      ctrc: row.ctrc,
      conferente: row.conferente,
      filial: row.filial
    })));
  }
});
```

## Outras Ações Afetadas

### buscar_ctrc
Adicionar validação para garantir que o CTRC pertence à filial:

```json
{
  "acao": "buscar_ctrc",
  "ctrc": "123456",
  "filial": "DCX"
}
```

```sql
SELECT * FROM picklist
WHERE ctrc = :ctrc 
  AND filial = :filial  -- Validação de segurança
```

### dar_baixa
Incluir filial no log de finalização:

```json
{
  "acao": "dar_baixa",
  "ctrc": "123456",
  "filial": "DCX",
  "itens": [...]
}
```

## Validações Recomendadas

1. **Filial obrigatória**: Sempre validar se a filial foi informada
2. **Filial válida**: Verificar se a sigla existe no sistema
3. **Logs**: Registrar filial em todos os logs de operação
4. **Segurança**: Impedir acesso a CTRCs de outras filiais

## Resposta do Webhook

### Sucesso
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

### Erro - Filial não informada
```json
{
  "error": "Filial não informada",
  "status": 400
}
```

### Sucesso - Nenhum CTRC
```json
[]
```

## Checklist de Implementação

- [ ] Adicionar parâmetro `filial` na ação `listar_ctrcs`
- [ ] Modificar query SQL para incluir `WHERE filial = :filial`
- [ ] Validar se filial foi informada
- [ ] Converter filial para maiúsculas (normalização)
- [ ] Adicionar validação em `buscar_ctrc`
- [ ] Incluir filial nos logs de `dar_baixa`
- [ ] Testar com cada filial (DCX, GYN, SPO, CWB, RIO)
- [ ] Verificar índice na coluna `filial` para performance

## Testes

### Teste 1: Listar CTRCs da filial DCX
```bash
curl -X POST https://tritton.dev.br/webhook/picking-process \
  -H "Content-Type: application/json" \
  -d '{"acao": "listar_ctrcs", "filial": "DCX"}'
```

### Teste 2: Listar CTRCs sem filial (deve retornar erro)
```bash
curl -X POST https://tritton.dev.br/webhook/picking-process \
  -H "Content-Type: application/json" \
  -d '{"acao": "listar_ctrcs"}'
```

### Teste 3: Buscar CTRC específico com validação de filial
```bash
curl -X POST https://tritton.dev.br/webhook/picking-process \
  -H "Content-Type: application/json" \
  -d '{"acao": "buscar_ctrc", "ctrc": "123456", "filial": "DCX"}'
```

## Migração de Dados

Se existirem CTRCs sem filial definida:

```sql
-- Verificar CTRCs sem filial
SELECT COUNT(*) FROM picklist WHERE filial IS NULL OR filial = '';

-- Atualizar CTRCs sem filial (definir filial padrão)
UPDATE picklist 
SET filial = 'DCX'  -- Ajustar conforme necessário
WHERE filial IS NULL OR filial = '';
```
