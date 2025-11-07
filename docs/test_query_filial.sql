-- Script de Teste: Query com Filtro de Filial
-- Execute este script para testar o filtro de filiais no banco de dados

-- ========================================
-- 1. VERIFICAR ESTRUTURA DA TABELA
-- ========================================

-- Verifica se a coluna 'filial' existe
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'picklist' AND COLUMN_NAME = 'filial';

-- ========================================
-- 2. ESTATÍSTICAS POR FILIAL
-- ========================================

-- Conta CTRCs por filial
SELECT 
    filial,
    COUNT(DISTINCT ctrc) as total_ctrcs,
    COUNT(*) as total_itens
FROM picklist
WHERE status IS NULL OR status != 'Finalizado'
GROUP BY filial
ORDER BY filial;

-- ========================================
-- 3. QUERY PRINCIPAL (COM FILTRO)
-- ========================================

-- Listar CTRCs de uma filial específica (DCX)
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = 'DCX'
ORDER BY ctrc, conferente, filial;

-- ========================================
-- 4. QUERIES DE TESTE PARA CADA FILIAL
-- ========================================

-- Dourados (DCX)
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = 'DCX'
ORDER BY ctrc;

-- Goiânia (GYN)
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = 'GYN'
ORDER BY ctrc;

-- São Paulo (SPO)
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = 'SPO'
ORDER BY ctrc;

-- Curitiba (CWB)
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = 'CWB'
ORDER BY ctrc;

-- Rio de Janeiro (RIO)
SELECT DISTINCT ctrc, conferente, filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND filial = 'RIO'
ORDER BY ctrc;

-- ========================================
-- 5. VALIDAÇÕES
-- ========================================

-- CTRCs sem filial (devem ser zero após migração)
SELECT COUNT(*) as ctrcs_sem_filial
FROM picklist
WHERE (status IS NULL OR status != 'Finalizado')
  AND (filial IS NULL OR filial = '');

-- Filiais não reconhecidas (siglas diferentes das esperadas)
SELECT DISTINCT filial
FROM picklist
WHERE filial NOT IN ('DCX', 'GYN', 'SPO', 'CWB', 'RIO')
  AND (status IS NULL OR status != 'Finalizado');

-- ========================================
-- 6. PERFORMANCE
-- ========================================

-- Verifica se existe índice na coluna filial
SELECT 
    i.name AS index_name,
    c.name AS column_name
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('picklist')
  AND c.name = 'filial';

-- ========================================
-- 7. DADOS DE EXEMPLO
-- ========================================

-- Inserir CTRCs de teste (se necessário)
-- ATENÇÃO: Apenas para ambiente de desenvolvimento/teste

-- INSERT INTO picklist (ctrc, conferente, filial, ean, produto, quantidade, status)
-- VALUES 
--   ('TEST001', 'João Silva', 'DCX', '7891234567890', 'Produto A', 10, NULL),
--   ('TEST002', 'Maria Santos', 'GYN', '7891234567891', 'Produto B', 5, NULL),
--   ('TEST003', 'Pedro Costa', 'SPO', '7891234567892', 'Produto C', 8, NULL);

-- ========================================
-- 8. QUERY COMPLETA COM DETALHES
-- ========================================

-- Lista CTRCs com todos os detalhes por filial
SELECT 
    p.ctrc,
    p.conferente,
    p.filial,
    COUNT(DISTINCT p.ean) as total_produtos,
    SUM(p.quantidade) as total_unidades,
    COUNT(CASE WHEN p.status = 'Bipado' THEN 1 END) as itens_bipados,
    COUNT(CASE WHEN p.status IS NULL OR p.status != 'Finalizado' THEN 1 END) as itens_pendentes
FROM picklist p
WHERE (p.status IS NULL OR p.status != 'Finalizado')
  AND p.filial = 'DCX'  -- Alterar conforme necessário
GROUP BY p.ctrc, p.conferente, p.filial
ORDER BY p.ctrc;

-- ========================================
-- 9. MIGRAÇÃO DE DADOS (SE NECESSÁRIO)
-- ========================================

-- Atualizar filial padrão para CTRCs sem filial
-- UPDATE picklist 
-- SET filial = 'DCX'
-- WHERE (filial IS NULL OR filial = '')
--   AND ctrc IN (
--     SELECT DISTINCT ctrc 
--     FROM picklist 
--     WHERE conferente LIKE '%Dourados%'
--   );

-- ========================================
-- 10. LIMPEZA E MANUTENÇÃO
-- ========================================

-- Normalizar siglas (garantir maiúsculas)
UPDATE picklist
SET filial = UPPER(filial)
WHERE filial != UPPER(filial);

-- Remover espaços em branco
UPDATE picklist
SET filial = TRIM(filial)
WHERE filial != TRIM(filial);

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

-- A query principal deve retornar apenas CTRCs da filial especificada
-- Exemplo de saída:
-- 
-- ctrc     | conferente    | filial
-- ---------|---------------|-------
-- 123456   | João Silva    | DCX
-- 123457   | Maria Santos  | DCX
-- 123458   | Pedro Costa   | DCX
