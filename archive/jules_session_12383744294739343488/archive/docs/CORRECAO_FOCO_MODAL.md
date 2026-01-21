# 🔧 Correção de Foco do Modal de Unidades por Caixa

**Data:** 21/10/2025  
**Versão:** 2.0  
**Problema:** Modal aceitava bipagens enquanto estava aberto

---

## 🐛 Problema Identificado

Ao aparecer o modal para configurar unidades por caixa:
- O foco do teclado não ficava preso no modal
- Input de bipagem continuava processando códigos
- Ao digitar quantidade, o sistema interpretava como bipagem
- Causava erros e comportamento inesperado

---

## ✅ Solução Implementada

### 1. Desabilita Input de Bipagem

**Arquivo:** `ui-components.js` - `showUnidadesPorCaixaModal()`

```javascript
// ANTES de abrir modal
const inputBipagem = document.getElementById('inputBipagemGlobal');
if (inputBipagem) {
  inputBipagem.disabled = true;  // ✅ Desabilita
  inputBipagem.blur();            // ✅ Remove foco
}
```

### 2. Prende Foco no Input do Modal

```javascript
// Foca no input do modal
setTimeout(() => {
  input.focus();
  input.select();
}, 150);

// Mantém foco preso no input do modal
input.addEventListener('blur', () => {
  setTimeout(() => {
    if (document.querySelector('.modal-backdrop')) {
      input.focus();  // ✅ Força retorno do foco
    }
  }, 10);
});
```

### 3. Reabilita Input de Bipagem ao Fechar

```javascript
const finalizarModal = (valor) => {
  // Reabilita input de bipagem
  if (inputBipagem) {
    inputBipagem.disabled = false;  // ✅ Reabilita
    setTimeout(() => inputBipagem.focus(), 100);  // ✅ Retorna foco
  }
  resolve(valor);
};
```

### 4. Bloqueia Processamento de Bipagem

**Arquivo:** `main_v2.js` - `processBipagem()`

```javascript
async function processBipagem(ean) {
  try {
    // ✅ Ignora se há modal aberto
    if (document.querySelector('.modal-backdrop')) {
      Utils.Logger.info('Bipagem ignorada - modal aberto', { ean });
      return;
    }
    
    // ... resto do código
  }
}
```

### 5. Bloqueia Evento Keydown

**Arquivo:** `main_v2.js` - Event listener do input

```javascript
input.addEventListener('keydown', (ev) => {
  // ✅ Bloqueia se há modal aberto
  if (document.querySelector('.modal-backdrop')) {
    ev.preventDefault();
    ev.stopPropagation();
    return;
  }
  
  // ... resto do código
});
```

### 6. Atualiza Funções de Foco

**Arquivo:** `main_v2.js` - `configurarFocoAutomatico()` e `focarBipador()`

```javascript
function configurarFocoAutomatico(input) {
  input.addEventListener('blur', () => {
    // ✅ Não retorna foco se há modal aberto
    if (telaSeparacao.style.display !== 'none' && !document.querySelector('.modal-backdrop')) {
      setTimeout(() => input.focus(), 10);
    }
  });
  
  document.addEventListener('click', (e) => {
    if (telaSeparacao.style.display !== 'none') {
      const isModal = e.target.closest('.modal-backdrop');
      const isButton = e.target.tagName === 'BUTTON';
      const isInput = e.target.tagName === 'INPUT';  // ✅ Adicionado
      
      // ✅ Não foca se clicou em modal, botão ou input
      if (!isModal && !isButton && !isInput) {
        input.focus();
      }
    }
  });
}

function focarBipador() {
  const input = document.getElementById('inputBipagemGlobal');
  // ✅ Só foca se não há modal aberto
  if (input && telaSeparacao.style.display !== 'none' && !document.querySelector('.modal-backdrop')) {
    input.focus();
  }
}
```

---

## 🎯 Comportamento Correto Agora

### Quando Modal Abre:
1. ✅ Input de bipagem é desabilitado (`disabled = true`)
2. ✅ Foco é removido do input de bipagem
3. ✅ Foco é movido para input do modal
4. ✅ Foco fica preso no input do modal

### Durante Modal Aberto:
1. ✅ Teclas digitadas só afetam o input do modal
2. ✅ Enter no modal confirma valor
3. ✅ Tentativas de bipagem são ignoradas
4. ✅ Funções de foco automático não interferem

### Quando Modal Fecha:
1. ✅ Input de bipagem é reabilitado (`disabled = false`)
2. ✅ Foco retorna automaticamente ao input de bipagem
3. ✅ Sistema volta a processar bipagens normalmente

---

## 🔍 Verificações de Segurança

Todas as funções verificam se há modal aberto:
```javascript
if (document.querySelector('.modal-backdrop')) {
  // Modal aberto - não processar
  return;
}
```

---

## 📊 Arquivos Modificados

1. **ui-components.js**
   - `showUnidadesPorCaixaModal()` - Controle de foco do modal

2. **main_v2.js**
   - `configurarFocoAutomatico()` - Verifica modal antes de focar
   - `focarBipador()` - Verifica modal antes de focar
   - `processBipagem()` - Ignora bipagens quando modal aberto
   - Event listener keydown - Bloqueia teclas quando modal aberto

---

## ✨ Resultado

- ✅ Modal funciona independentemente
- ✅ Não há interferência entre modal e bipagem
- ✅ UX fluida e intuitiva
- ✅ Zero erros de processamento duplicado
- ✅ Foco sempre no lugar correto

---

## 🧪 Teste Manual

1. Carregue um CTRC
2. Bipe um item UN pela primeira vez
3. Modal aparece
4. Digite a quantidade (ex: 12)
5. Pressione Enter
6. ✅ Quantidade é salva
7. ✅ Modal fecha
8. ✅ Foco retorna ao bipador
9. ✅ Item é bipado corretamente
10. ✅ Próxima bipagem do mesmo item é automática (6 unidades)

---

**Status:** ✅ Implementado e Testado
