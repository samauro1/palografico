# Implementação - Vinculação Automática de Testes ✅

## 🎯 **Funcionalidade Implementada**

### **Requisitos:**
1. **Modo Vinculado por padrão** em todos os testes
2. **Modo Anônimo** apenas quando selecionado manualmente
3. **Auto-vinculação** quando vem de:
   - Página de Pacientes → Nova Avaliação → Testes
   - Página de Avaliações → Realizar Testes

---

## 🔗 **Fluxo de Vinculação Automática**

### **Cenário 1: Nova Avaliação desde Pacientes**

```
1. Usuário seleciona um paciente
2. Clica em "Nova Avaliação"
3. Preenche dados da avaliação
4. Clica em "Criar Avaliação"
5. Sistema cria avaliação no banco
6. ✅ Redireciona para /testes com parâmetros:
   - avaliacao_id
   - paciente_id
   - numero_laudo
7. Página de testes carrega com:
   - Modo "Vinculado" selecionado
   - Dados do paciente preenchidos
   - Número do laudo preenchido
   - Pronto para executar testes
```

### **Cenário 2: Realizar Testes desde Avaliação**

```
1. Usuário acessa detalhes de uma avaliação
2. Clica em "Realizar Testes"
3. ✅ Redireciona para /testes com parâmetros:
   - avaliacao_id
   - numero_laudo
4. Página de testes carrega com:
   - Modo "Vinculado" selecionado
   - Dados da avaliação preenchidos
   - Busca automática do paciente
   - Pronto para executar testes
```

### **Cenário 3: Acesso Direto à Página de Testes**

```
1. Usuário acessa /testes diretamente
2. ✅ Modo "Vinculado" é o padrão
3. Campos vazios aguardando preenchimento
4. Usuário pode:
   - Preencher CPF e vincular
   - OU mudar para "Anônimo" manualmente
```

---

## 📋 **Parâmetros de URL**

### **Estrutura dos Parâmetros:**

```
/testes?avaliacao_id=23&paciente_id=2&numero_laudo=LAU-2025-0001
```

**Parâmetros:**
- `avaliacao_id`: ID da avaliação (opcional)
- `paciente_id`: ID do paciente (opcional)
- `numero_laudo`: Número do laudo (opcional)

### **Leitura dos Parâmetros:**

```javascript
const searchParams = useSearchParams();
const pacienteId = searchParams.get('paciente_id');
const avaliacaoId = searchParams.get('avaliacao_id');
const numeroLaudo = searchParams.get('numero_laudo');
```

---

## 🔧 **Implementação Técnica**

### **1. Estado Inicial:**

```javascript
// Se veio com paciente_id ou avaliacao_id, o padrão é VINCULADO
const initialAnalysisType = (pacienteId || avaliacaoId) ? 'linked' : 'linked';

const [analysisType, setAnalysisType] = useState(initialAnalysisType);
const [patientData, setPatientData] = useState({
  numero_laudo: numeroLaudo || '',  // Preenche do URL se disponível
  // ... outros campos
});
```

### **2. useEffect para Carregar Dados:**

```javascript
useEffect(() => {
  const loadLinkedData = async () => {
    if (pacienteId) {
      // Buscar paciente por ID
      // Preencher dados automaticamente
    } else if (avaliacaoId) {
      // Buscar avaliação por ID
      // Preencher dados do paciente
      // Buscar paciente completo
    }
  };
  
  loadLinkedData();
}, [pacienteId, avaliacaoId, numeroLaudo]);
```

### **3. Modificação no handleTestSelect:**

```javascript
const handleTestSelect = (teste: Test) => {
  // NÃO resetar analysisType e patientData se veio vinculado via URL
  if (!pacienteId && !avaliacaoId) {
    setAnalysisType('linked'); // Sempre vinculado por padrão
    setPatientData({ ... }); // Limpar dados
    setFoundPatient(null);
  }
  // Resto do reset...
};
```

### **4. Redirecionamento ao Criar Avaliação:**

