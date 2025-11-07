# 📚 Documentação do Sistema de Picking v2.0

Esta pasta contém toda a documentação técnica do sistema de picking, incluindo guias, logs de mudanças e especificações técnicas.

---

## 📖 Documentos Principais

### 🚀 Para Começar
- **[README_V2.md](README_V2.md)** - Visão geral completa do sistema v2.0
- **[GUIA_RAPIDO.md](GUIA_RAPIDO.md)** - Guia rápido de uso e funcionalidades

### 🔧 Melhorias e Mudanças
- **[CHANGELOG_UX.md](CHANGELOG_UX.md)** - Histórico de melhorias de UX/UI

### 🐛 Correções de Bugs
- **[BUGFIX_HISTORICO.md](BUGFIX_HISTORICO.md)** - Correção de erro ao carregar localStorage vazio
- **[CORRECAO_FOCO_MODAL.md](CORRECAO_FOCO_MODAL.md)** - Correção de foco do modal de unidades por caixa

### 📊 Melhorias Visuais
- **[MELHORIAS_TABELA.md](MELHORIAS_TABELA.md)** - Melhorias no layout da tabela de itens
- **[LOADING_CENTRALIZADO.md](LOADING_CENTRALIZADO.md)** - Centralização do loading overlay

### 🔍 Sistema de Busca de EAN
- **[LOGICA_BIPAGEM_EAN.md](LOGICA_BIPAGEM_EAN.md)** - Documentação completa da lógica de bipagem
- **[MELHORIA_BUSCA_EAN.md](MELHORIA_BUSCA_EAN.md)** - Primeira melhoria: processamento de dígitos extras
- **[BUSCA_BIDIRECIONAL.md](BUSCA_BIDIRECIONAL.md)** - Segunda melhoria: busca bidirecional com includes
- **[CORRECAO_INCLUDES.md](CORRECAO_INCLUDES.md)** - Terceira melhoria: busca bidirecional em ambas direções
- **[BUSCA_NUCLEO_EAN.md](BUSCA_NUCLEO_EAN.md)** - Quarta melhoria: extração e comparação de núcleo central
- **Nível 6 (Substring Comum)** - Última implementação: busca por substring de 12+ dígitos consecutivos

---

## 🎯 Algoritmo de Busca de EAN (6 Níveis)

O sistema implementa um algoritmo sofisticado de busca de EAN com 6 níveis:

1. **Nível 1 - Busca Exata**: Comparação direta EAN == EAN
2. **Nível 2 - Processamento Bipado**: Remove primeiro e último dígito do EAN bipado
3. **Nível 3 - Processamento Lista**: Remove primeiro e último dígito do EAN da lista
4. **Nível 4 - Busca Bidirecional**: Verifica se um EAN contém o outro (ambas direções)
5. **Nível 5 - Núcleo Central**: Extrai e compara o núcleo de 13 dígitos centrais
6. **Nível 6 - Substring Comum**: Busca substring comum de no mínimo 12 dígitos consecutivos

Este algoritmo garante que praticamente qualquer variação de código de barras seja reconhecida corretamente!

---

## 🗂️ Estrutura do Projeto

```
picking/
├── docs/                    # 📚 Esta pasta - Documentação
├── backups/                 # 💾 Backups automáticos de arquivos
├── app_v2.py               # 🐍 Backend Flask
├── index_v2.html           # 🌐 Interface HTML
├── main_v2.js              # ⚙️ Lógica principal
├── picking-manager.js      # 📦 Gerenciamento de picking
├── ui-components.js        # 🎨 Componentes de UI
├── utils.js                # 🛠️ Utilitários
├── style_v2.css            # 💅 Estilos
└── start_v2.ps1            # 🚀 Script de inicialização
```

---

## � Documentação Completa do Processo

Para descrição profunda de todo o fluxo do Picking v2.0 (arquitetura, eventos, validações, persistência, histórico, roadmap e pseudocódigos), consulte:

> **[DESCRICAO_PICKING_V2.md](DESCRICAO_PICKING_V2.md)**

Esse documento aborda: visão geral, fluxo operacional macro e detalhado, estruturas de dados, tratamento de erros, regras de negócio (incluindo bloqueio de over-picking), unidades por caixa, finalização, histórico e extensões futuras.

---

## �📝 Convenções de Nomenclatura

- **README_*.md** - Visão geral e documentação principal
- **GUIA_*.md** - Guias práticos de uso
- **CHANGELOG_*.md** - Histórico de mudanças
- **BUGFIX_*.md** - Correções de bugs específicos
- **MELHORIAS_*.md** - Melhorias e aprimoramentos
- **LOGICA_*.md** - Documentação técnica de algoritmos
- **BUSCA_*.md** - Melhorias no sistema de busca
- **CORRECAO_*.md** - Correções específicas

---

## 🔍 Localizar Informação

- **Problemas de Layout?** → Ver MELHORIAS_TABELA.md, LOADING_CENTRALIZADO.md
- **EAN não reconhecido?** → Ver LOGICA_BIPAGEM_EAN.md e documentos BUSCA_*.md
- **Modal com problemas?** → Ver CORRECAO_FOCO_MODAL.md
- **Erro no console?** → Ver BUGFIX_HISTORICO.md
- **Como usar o sistema?** → Ver README_V2.md e GUIA_RAPIDO.md

---

## 🆕 Última Atualização

**Data:** 22/10/2025
**Versão:** 2.0
**Mudanças recentes:**
- ✅ Implementado Nível 6 de busca de EAN (substring comum)
- ✅ Corrigido foco do modal de unidades por caixa
- ✅ Organizada documentação em pasta dedicada

---

**Desenvolvido com 💜 para otimização de processos de picking**
