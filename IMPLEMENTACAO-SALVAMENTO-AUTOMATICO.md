# Implementação - Salvamento Automático de Testes ✅

## 🎯 **Funcionalidade Implementada**

### **Requisitos:**
1. **Salvamento automático** quando teste é vinculado e calculado
2. **Aviso claro** quando modo anônimo está ativo
3. **Informação** de que teste anônimo não pode ser guardado

---

## 💾 **Salvamento Automático**

### **Como Funciona:**

#### **Modo VINCULADO (Padrão):**
```
1. Usuário seleciona modo "Vinculado"
2. Preenche CPF, Nome e Número do Laudo
3. Executa o teste (preenche dados)
4. Clica em "Calcular e Guardar"
5. ✅ Sistema AUTOMATICAMENTE:
   - Calcula o resultado
   - Busca/cria avaliação
   - Salva na base de dados
   - Mostra toast de sucesso
```

#### **Modo ANÔNIMO:**
```
1. Usuário seleciona modo "Anônimo"
2. ⚠️ Aparece aviso: "Não será guardado na base de dados"
3. Executa o teste (preenche dados)
4. Clica em "Calcular (Não Salva)"
5. ℹ️ Sistema:
   - Calcula o resultado
   - Mostra toast: "Modo Anônimo: Resultado não será guardado"
   - NÃO salva na base de dados
```

---

## 🎨 **Interface Atualizada**

### **Seleção de Modo:**

```
┌───────────────────────────────────────────────────────────┐
│  Modo de Avaliação                                        │
├───────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌───────────────────────┐    │
│  │  🔓                    │  │  ✅ 🔗                │    │
│  │  Avaliação Anônima    │  │  Avaliação Vinculada  │    │
│  │  Teste sem vincular   │  │  Vincular a paciente  │    │
│  │  ⚠️ Não será guardado │  │  ✅ Salvamento auto  │    │
│  └───────────────────────┘  └───────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

### **Aviso para Modo Anônimo:**

Quando selecionado "Anônimo", aparece um card de aviso:

```
┌───────────────────────────────────────────────────────────┐
│  ⚠️  Modo Anônimo Ativo                                   │
├───────────────────────────────────────────────────────────┤
│  • O resultado do teste NÃO será guardado na base de     │
│    dados                                                  │
│  • Não há como associar o teste a uma pessoa ou          │
│    avaliação                                              │
│  • Para salvar os resultados, mude para Avaliação        │
│    Vinculada                                              │
└───────────────────────────────────────────────────────────┘
```

### **Botão de Ação Atualizado:**

**Modo Vinculado:**
```
[💾 Calcular e Guardar]
```
- Texto claro: "Calcular e Guardar"
- Cor verde
- Indica que VAI salvar

**Modo Anônimo:**
```
[💾 Calcular (Não Salva)]
```
- Texto claro: "Calcular (Não Salva)"
- Cor verde (mantém consistência)
- Indica que NÃO vai salvar

### **Feedback ao Usuário:**

**Modo Vinculado - Ao Clicar:**
```
Toast: "✅ Teste salvo com sucesso na avaliação!"
```

**Modo Anônimo - Ao Clicar:**
```
Toast: "ℹ️ Modo Anônimo: Resultado não será guardado na base de dados (não há paciente associado)"
```

---

## 🔧 **Implementação Técnica**

### **1. handleCalculate → handleSaveTest:**

**Antes (Duplicação de Código):**
```javascript
const handleCalculate = async () => {
  // Lógica duplicada de preparar dados
  // Apenas calculava, não salvava
};

const handleSaveTest = async () => {
  // Mesma lógica de preparar dados
  // Calculava E salvava
};
```

**Depois (DRY - Don't Repeat Yourself):**
```javascript
const handleCalculate = async () => {
  // Simplesmente chama handleSaveTest
  await handleSaveTest();
};