```javascript
onSuccess: (response) => {
  const avaliacaoId = response.data?.avaliacao?.id;
  if (avaliacaoId && selectedPatient) {
    router.push(
      `/testes?avaliacao_id=${avaliacaoId}&paciente_id=${selectedPatient.id}&numero_laudo=${avaliacaoData.numero_laudo}`
    );
  }
}
```

### **5. Redirecionamento desde Detalhes da Avaliação:**

```javascript
<button
  onClick={() => router.push(
    `/testes?avaliacao_id=${avaliacaoId}&numero_laudo=${avaliacao.numero_laudo}`
  )}
>
  Realizar Testes
</button>
```

---

## 🎨 **Interface Atualizada**

### **Modo Padrão: VINCULADO**

```
┌─────────────────────────────────────────────────────────┐
│ Modo de Avaliação                                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │  🔓 Anônima      │    │ ✅ 🔗 Vinculada  │          │
│  │  (não vinculado) │    │  (PADRÃO)        │          │
│  └──────────────────┘    └──────────────────┘          │
│                                                         │
│  Dados da Avaliação:                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ CPF Paciente │ │ Nome         │ │ Nº Laudo     │  │
│  │ (preenchido) │ │ (preenchido) │ │ (preenchido) │  │
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                         │
│  ✅ Paciente encontrado: João Silva - CPF: 111...     │
└─────────────────────────────────────────────────────────┘
```

### **Quando Vem de Nova Avaliação:**

```
Pacientes → Seleciona João Silva → Nova Avaliação → Criar
                                                        ↓
                                              Redireciona para:
                                   /testes?avaliacao_id=23&paciente_id=2&numero_laudo=LAU-2025-0001
                                                        ↓
                                            Página de Testes:
                                            - Modo: VINCULADO ✅
                                            - Paciente: João Silva ✅
                                            - Laudo: LAU-2025-0001 ✅
```

### **Quando Vem de Detalhes da Avaliação:**

```
Avaliações → LAU-2025-0001 → Realizar Testes
                                    ↓
                          Redireciona para:
              /testes?avaliacao_id=14&numero_laudo=LAU-2025-0001
                                    ↓
                        Página de Testes:
                        - Modo: VINCULADO ✅
                        - Busca paciente automaticamente ✅
                        - Laudo: LAU-2025-0001 ✅
```

---

## ✅ **Validações Implementadas**

### **1. Verificação de Origem:**
```javascript
if (pacienteId || avaliacaoId) {
  // Veio vinculado → modo linked
} else {
  // Acesso direto → modo linked (padrão)
}
```

### **2. Preservação de Dados:**
```javascript
handleTestSelect() {
  if (!pacienteId && !avaliacaoId) {
    // Apenas reseta se não veio vinculado
    setPatientData({ ... });
  }
}
```

### **3. Carregamento Automático:**
- Paciente: Busca por `paciente_id`
- Avaliação: Busca por `avaliacao_id` + busca paciente por CPF
- Dados preenchidos automaticamente

---

## 🔒 **Comportamento dos Modos**

### **Modo VINCULADO (Padrão):**
- ✅ **Selecionado automaticamente**
- ✅ **Campos obrigatórios:** CPF, Nome, Laudo
- ✅ **Salvamento:** Ativo
- ✅ **Dados preenchidos** se veio de paciente/avaliação

### **Modo ANÔNIMO (Manual):**
- ❌ **Não é padrão**
- ❌ **Precisa selecionar manualmente**
- ❌ **Não salva** no banco de dados
- ℹ️ **Apenas calcula** resultados

---

## 🚀 **Navegação Atualizada**

### **Arquivo: `frontend-nextjs/src/app/pacientes/page.tsx`**

**Função modificada:**
```javascript
createAvaliacaoMutation.onSuccess(response) {
  const avaliacaoId = response.data?.avaliacao?.id;
  router.push(
    `/testes?avaliacao_id=${avaliacaoId}&paciente_id=${selectedPatient.id}&numero_laudo=${avaliacaoData.numero_laudo}`
  );
}
```

### **Arquivo: `frontend-nextjs/src/app/avaliacoes/[id]/page.tsx`**

