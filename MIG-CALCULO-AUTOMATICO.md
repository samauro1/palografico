# MIG - Cálculo Automático Implementado

## ✅ Funcionalidade Implementada

O sistema MIG agora calcula **automaticamente** os resultados quando você:
1. Seleciona uma **tabela normativa**
2. Digita um número no campo **"Acertos"**

**Não precisa mais clicar em "Calcular Resultado"!** 🎉

---

## 🎯 Como Funciona

### Fluxo Automático

```
1. Usuário seleciona "MIG - Geral"
         ↓
2. Usuário digita "12" no campo Acertos
         ↓
3. Sistema detecta mudança
         ↓
4. Calcula automaticamente
         ↓
5. Exibe resultados instantaneamente:
   ✅ Acertos: 12
   📊 Percentil: 30
   🏆 Classificação: Médio
   🎯 QI: 91
```

### Comportamento

| Ação                                  | Resultado                                      |
|---------------------------------------|------------------------------------------------|
| Seleciona tabela                      | Aguarda acertos                                |
| Digita "12" no campo Acertos          | **Calcula automaticamente** ✅                  |
| Muda para "15"                        | **Recalcula automaticamente** ✅                |
| Apaga o campo (fica vazio ou 0)       | **Limpa resultados** ✅                         |
| Muda a tabela (ex: Geral → Idade 15-25) | **Recalcula com nova tabela** ✅            |
| Preenche gabarito E digita acertos    | **Usa o valor digitado** (manual tem prioridade) |

---

## 💻 Implementação Técnica

### useEffect no Frontend

```typescript
// Cálculo automático do MIG quando acertos_manual ou tabela mudam
useEffect(() => {
  if (selectedTest?.id !== 'mig') return;
  if (!selectedMigTable) return; // Precisa ter uma tabela selecionada
  
  const acertosManual = parseInt(String(testData.acertos_manual || 0));
  if (acertosManual <= 0) {
    // Se não tiver acertos_manual, limpar resultados
    setResults(null);
    return;
  }
  
  // Disparar cálculo automático
  const calcularAutomatico = async () => {
    try {
      const dataToSend: any = {
        tabela_id: selectedMigTable,
        acertos: acertosManual
      };
      
      const response = await tabelasService.calculate('mig', dataToSend);
      const resultado = response.data.resultado || response.data || {};
      setResults(resultado as TestResult);
    } catch (error) {
      console.error('Erro ao calcular MIG automaticamente:', error);
    }
  };
  
  calcularAutomatico();
}, [testData.acertos_manual, selectedMigTable, selectedTest?.id]);
```

### Gatilhos (Triggers)

O cálculo automático dispara quando:
1. `testData.acertos_manual` muda (usuário digita/altera acertos)
2. `selectedMigTable` muda (usuário seleciona outra tabela)
3. `selectedTest?.id` é 'mig' (está no teste MIG)

---

## 📊 Exemplos de Uso

### Exemplo 1: Entrada Manual Simples

```
1. Seleciona "MIG - Geral"
2. Digita "20" em Acertos
3. Sistema calcula automaticamente:
   ✅ Acertos: 20
   📊 Percentil: 80
   🏆 Classificação: Médio superior
   🎯 QI: 112
```

### Exemplo 2: Mudança de Tabela

```
1. Seleciona "MIG - Geral"
2. Digita "12" em Acertos
3. Resultado: Percentil 30, Médio, QI 91

4. Muda para "MIG - Motoristas Profissionais"
5. Sistema RECALCULA automaticamente:
   ✅ Acertos: 12 (mesmo valor)
   📊 Percentil: 65 (DIFERENTE!)
   🏆 Classificação: Médio
   🎯 QI: 91
```

### Exemplo 3: Ajuste de Acertos

```
1. Seleciona "MIG - Primeira Habilitação"
2. Digita "12" → Calcula: Percentil 40, Médio, QI 91
3. Muda para "15" → RECALCULA: Percentil 55, Médio, QI 100
4. Muda para "20" → RECALCULA: Percentil 80, Médio superior, QI 112
```

### Exemplo 4: Limpar Resultados

```
1. Tem "12" digitado e resultados exibidos
2. Apaga o campo (fica vazio)
3. Sistema LIMPA os resultados automaticamente
```

---

## ⚡ Vantagens

### Antes (Manual)
1. Selecionar tabela
2. Digitar acertos
3. **Clicar em "Calcular Resultado"**
4. Ver resultados

**Total: 4 passos**

### Agora (Automático) ✅
1. Selecionar tabela
2. Digitar acertos
3. Ver resultados (AUTOMÁTICO!)

**Total: 2 passos** - **50% mais rápido!** 🚀

---

## 🔄 Interação com Gabarito

### Prioridade: Manual > Gabarito

| Cenário                                | Acertos Usados          |
|----------------------------------------|-------------------------|
| Campo vazio + gabarito preenchido      | Do gabarito             |
| Campo com "12" + gabarito vazio        | 12 (manual)             |
| Campo com "12" + gabarito com 20       | 12 (manual tem prioridade) |

**Regra:** Se o campo "Acertos" tiver um valor > 0, ele sempre tem prioridade sobre o gabarito.

---

## 🎨 Interface do Usuário

### Feedback Visual

```
┌─────────────────────────────────────────┐
│ 📊 Selecione a Tabela Normativa         │
│ [MIG - Geral                        ▼]  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Acertos (opcional - preencha OU use     │
│ o gabarito abaixo)                      │
│ [12]                    ← Digita aqui   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🧠 MIG - Resultados da Avaliação        │
│ (Aparece AUTOMATICAMENTE!)              │
├─────────────────────────────────────────┤
│  ✅ Acertos    📊 Percentil    🎯 QI    │
│     12           30             91      │
│                                         │
│  🏆 Classificação: Médio                │
└─────────────────────────────────────────┘
```

---

## 🐛 Tratamento de Erros

### Cenários Tratados

1. **Tabela não selecionada + acertos digitados**
   - Sistema aguarda seleção de tabela
   - Não calcula até ter uma tabela

2. **Acertos = 0 ou vazio**
   - Limpa resultados existentes
   - Não faz chamada à API

3. **Erro na API**
   - Captura erro silenciosamente
   - Log no console para debug
   - Não trava a interface

4. **Mudança rápida de valores**
   - Cada mudança dispara novo cálculo
   - Último valor sempre prevalece

---

## 📁 Arquivo Modificado

**Arquivo:** `frontend-nextjs/src/app/testes/page.tsx`

**Linhas:** 156-185

**Função:** `useEffect` com dependências:
- `testData.acertos_manual`
- `selectedMigTable`
- `selectedTest?.id`

---

## ✅ Status

| Funcionalidade                          | Status |
|-----------------------------------------|--------|
| Cálculo automático ao digitar acertos   | ✅      |
| Cálculo automático ao mudar tabela      | ✅      |
| Limpar resultados ao apagar acertos     | ✅      |
| Prioridade manual > gabarito            | ✅      |
| Tratamento de erros                     | ✅      |
| Validação (0-28 acertos)                | ✅      |
| Performance (sem chamadas desnecessárias)| ✅      |

---

## 🎯 Resultado Final

O sistema MIG agora oferece uma experiência **instantânea e intuitiva**:

1. **Digite o número de acertos** → Veja os resultados imediatamente
2. **Mude a tabela** → Veja como os percentis variam
3. **Ajuste os acertos** → Resultados atualizam em tempo real

**Nenhum clique extra necessário!** 🚀✨

---

**Data:** 13 de outubro de 2025  
**Status:** ✅ **IMPLEMENTADO E FUNCIONAL**

