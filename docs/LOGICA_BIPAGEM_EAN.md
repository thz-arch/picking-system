# 🔍 Lógica de Bipagem e EANs

## 📊 Visão Geral

O sistema de bipagem funciona por **código EAN** (código de barras). Cada item no CTRC tem um EAN único, e quando você bipa um produto, o sistema:

1. ✅ Procura o item pelo EAN bipado
2. ✅ Verifica se é produto "UN" (precisa configurar unidades por caixa)
3. ✅ Incrementa a quantidade bipada
4. ✅ Atualiza o status e a barra de progresso

---

## 🔎 Processo de Busca por EAN (3 Níveis)

### Nível 1: **Busca Exata**
```javascript
// Busca direta no array
item = this.itens.find(i => i.ean === eanBipado);
```

**Exemplo:**
- EAN na lista: `7891350000112`
- EAN bipado: `7891350000112`
- ✅ **Match direto!**

---

### Nível 2: **EAN com Dígitos Extras (Coletor)**

Alguns coletores/scanners adicionam dígitos antes e depois do EAN real.

```javascript
// Se EAN tem mais de 13 dígitos, processa
if (eanBipado.length > 13) {
  const eanProcessado = Utils.processarEanColetor(eanBipado);
  // Remove primeiro e último dígito
  item = this.itens.find(i => i.ean === eanProcessado);
}
```

**Função de Processamento:**
```javascript
function processarEanColetor(eanBipado) {
  // Remove primeiro e último dígito
  return eanBipado.substring(1, eanBipado.length - 1);
}
```

**Exemplo:**
- EAN na lista: `7891350000112`
- EAN bipado: `**0**7891350000112**9**` ← com dígitos extras
- Processado: `7891350000112` ← remove primeiro (0) e último (9)
- ✅ **Match!**

---

### Nível 3: **EAN da Lista Processado**

Às vezes o EAN da lista que vem do sistema tem dígitos extras.

```javascript
item = this.itens.find(i => {
  if (i.ean.length > 13) {
    const eanListaProcessado = Utils.processarEanColetor(i.ean);
    return eanBipado === eanListaProcessado;
  }
  return false;
});
```

**Exemplo:**
- EAN na lista: `017891350000112**5**` ← tem dígitos extras
- EAN bipado: `7891350000112`
- Processado da lista: `7891350000112`
- ✅ **Match!**

---

## 📦 Lógica de Incremento

### Produtos Normais (CX, UN sem config, etc.)

```javascript
// Incrementa +1 a cada bipagem
item.qtd_bipada += 1;
```

**Exemplo:**
```
Bipa 1x → qtd_bipada = 1
Bipa 2x → qtd_bipada = 2
Bipa 3x → qtd_bipada = 3
```

---

### Produtos com Unidade "UN" + Unidades por Caixa

#### **Primeira Bipagem:**
```javascript
if (item.unid.toUpperCase() === 'UN' && item.unidadesPorCaixa === null) {
  // Mostra modal para confirmar unidades por caixa
  return {
    sucesso: false,
    precisaConfirmarUnidades: true,
    item: item
  };
}
```

**Modal aparece:** *"Quantas unidades tem por caixa deste produto?"*

Usuário digita: **`6`** (6 unidades por caixa)

#### **Sistema Salva a Configuração:**
```javascript
definirUnidadesPorCaixa(item, 6) {
  // Salva globalmente por EAN
  this.unidadesPorCaixa[item.ean] = 6;
  
  // Aplica no item atual
  item.unidadesPorCaixa = 6;
}
```

#### **Próximas Bipagens:**
```javascript
let incremento = 1;
if (item.unid.toUpperCase() === 'UN' && item.unidadesPorCaixa) {
  incremento = item.unidadesPorCaixa; // incremento = 6
}

item.qtd_bipada += incremento; // +6 a cada bipagem
```

**Exemplo:**
```
Item: "BOZZANO ESPUMA" - Quantidade: 24 UN - Config: 6 un/caixa

Bipa 1x (caixa 1) → qtd_bipada = 6
Bipa 2x (caixa 2) → qtd_bipada = 12
Bipa 3x (caixa 3) → qtd_bipada = 18
Bipa 4x (caixa 4) → qtd_bipada = 24 ✅ Completo!
```

---

## 🎯 Fluxo Completo de Bipagem

```
┌─────────────────────────────────────────────────┐
│ 1. Scanner lê código de barras                 │
│    EAN: "07891350000112"                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. Sistema busca item (3 níveis)               │
│    ✓ Busca exata                                │
│    ✓ Processa EAN bipado (remove dígitos)      │
│    ✓ Processa EAN da lista                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
         ┌───────┴────────┐
         │ Item encontrado?│
         └───────┬─────┬───┘
                 │     │
              SIM│     │NÃO
                 │     └──► ❌ Erro: "EAN não encontrado"
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. Verifica unidade "UN"                        │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────┴────────────┐
         │ É UN sem config?   │
         └───┬─────────────┬──┘
             │             │
          SIM│             │NÃO (continua)
             │             │
             ▼             ▼
    ┌──────────────┐   ┌──────────────┐
    │ Modal:       │   │ 4. Verifica  │
    │ Qtd/caixa?   │   │ quantidade   │
    └──────┬───────┘   └──────┬───────┘
           │                  │
           ▼                  ▼
    ┌──────────────┐   ┌──────────────────┐
    │ Salva config │   │ Já completo?     │
    │ por EAN      │   └───┬──────────┬───┘
    └──────┬───────┘       │          │
           │             SIM│          │NÃO
           └────────────────┘          │
                 │                     ▼
                 ▼              ┌──────────────┐
         ┌──────────────┐      │ 5. Calcula   │
         │ 5. Calcula   │      │ incremento   │
         │ incremento   │      └──────┬───────┘
         └──────┬───────┘             │
                │                     │
                └─────────┬───────────┘
                          ▼
            ┌──────────────────────────┐
            │ incremento = 1 ou config │
            └──────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │ 6. Atualiza item         │
            │ qtd_bipada += incremento │
            │ status = calcula()       │
            └──────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │ 7. Atualiza UI           │
            │ - Texto: "X/Y"           │
            │ - Barra: progresso       │
            │ - Status badge           │
            └──────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │ 8. Salva progresso       │
            │ localStorage             │
            └──────────────────────────┘
```

