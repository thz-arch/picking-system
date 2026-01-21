# 📦 Sistema de Picking v2.0 – Descrição Completa

> Documento técnico e funcional descrevendo o fluxo, regras de negócio, estruturas de dados e comportamento da versão 2.0 do sistema de Picking.

---
## 1. Visão Geral
O Picking v2.0 é uma aplicação web voltada à conferência (bipagem) de itens de um CTRC (Conhecimento de Transporte) em ambiente de operação logística. Ele controla quantidade planejada vs. executada, evita excesso, registra histórico e suporta configuração dinâmica de *unidades por caixa* para produtos unitários (UN).

Componentes principais:
- `index_v2.html` – Estrutura de interface.
- `style_v2.css` – Estilos responsivos e variáveis de tema.
- `utils.js` – Funções utilitárias (storage, formatação, logger).
- `ui-components.js` – Componentes de UI (modais, toasts, tabela, confirmações).
- `picking-manager.js` – Core de regras e estado.
- `main_v2.js` – Orquestra UI + eventos + integração backend.

---
## 2. Objetivos Principais
1. Garantir bipagem precisa (sem perder ou exceder itens).
2. Fluxo rápido para leitores de código de barras (scanner.
3. Persistência local para retomada (progresso, histórico, unidades por caixa).
4. Feedback instantâneo (sucesso, aviso, erro).
5. Registro de histórico auditável e limitado (controle de memória).

---
## 3. Atores / Papéis
| Ator | Descrição | Interação |
|------|-----------|-----------|
| Conferente | Realiza a bipagem física | Usa scanner/teclado | 
| Líder / Supervisor | Confere progresso e finaliza | Observa histórico |
| Sistema Backend | Recebe baixa final | API HTTP (POST) |

---
## 4. Fluxo Operacional Macro
1. Seleção de Filial.
2. Seleção / carregamento de um CTRC (lista de itens planejados).
3. Tela de separação: bipagem progressiva.
4. (Se item UN sem configuração) Solicita "unidades por caixa".
5. Atualização de totais e status linha a linha.
6. Quando todas as linhas concluídas → botão "Finalizar" habilitado.
7. Envio (payload) para backend + registro em histórico.
8. Estado atual é limpo; histórico permanece.

---
## 5. Fluxo Detalhado de Bipagem
```mermaid
graph TD
A[Scanner lê EAN] --> B[processBipagem(ean)]
B --> C[PickingManager.biparItem]
C -->|EAN não encontrado| E[UIComponents.showError]
C -->|Precisa unidades/caixa| F[Modal Unidades]
F -->|Configura| B
C -->|Quantidade excedida| G[Warning bloqueio]
C -->|OK| H[Atualiza item]
H --> I[Emit onItemBipado]
I --> J[UI: atualiza tabela + toasts]
J --> K[Verifica finalização]
```

---
## 6. Estruturas de Dados Principais
### 6.1 Item (linha do CTRC)
```json
{
  "codigo": "string",
  "ean": "string",
  "produto": "string",
  "unid": "UN" | "CX" | ...,
  "quantidade": 120,
  "qtd_bipada": 32,
  "qtd_restante": 88,
  "status": "Pendente" | "Parcial" | "Finalizado",
  "unidadesPorCaixa": 12 | null
}
```

### 6.2 Estado de Progresso Persistido (`picking_progress_v2`)
```json
{
  "ctrc": { "ctrc": "12345", "conferente": "João", "dataInicio": "ISO" },
  "itens": [ ... itens ... ],
  "timestamp": "ISO"
}
```

### 6.3 Histórico (`picking_historico_v2`)
Array de pickings finalizados (máx. 50 – recorte preservando ordem recente):
```json
{
  "ctrc": "12345",
  "conferente": "João",
  "dataInicio": "ISO",
  "dataFim": "ISO",
  "itens": [ { "ean": "...", "qtd_bipada": 10, "status": "Finalizado" } ],
  "totais": { "linhas": 12, "quantidade_total": 400, ... }
}
```

### 6.4 Unidades por Caixa (`picking_unidades_caixa_v2`)
```json
{ "7891234567890": 12, "7890001112223": 6 }
```

---
## 7. Status & Transições
| Status | Condição | Evento de mudança |
|--------|----------|------------------|
| Pendente | `qtd_bipada == 0` | Início |
| Parcial | `0 < qtd_bipada < quantidade` | Após bipagem 
| Finalizado | `qtd_bipada >= quantidade` | Último incremento |

Transição final é idempotente (não cresce além da quantidade). Excesso é **bloqueado** (v2 impede confirmação de overpick).

---
## 8. Cálculos de Totais (`picking-manager.js`)
```javascript
calcularTotais() => {
  linhas,
  linhasFinalizadas,
  quantidade_total, // soma planejada
  qtd_bipada_total, // soma executada
  qtd_restante_total // diferença não negativa
}
```
`calcularProgresso()` gera porcentagens independentes: por linhas e por quantidade total.

---
## 9. Lógica de Bipagem (Resumo)
Pseudo-código essencial:
```pseudo
function biparItem(ean):
  item = encontrarItemPorEan(ean)
  if !item -> erro EAN_NAO_ENCONTRADO
  if item.unid == 'UN' and item.unidadesPorCaixa == null -> solicitar configuração
  if item.qtd_bipada >= item.quantidade -> erro QUANTIDADE_EXCEDIDA (bloqueio)
  incremento = (item.unid == 'UN' && item.unidadesPorCaixa) ? item.unidadesPorCaixa : 1
  item.qtd_bipada += incremento
  item.qtd_restante = max(0, quantidade - qtd_bipada)
  item.status = recalculaStatus()
  salvarProgresso()
  emitir onItemBipado
```
Validações garantem que nunca ultrapasse o planejado efetivo.

---
## 10. Unidades por Caixa
- Ativada apenas para itens com `unid == 'UN'`.
- Primeiro contato dispara modal (`UIComponents.showUnidadesPorCaixaModal`).
- Valor persistido em `picking_unidades_caixa_v2`.
- Incrementos subsequentes usam esse multiplicador.

Benefícios: acelera bipagens em itens fracionados por caixa física.

---
## 11. Eventos / Callbacks
Registrados em `PickingManager.callbacks`:
| Evento | Disparo | Uso UI |
|--------|---------|--------|
| `onUpdate` | Qualquer modificação de item/estado | Re-render de tabela / totais |
| `onItemBipado` | Bipagem bem-sucedida | Toast de sucesso, atualização de linha |
| `onFinalizacao` | Finalização completa | Mensagem sucesso | 
| `onErro` | Falhas (EAN, excedente) | Mensagens warning/erro |

---
## 12. Persistência & Storage
| Chave | Conteúdo | Quando atualiza |
|-------|----------|------------------|
| `picking_progress_v2` | Estado corrente | Cada bipagem | 
| `picking_historico_v2` | Lista pickings finalizados | Finalização | 
| `picking_unidades_caixa_v2` | Mapa EAN→unidades | Definição modal |
| `picking_logs_v2` (se usado) | Logs estruturados | Pontos de auditoria |

Uso principal: recuperação após refresh ou queda de conexão local.

---
## 13. UX e Foco
- Campo invisível `#inputBipagemGlobal` mantém foco contínuo para scanner.
- Modais **suspendem** processamento de bipagens (checagem de `.modal-backdrop`).
- After close: foco forçado repetidamente (timeouts escalonados) para robustez.
- Feedback rápido: cores + toasts temporários.

---
## 14. Tratamento de Erros
| Código | Causa | Ação |
|--------|-------|------|
| `EAN_NAO_ENCONTRADO` | EAN sem correspondência | Toast erro + foco | 
| `QUANTIDADE_EXCEDIDA` | Tentativa além do planejado | Bloqueio + warning |
| `ITENS_PENDENTES` | Finalização antecipada | Aviso – impede envio | 
| `SEM_CTRC` | Finalizar sem carga | Erro interno |
| `ERRO_INTERNO` | Exceções não previstas | Log + toast erro |

No v2, confirmação de extrapolação foi removida para evitar inconsistência (relato operacional).

---
## 15. Finalização
Critérios:
- Todas as linhas: `qtd_bipada >= quantidade`.
- Botão habilitado (`verificarFinalizacao()`).
- Ao confirmar:
  1. `pickingManager.finalizarPicking()` valida e monta objeto.
  2. Persistência em histórico.
  3. POST para endpoint (`API_URL`).
  4. Limpeza de estado corrente.

Payload (exemplo simplificado):
```json
{
  "acao": "dar_baixa",
  "ctrc": "12345",
  "itens": [ { "codigo": "A1", "ean": "789...", "qtd": 24, "status": "Finalizado" } ]
}
```

---
## 16. Histórico
- Armazenado como *stack* (últimos primeiro).
- Limite de 50 registros para evitar crescimento ilimitado.
- Renderização em `renderizarHistorico()`.

---
## 17. Logs & Observabilidade
`Utils.Logger` controla níveis (info, warn, error). Durante inicialização inicial silencia para evitar ruído quando caches vazios.

Exemplos:
- `PickingManager inicializado` – resumo de contexto.
- `Processando bipagem` – cada tentativa.
- `Tentativa de bipagem excedente bloqueada` – auditoria de bloqueios.

Sugestão futura: enviar lote de logs sob demanda ao backend para análise.

---
## 18. Segurança & Integridade
Mecanismos:
- Bloqueio de over-picking (sem confirmação).
- Persistência incremental reduz janela de perda de dados.
- Mapeamento estrito por EAN (não aceita caracteres não numéricos se validado antes da lógica principal – validação pode ser reforçada conforme necessidade).

Riscos mitigados:
- Duplicação acidental por leitura dupla do scanner (timeout e limpeza de buffers).
- Foco perdido (rotinas de forçar foco).

---
## 19. Performance
Principais decisões:
- Uso de DOM incremental (atualiza só linha via `UIComponents.atualizarLinhaTabela` em vez de rebuild completo para cada bipagem).
- Timer de scanner com `SCAN_TIMEOUT` curto (100ms) para capturar fluxo rápido sem interpretá-lo como digitação humana.
- Limite de histórico = menor custo de parsing ao carregar.

Possível melhoria: Virtualização de tabela para > 1000 linhas (não crítico no cenário atual).

---
## 20. Pseudocódigos Chave
### 20.1 Verificação de Finalização
```pseudo
function verificarFinalizacao():
  estado = pickingManager.getEstado()
  if every(item.qtd_bipada >= item.quantidade):
     btnFinalizar.enabled = true
  else:
     btnFinalizar.enabled = false
```

### 20.2 Definir Unidades por Caixa
```pseudo
if item.unid == 'UN' and item.unidadesPorCaixa == null:
   unidades = modalPergunta()
   if unidades: salvar e repetir bipagem
   else: abortar
```

### 20.3 Persistência de Progresso
```pseudo
onBipagem:
  atualizar item
  recalcular totais
  salvarLocal('picking_progress_v2', estado)
```

---
## 21. Extensões Futuras (Roadmap)
| Ideia | Benefício |
|-------|-----------|
| Sincronização online incremental | Multi-dispositivo / backup servidor |
| Controle de usuários / permissões | Auditoria e rastreabilidade |
| Modo offline PWA completo | Operação sem rede prolongada |
| Regras de tolerância configurável | Casos de sobra planejada |
| Exportação CSV / PDF de histórico | Relatórios operacionais |
| Dashboards em tempo real | Visão gerencial |

---
## 22. Glossário
| Termo | Definição |
|-------|-----------|
| CTRC | Documento que lista itens a serem separados |
| Bipagem | Ato de ler (scanner) um código de barras |
| Over-pick | Bipar além do planejado |
| UN | Unidade (produto que vem em caixas com n unidades) |

---
## 23. Boas Práticas Adotadas
- Separação clara entre lógica de negócio (manager) e interface (main + UIComponents).
- Emissão de eventos ao invés de acoplamento direto (facilita testes/mocks).
- Persistência defensiva (try/catch com fallback).
- Limitação de estruturas potencialmente crescentes (histórico, logs).

---
## 24. Pontos de Atenção Operacional
| Situação | Sintoma | Ação |
|----------|---------|------|
| Scanner perde foco | Nada bipado aparece | Verificar campo invisível – recarregar página se necessário |
| Bloqueio de item finalizado | Mensagem quantidade máxima | Confirmar se quantidade planejada está correta |
| Histórico vazio indevido | Lista limpa | Verificar se storage do navegador foi apagado |

---
## 25. Resumo Final
O Picking v2.0 estabelece uma base robusta para operações de conferência: previsível, resiliente a falhas de foco, com regras estritas de integridade e fácil extensão. A arquitetura orientada a eventos e a modularização facilitam evolução (ex: sincronização online, dashboards). O bloqueio de over-picking elimina ambiguidades e reforça controle de inventário.

---
## 26. Referências Rápidas
| Tarefa | Local | Função |
|--------|-------|--------|
| Bipar item | `picking-manager.js` | `biparItem()` |
| Finalizar | `picking-manager.js` | `finalizarPicking()` |
| Configurar unidades | `ui-components.js` | `showUnidadesPorCaixaModal()` |
| Processar scanner | `main_v2.js` | `processBipagem()` |
| Salvar progresso | `picking-manager.js` | `salvarProgresso()` |

---
## 27. Changelog Conceitual (v1 → v2)
| Área | v1 | v2 |
|------|----|----|
| Over-pick | Confirmava extra | Bloqueado |
| Unidades por Caixa | Manual repetido | Persistência automática |
| Histórico | Ausente / simples | Estruturado + limite |
| Logs | Consolidados básicos | Logger estruturado |
| UX Foco | Perda frequente | Forçamento agressivo pós-modal |

---

> Fim do documento.