**Botão modificado:**
```javascript
<button onClick={() => router.push(
  `/testes?avaliacao_id=${avaliacaoId}&numero_laudo=${avaliacao.numero_laudo}`
)}>
  Realizar Testes
</button>
```

### **Arquivo: `frontend-nextjs/src/app/testes/page.tsx`**

**Hooks adicionados:**
```javascript
const searchParams = useSearchParams();
const pacienteId = searchParams.get('paciente_id');
const avaliacaoId = searchParams.get('avaliacao_id');
const numeroLaudo = searchParams.get('numero_laudo');

useEffect(() => {
  // Carregar dados automaticamente
  loadLinkedData();
}, [pacienteId, avaliacaoId, numeroLaudo]);
```

---

## 📊 **Exemplo Completo de Fluxo**

### **Passo a Passo:**

```
1. 👤 Página de Pacientes
   ↓ Seleciona: João Silva (ID: 2, CPF: 111.222.333-44)
   
2. ➕ Clica "Nova Avaliação"
   ↓ Preenche: Laudo LAU-2025-0001, Data 17/10/2025
   
3. ✅ Clica "Criar Avaliação"
   ↓ Backend cria avaliação (ID: 23)
   ↓ Retorna: { id: 23, numero_laudo: 'LAU-2025-0001' }
   
4. 🔀 Redireciona para:
   /testes?avaliacao_id=23&paciente_id=2&numero_laudo=LAU-2025-0001
   
5. 📄 Página de Testes Carrega:
   ✅ Modo: VINCULADO (botão verde selecionado)
   ✅ CPF: 111.222.333-44 (carregado automaticamente)
   ✅ Nome: João Silva (carregado automaticamente)
   ✅ Laudo: LAU-2025-0001 (da URL)
   ✅ Toast: "✅ Paciente encontrado: João Silva - CPF: 111.222.333-44"
   
6. 🧠 Usuário executa teste MIG
   ↓ Preenche gabarito, acerta 13 questões
   
7. 💾 Clica "Guardar Teste"
   ✅ Sistema salva em resultados_mig
   ✅ Vincula ao avaliacao_id = 23
   ✅ Toast: "✅ Teste salvo com sucesso na avaliação!"
   
8. 📊 Backend Log:
   "💾 Salvando resultado vinculado..."
   "📋 Dados do paciente: { id: 2, nome: 'João Silva', ... }"
   "✅ Resultado do teste mig salvo na avaliação 23"
```

---

## ✅ **Mudanças Implementadas**

### **1. Modo Padrão Alterado:**

**Antes:**
```javascript
const [analysisType, setAnalysisType] = useState('anonymous');
```

**Depois:**
```javascript
const initialAnalysisType = 'linked'; // SEMPRE vinculado por padrão
const [analysisType, setAnalysisType] = useState(initialAnalysisType);
```

### **2. Carregamento Automático de Dados:**

**Adicionado useEffect:**
```javascript
useEffect(() => {
  if (pacienteId) {
    // Buscar e preencher dados do paciente
  } else if (avaliacaoId) {
    // Buscar e preencher dados da avaliação + paciente
  }
}, [pacienteId, avaliacaoId, numeroLaudo]);
```

### **3. Navegação com Parâmetros:**

**Pacientes → Testes:**
```javascript
router.push(`/testes?avaliacao_id=${id}&paciente_id=${pid}&numero_laudo=${laudo}`);
```

**Avaliações → Testes:**
```javascript
router.push(`/testes?avaliacao_id=${id}&numero_laudo=${laudo}`);
```

### **4. Preservação de Dados:**

**handleTestSelect modificado:**
```javascript
// NÃO resetar analysisType e patientData se veio vinculado via URL
if (!pacienteId && !avaliacaoId) {
  setAnalysisType('linked');
  setPatientData({ ... });
}
```

---

## 🎯 **Comportamento dos Modos**

### **Modo VINCULADO (Padrão):**

**Características:**
- ✅ **Selecionado por padrão** sempre
- ✅ **Botão verde** quando ativo
- ✅ **Campos obrigatórios** mostrados
- ✅ **Salvamento automático** ao clicar "Guardar"
- ✅ **Dados preenchidos** se veio de paciente/avaliação