---

## 🧮 Cálculo de Status

```javascript
calcularStatusItem(bipado, total) {
  if (bipado === 0) return 'Pendente';
  if (bipado >= total) return 'Finalizado';
  return 'Parcial';
}
```

**Exemplos:**
- `0/10` → 🟡 **Pendente**
- `5/10` → 🔵 **Parcial**
- `10/10` → 🟢 **Finalizado**

---

## 💾 Persistência

### **Progresso do Picking:**
Salvo em `localStorage` com chave `picking_progresso_v2`:
```json
{
  "ctrc": "GYN057522-4",
  "itens": [
    {
      "ean": "7891350000112",
      "qtd_bipada": 5,
      "quantidade": 19,
      "status": "Parcial",
      "unidadesPorCaixa": null
    }
  ]
}
```

### **Configuração Unidades por Caixa:**
Salvo em `localStorage` com chave `picking_unidades_por_caixa_v2`:
```json
{
  "7891350000112": 6,  // ← EAN: unidades
  "7891182991971": 12,
  "3789609490785": 24
}
```

**Vantagem:** Uma vez configurado, o EAN sempre usará a mesma quantidade!

---

## 🔒 Validações

### 1. **EAN Válido**
```javascript
function validarEAN(ean) {
  // Verifica se contém apenas dígitos
  if (!/^\d+$/.test(ean)) return false;
  
  // Aceita EAN-8 até EAN com extras (8-20 dígitos)
  if (ean.length < 8 || ean.length > 20) return false;
  
  return true;
}
```

### 2. **Quantidade Máxima**
```javascript
if (item.qtd_bipada >= item.quantidade) {
  // Erro: já completou
  return {
    sucesso: false,
    erro: 'QUANTIDADE_EXCEDIDA',
    precisaConfirmacao: true
  };
}
```

### 3. **Unidades por Caixa**
```javascript
const unidadesInt = parseInt(unidades);
if (isNaN(unidadesInt) || unidadesInt <= 0) {
  return { sucesso: false, erro: 'UNIDADES_INVALIDAS' };
}
```

---

## 📊 Exemplo Prático Completo

### **Cenário:**
Item: **BOZZANO ESPUMA BARBA 6x190ml**
- Código: `10909-3`
- EAN: `17891350000112`
- Quantidade: `19 UN`
- Unidade: `UN`

### **Processo:**

#### **1ª Bipagem:**
```
Scanner lê: "017891350000112" (com dígito extra)
↓
Sistema processa: "17891350000112" (remove primeiro 0)
↓
Encontra item: BOZZANO ESPUMA
↓
Detecta: unid = "UN" + sem config
↓
Modal: "Quantas unidades por caixa?"
Usuario: "6"
↓
Salva: unidadesPorCaixa[17891350000112] = 6
↓
Incrementa: qtd_bipada = 0 + 6 = 6
↓
Atualiza UI: "6/19" + barra 31%
```

#### **2ª Bipagem:**
```
Scanner lê: "017891350000112"
↓
Encontra item: BOZZANO ESPUMA
↓
Detecta: tem config (6 un/caixa)
↓
Incrementa: qtd_bipada = 6 + 6 = 12
↓
Atualiza UI: "12/19" + barra 63%
```

#### **3ª Bipagem:**
```
Scanner lê: "017891350000112"
↓
Incrementa: qtd_bipada = 12 + 6 = 18
↓
Atualiza UI: "18/19" + barra 94%
```

#### **4ª Bipagem:**
```
Scanner lê: "017891350000112"
↓
Verifica: 18 + 6 = 24 > 19 ❌
↓
Incrementa: qtd_bipada = 18 + 1 = 19 (ajusta para não exceder)
↓
Status: "Finalizado" 🟢
↓
Atualiza UI: "19/19" + barra 100%
```

---

## 🎯 Resumo

| Aspecto | Comportamento |
|---------|---------------|
| **Busca** | 3 níveis (exata, processada bipada, processada lista) |
| **Incremento Normal** | +1 por bipagem |
| **Incremento UN** | +X (X = unidades por caixa) |
| **Configuração** | Salva por EAN, persiste entre sessões |
| **Status** | Pendente → Parcial → Finalizado |
| **Validação** | EAN válido, quantidade não excede |
| **Persistência** | localStorage (progresso + configs) |

---

**Sistema robusto e flexível para diferentes tipos de produtos! 🎉**