const handleSaveTest = async () => {
  // Lógica única de cálculo e salvamento
  // Decide automaticamente se salva baseado no analysisType
};
```

### **2. Validação e Avisos:**

```javascript
const handleSaveTest = async () => {
  // 1. Validar teste selecionado
  if (!selectedTest) {
    toast.error('Nenhum teste selecionado');
    return;
  }

  // 2. Aviso para modo anônimo
  if (analysisType === 'anonymous') {
    toast.info('ℹ️ Modo Anônimo: Resultado não será guardado...', {
      duration: 4000,
    });
  }

  // 3. Validar dados obrigatórios se vinculado
  if (analysisType === 'linked') {
    if (!patientData.cpf || !patientData.nome || !patientData.numero_laudo) {
      toast.error('Preencha CPF, Nome e Número do Laudo...');
      return;
    }
  }

  // 4. Prosseguir com cálculo e salvamento
  ...
}
```

### **3. Preparação de Dados:**

```javascript
const dataToSend = {
  ...testData,
  analysisType,  // 'linked' ou 'anonymous'
  patientData: analysisType === 'linked' ? {
    ...patientData,
    foundPatient,
    data_avaliacao: new Date().toISOString().split('T')[0],
    numero_laudo: patientData.numero_laudo
  } : null
};
```

### **4. Backend Decide:**

```javascript
// Backend verifica o analysisType
if (dados.analysisType === 'linked' && dados.patientData && dados.patientData.foundPatient) {
  // ✅ SALVAR na base de dados
  await criarOuBuscarAvaliacao(...);
  await salvarResultadoTeste(...);
  resultado.salvo = true;
} else {
  // ❌ NÃO SALVAR
  console.log('⚠️ Não salvando - análise não vinculada ou dados incompletos');
}
```

---

## 📊 **Fluxo Completo**

### **Exemplo: Teste MIG Vinculado**

```
1. 🔗 Modo: Vinculado (selecionado)
   ↓
2. 📝 Preenche: CPF, Nome, Laudo
   ✅ Paciente encontrado automaticamente
   ↓
3. 🧠 Seleciona teste MIG
   ↓
4. 📋 Preenche gabarito (13 acertos)
   ↓
5. 💾 Clica "Calcular e Guardar"
   ↓
6. 🔄 Sistema processa:
   - Prepara dados com analysisType='linked'
   - Envia ao backend
   - Backend calcula resultado
   - Backend busca/cria avaliação (ID: 24)
   - Backend salva em resultados_mig
   - Retorna resultado com salvo=true
   ↓
7. ✅ Frontend mostra:
   - Resultado calculado
   - Toast: "✅ Teste salvo com sucesso na avaliação!"
   ↓
8. 📊 Banco de dados:
   - avaliacoes (ID: 24) com paciente_id=2
   - resultados_mig (avaliacao_id: 24, acertos: 13, ...)
```

### **Exemplo: Teste AC Anônimo**

```
1. 🔓 Usuário clica "Avaliação Anônima"
   ↓
2. ⚠️ Aparece aviso amarelo:
   "• O resultado não será guardado na base de dados
    • Não há como associar o teste a uma pessoa
    • Para salvar, mude para Avaliação Vinculada"
   ↓
3. 🧠 Seleciona teste AC
   ↓
4. 📋 Preenche dados manualmente
   ↓
5. 💾 Clica "Calcular (Não Salva)"
   ↓
6. 🔄 Sistema processa:
   - Prepara dados com analysisType='anonymous'
   - Envia ao backend
   - Backend calcula resultado
   - Backend NÃO salva (patientData = null)
   - Retorna apenas resultado calculado
   ↓
7. ℹ️ Frontend mostra:
   - Resultado calculado
   - Toast: "ℹ️ Modo Anônimo: Resultado não será guardado..."
   ↓
8. 📊 Banco de dados:
   - Nada salvo (como esperado)