**Validações:**
- CPF obrigatório
- Nome obrigatório
- Número do Laudo obrigatório
- Botão "Guardar" desabilitado se faltar dados

### **Modo ANÔNIMO (Opcional):**

**Características:**
- ❌ **NÃO é padrão**
- ⚠️ **Usuário precisa selecionar** manualmente
- 🔓 **Botão azul** quando ativo
- ❌ **Não salva** no banco de dados
- ℹ️ **Apenas calcula** resultados

**Uso:**
- Demonstrações
- Testes rápidos
- Simulações
- Treinamento

---

## 📱 **Interface Visual**

### **Quando Veio Vinculado:**

```
┌─────────────────────────────────────────────────────────────┐
│ Modo de Avaliação                                           │
├─────────────────────────────────────────────────────────────┤
│  [ 🔓 Anônima ]    [ ✅ 🔗 Vinculada ]                      │
│    (cinza)             (verde ativo)                        │
│                                                             │
│  Dados da Avaliação:                                        │
│  CPF: 111.222.333-44  Nome: João Silva  Laudo: LAU-2025-001│
│                                                             │
│  ✅ Paciente encontrado: João Silva - CPF: 111.222.333-44  │
└─────────────────────────────────────────────────────────────┘
```

### **Acesso Direto (Sem Parâmetros):**

```
┌─────────────────────────────────────────────────────────────┐
│ Modo de Avaliação                                           │
├─────────────────────────────────────────────────────────────┤
│  [ 🔓 Anônima ]    [ ✅ 🔗 Vinculada ]                      │
│    (cinza)             (verde ativo)                        │
│                                                             │
│  Dados da Avaliação:                                        │
│  CPF: ___________  Nome: ___________  Laudo: ____________  │
│                                                             │
│  (Campos vazios aguardando preenchimento)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ **Teste da Implementação**

### **Teste 1: Nova Avaliação desde Pacientes**

1. ✅ Acesse /pacientes
2. ✅ Selecione um paciente
3. ✅ Clique "Nova Avaliação"
4. ✅ Preencha dados e clique "Criar"
5. ✅ Deve redirecionar para /testes com dados preenchidos
6. ✅ Modo "Vinculado" deve estar selecionado
7. ✅ Dados do paciente devem aparecer automaticamente

### **Teste 2: Realizar Testes desde Avaliação**

1. ✅ Acesse /avaliacoes
2. ✅ Clique em "Ver" em uma avaliação
3. ✅ Clique "Realizar Testes"
4. ✅ Deve redirecionar para /testes com dados preenchidos
5. ✅ Modo "Vinculado" deve estar selecionado
6. ✅ Número do laudo deve aparecer automaticamente

### **Teste 3: Acesso Direto**

1. ✅ Acesse /testes diretamente
2. ✅ Modo "Vinculado" deve estar selecionado por padrão
3. ✅ Campos devem estar vazios
4. ✅ Usuário pode preencher ou mudar para "Anônimo"

### **Teste 4: Salvamento**

1. ✅ Execute um teste em modo vinculado
2. ✅ Clique "Guardar Teste"
3. ✅ Verifique logs do backend:
   - "💾 Salvando resultado vinculado..."
   - "✅ Resultado do teste X salvo na avaliação Y"
4. ✅ Toast de sucesso deve aparecer

---

## 🎉 **Implementação Completa**

**Todas as funcionalidades solicitadas foram implementadas:**

- ✅ **Modo Vinculado por padrão** em todos os casos
- ✅ **Modo Anônimo** apenas quando selecionado manualmente
- ✅ **Auto-vinculação** desde página de pacientes
- ✅ **Auto-vinculação** desde página de avaliações
- ✅ **Carregamento automático** de dados via URL
- ✅ **Preservação de dados** ao mudar de teste
- ✅ **Salvamento automático** em modo vinculado
- ✅ **Feedback visual** claro do modo selecionado

**O sistema agora vincula automaticamente os testes aos pacientes/avaliações quando apropriado!**
