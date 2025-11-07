# Estrutura do Banco de Dados - Coluna Filial

## Alteração na Tabela de CTRCs

### Nova Coluna: `filial`

```sql
ALTER TABLE ctrcs 
ADD COLUMN filial VARCHAR(10) NOT NULL DEFAULT '';

-- Criar índice para otimizar buscas por filial
CREATE INDEX idx_filial ON ctrcs(filial);
```

### Especificações

- **Tipo**: `VARCHAR(10)`
- **Obrigatório**: Sim (`NOT NULL`)
- **Padrão**: String vazia
- **Formato**: Siglas em maiúsculas (ex: DCX, GYN, SPO)

### Siglas de Filiais Disponíveis

| Sigla | Nome da Filial | Cor de Identificação |
|-------|----------------|----------------------|
| DCX   | Dourados - MS  | #1976D2 (Azul)      |
| GYN   | Goiânia - GO   | #388E3C (Verde)     |
| SPO   | São Paulo - SP | #D32F2F (Vermelho)  |
| CWB   | Curitiba - PR  | #F57C00 (Laranja)   |
| RIO   | Rio de Janeiro - RJ | #7B1FA2 (Roxo) |

### Exemplos de Uso

#### Inserir CTRC com filial:
```sql
INSERT INTO ctrcs (ctrc, filial, remetente, destinatario, cidade, prev_entrega)
VALUES ('123456', 'DCX', 'Empresa X', 'Cliente Y', 'Dourados', '2025-10-28');
```

#### Buscar CTRCs por filial:
```sql
SELECT * FROM ctrcs 
WHERE filial = 'DCX' 
ORDER BY ctrc DESC;
```

#### Atualizar filial de um CTRC:
```sql
UPDATE ctrcs 
SET filial = 'GYN' 
WHERE ctrc = '123456';
```

## Integração com a API

### Endpoint: `/api/filiais`
Retorna lista de filiais disponíveis:

```json
[
  {
    "sigla": "DCX",
    "nome": "Dourados - MS",
    "cor": "#1976D2"
  },
  ...
]
```

### Endpoint: `/api/filial/atual?sigla=DCX`
Confirma filial selecionada e retorna informações.

### Modificação no Webhook

O webhook `https://tritton.dev.br/webhook/picking-process` deve aceitar parâmetro de filial:

```json
{
  "acao": "listar_ctrcs",
  "filial": "DCX"
}
```

E retornar apenas CTRCs da filial especificada.

## Fluxo da Aplicação

1. **Seleção de Filial**: Usuário escolhe filial na tela inicial
2. **Armazenamento Local**: Filial é salva no `localStorage`
3. **Filtro de CTRCs**: Apenas CTRCs da filial selecionada são exibidos
4. **Badge de Identificação**: Filial atual é exibida com cor personalizada

## Migração de Dados Existentes

Para CTRCs sem filial definida, execute:

```sql
-- Definir filial padrão para CTRCs sem filial
UPDATE ctrcs 
SET filial = 'DCX' 
WHERE filial = '' OR filial IS NULL;
```

## Validações Recomendadas

1. **Backend**: Validar que a sigla da filial existe antes de inserir/atualizar
2. **Frontend**: Impedir acesso a CTRCs de outras filiais
3. **Logs**: Registrar filial em todos os logs de picking
4. **Relatórios**: Adicionar filtro por filial em relatórios

## Considerações

- A sigla deve ser sempre em **maiúsculas**
- Limite de 10 caracteres permite siglas compostas (ex: DCX-SUL)
- O índice na coluna melhora performance de queries
- Cores devem ser mantidas consistentes em toda a aplicação