```

---

## 🎯 **Mensagens ao Usuário**

### **Toast Messages:**

| Situação | Mensagem | Ícone | Duração |
|----------|----------|-------|---------|
| Vinculado - Sucesso | "✅ Teste salvo com sucesso na avaliação!" | ✅ | 3s |
| Anônimo - Info | "ℹ️ Modo Anônimo: Resultado não será guardado na base de dados (não há paciente associado)" | ℹ️ | 4s |
| Vinculado - Faltam dados | "❌ Preencha CPF, Nome e Número do Laudo para salvar" | ❌ | 3s |
| Erro geral | "❌ Erro ao salvar teste" | ❌ | 3s |

### **Visual Indicators:**

**Botão "Anônimo" Selecionado:**
- Border azul
- Background azul claro
- Texto: "⚠️ Não será guardado na base de dados"

**Botão "Vinculado" Selecionado:**
- Border verde
- Background verde claro
- Texto: "✅ Salvamento automático na base de dados"

**Status Footer:**
- Vinculado com paciente: "✅ Teste vinculado a: João Silva - Laudo: LAU-2025-001"
- Vinculado sem dados: "⚠️ Preencha os dados do paciente acima"
- Anônimo: "🔓 Teste anônimo - não será vinculado a paciente"

---

## ✅ **Validações Implementadas**

### **Antes de Calcular/Salvar:**

```javascript
1. ❌ Teste selecionado?
   → Se não: Toast "Nenhum teste selecionado"

2. ℹ️ Modo anônimo?
   → Se sim: Toast informativo (4 segundos)

3. 🔗 Modo vinculado?
   → Validar CPF, Nome e Laudo
   → Se faltando: Toast de erro + botão desabilitado

4. ✅ Tudo OK → Prosseguir
```

### **Feedback Backend (Logs):**

**Modo Vinculado:**
```
🔍 Verificando salvamento: { 
  analysisType: 'linked', 
  hasPatientData: true, 
  hasFoundPatient: true 
}
💾 Salvando resultado vinculado...
📋 Dados do paciente: { id: 2, nome: 'João Silva', ... }
📋 Dados da avaliação: { numero_laudo: 'LAU-2025-001' }
📋 Avaliação encontrada/criada: { id: 24 }
✅ Resultado do teste mig salvo na avaliação 24
```

**Modo Anônimo:**
```
🔍 Verificando salvamento: {
  analysisType: 'anonymous',
  hasPatientData: false,
  hasFoundPatient: false
}
⚠️ Não salvando - análise não vinculada ou dados incompletos
```

---

## 📋 **Mudanças nos Componentes**

### **1. Botões de Modo:**

**Avaliação Anônima:**
```jsx
<button onClick={() => setAnalysisType('anonymous')}>
  🔓
  Avaliação Anônima
  Teste sem vincular a paciente ou laudo
  ⚠️ Não será guardado na base de dados  {/* NOVO */}
</button>
```

**Avaliação Vinculada:**
```jsx
<button onClick={() => setAnalysisType('linked')}>
  🔗
  Avaliação Vinculada
  Vincular a paciente e número de laudo
  ✅ Salvamento automático na base de dados  {/* NOVO */}
</button>
```

### **2. Card de Aviso (Modo Anônimo):**

```jsx
{analysisType === 'anonymous' && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
    ⚠️ Modo Anônimo Ativo
    
    • O resultado não será guardado na base de dados
    • Não há como associar o teste a uma pessoa
    • Para salvar, mude para Avaliação Vinculada
  </div>
)}
```

### **3. Botão de Ação:**

**Texto Dinâmico:**
```jsx
<button onClick={handleSaveTest}>
  <Save />
  {isSaving 
    ? 'Salvando...' 
    : (analysisType === 'linked' 
        ? 'Calcular e Guardar'      {/* VINCULADO */}
        : 'Calcular (Não Salva)')   {/* ANÔNIMO */}
  }
</button>
```

### **4. handleSaveTest com Avisos:**

```javascript
const handleSaveTest = async () => {
  // Validar teste
  if (!selectedTest) {
    toast.error('Nenhum teste selecionado');
    return;
  }

  // ✅ NOVO: Aviso para modo anônimo
  if (analysisType === 'anonymous') {
    toast.info('ℹ️ Modo Anônimo: Resultado não será guardado na base de dados (não há paciente associado)', {
      duration: 4000,
    });
  }

  // Validar dados vinculados
  if (analysisType === 'linked') {
    if (!patientData.cpf || !patientData.nome || !patientData.numero_laudo) {
      toast.error('Preencha CPF, Nome e Número do Laudo...');
      return;
    }
  }

  // Processar...
};
```

---

## 🔄 **Fluxo de Salvamento Automático**

### **Quando é Ativado:**

**Gatilhos de Salvamento Automático:**
1. ✅ Usuário clica "Calcular e Guardar" (modo vinculado)
2. ✅ UseEffect de cálculo automático (quando campos mudam)
3. ✅ Qualquer ação que chame `handleCalculate()` ou `handleSaveTest()`

**Condições para Salvar:**
```javascript
analysisType === 'linked' 
  && patientData.cpf 
  && patientData.nome 
  && patientData.numero_laudo
  && foundPatient  // (opcional, mas ajuda)
```

### **Backend Validation:**

```javascript
// Backend valida antes de salvar
if (dados.analysisType === 'linked' 
    && dados.patientData 
    && dados.patientData.foundPatient) {
  
  ✅ SALVAR
  
} else {
  ⚠️ NÃO SALVAR
}
```

---

## 📊 **Comparação: Antes vs Depois**

### **Antes:**

```
Modo: Sempre "anonymous"
Botão: "Calcular Resultado" → Apenas calcula
Salvamento: Não havia
Status: Sem indicação visual
Aviso: Não havia
```

### **Depois:**

```
Modo: "linked" (padrão) ou "anonymous" (manual)
Botões de modo: Com avisos claros
Botão ação: "Calcular e Guardar" ou "Calcular (Não Salva)"
Salvamento: Automático quando vinculado
Status: Visual claro do modo ativo
Aviso: Card amarelo quando anônimo
Toast: Informativo baseado no modo
```

---

## ✅ **Teste da Implementação**

### **Teste 1: Salvamento Automático (Vinculado)**

1. ✅ Acesse /testes
2. ✅ Modo "Vinculado" deve estar selecionado (padrão)
3. ✅ Preencha CPF, Nome, Laudo
4. ✅ Selecione teste MIG
5. ✅ Preencha gabarito
6. ✅ Clique "Calcular e Guardar"
7. ✅ Verifique:
   - Toast: "✅ Teste salvo com sucesso!"
   - Backend log: "✅ Resultado do teste mig salvo na avaliação X"
   - Banco de dados: registro em resultados_mig

### **Teste 2: Modo Anônimo (Não Salva)**

1. ✅ Acesse /testes
2. ✅ Clique em "Avaliação Anônima"
3. ✅ Verifique card amarelo de aviso aparece
4. ✅ Selecione teste AC
5. ✅ Preencha dados
6. ✅ Clique "Calcular (Não Salva)"
7. ✅ Verifique:
   - Toast: "ℹ️ Modo Anônimo: Resultado não será guardado..."
   - Backend log: "⚠️ Não salvando - análise não vinculada"
   - Banco de dados: sem registro

### **Teste 3: Vinculação desde Pacientes**

1. ✅ Acesse /pacientes
2. ✅ Selecione um paciente
3. ✅ Crie nova avaliação
4. ✅ Redireciona para /testes com dados preenchidos
5. ✅ Modo "Vinculado" já selecionado
6. ✅ Dados já preenchidos
7. ✅ Execute um teste
8. ✅ Clique "Calcular e Guardar"
9. ✅ Verifique salvamento automático

---

## 🎉 **Resultado Final**

### **Implementação Completa:**

- ✅ **Salvamento automático** quando teste vinculado é calculado
- ✅ **Avisos claros** em todas as interfaces
- ✅ **Modo anônimo** com aviso de não salvamento
- ✅ **Modo vinculado** com confirmação de salvamento
- ✅ **Botões** com texto descritivo do comportamento
- ✅ **Toasts** informativos baseados no contexto
- ✅ **Card de aviso** quando anônimo está ativo
- ✅ **Validações** de dados obrigatórios
- ✅ **Feedback visual** claro em tempo real

### **Comportamento:**

**Modo Vinculado:**
- Calcula resultado ✅
- Salva automaticamente ✅
- Toast de confirmação ✅
- Registro no banco ✅

**Modo Anônimo:**
- Calcula resultado ✅
- Toast informativo ⚠️
- NÃO salva ❌
- Sem registro no banco ✅

**O sistema agora salva automaticamente todos os testes vinculados e avisa claramente quando está em modo anônimo!**
