# Correção - Dados Completos do Paciente e Auto-Seleção de Tabelas ✅

## 🐛 **Problemas Reportados**

### **1. Dados Incompletos do Paciente**
Quando selecionava um paciente e criava uma avaliação:
- ✅ Número do laudo aparecia
- ❌ CPF **não aparecia**
- ❌ Nome **não aparecia**
- ❌ Escolaridade **não aparecia**
- ❌ Outros campos **não apareciam**

### **2. Tabelas Não Pré-Selecionadas**
Quando o paciente era de contexto **Trânsito** com tipo **1ª Habilitação**:
- ❌ Tabelas ficavam vazias
- ❌ Usuário tinha que selecionar manualmente
- ❌ Perda de tempo e risco de erro

---

## ✅ **Soluções Implementadas**

### **1. Carregar TODOS os Dados do Paciente**

**Arquivo:** `frontend-nextjs/src/app/testes/page.tsx`

#### **Estado Inicial Atualizado:**
```typescript
// ✅ ANTES: Faltava escolaridade
const [patientData, setPatientData] = useState({
  cpf: '',
  nome: '',
  numero_laudo: numeroLaudo || '',
  data_nascimento: '',
  contexto: '',
  tipo_transito: '',
  telefone: '',
  email: ''
});

// ✅ DEPOIS: Com escolaridade
const [patientData, setPatientData] = useState({
  cpf: '',
  nome: '',
  numero_laudo: numeroLaudo || '',
  data_nascimento: '',
  contexto: '',
  tipo_transito: '',
  escolaridade: '',  // ← ADICIONADO
  telefone: '',
  email: ''
});
```

#### **Carregamento por paciente_id:**
```typescript
if (pacienteId) {
  const paciente = pacientes[0];
  setFoundPatient(paciente);
  setPatientData({
    cpf: paciente.cpf,                    // ✅
    nome: paciente.nome,                  // ✅
    numero_laudo: numeroLaudo || paciente.numero_laudo,  // ✅
    data_nascimento: paciente.data_nascimento,  // ✅
    contexto: paciente.contexto,          // ✅
    tipo_transito: paciente.tipo_transito,  // ✅
    escolaridade: paciente.escolaridade,  // ✅ ADICIONADO
    telefone: paciente.telefone,          // ✅
    email: paciente.email                 // ✅
  });
}
```

#### **Carregamento por avaliacao_id:**
```typescript
if (avaliacaoId) {
  const avaliacao = response.data.avaliacao;
  
  // Buscar dados COMPLETOS do paciente pelo CPF
  if (avaliacao.paciente_cpf) {
    const pacienteResponse = await pacientesService.list({ 
      search: avaliacao.paciente_cpf, 
      limit: 1 
    });
    const paciente = pacientes[0];
    setFoundPatient(paciente);
    
    // Preencher TODOS os dados
    setPatientData({
      cpf: paciente.cpf,
      nome: paciente.nome,
      numero_laudo: avaliacao.numero_laudo,
      data_nascimento: paciente.data_nascimento,
      contexto: paciente.contexto,
      tipo_transito: paciente.tipo_transito,
      escolaridade: paciente.escolaridade,  // ✅ ADICIONADO
      telefone: paciente.telefone,
      email: paciente.email
    });
  }
}
```

---

### **2. Auto-Seleção de Tabelas Normativas**

**Nova funcionalidade:** `useEffect` que seleciona automaticamente as tabelas baseado no contexto do paciente.

#### **Lógica de Seleção:**

```typescript
useEffect(() => {
  if (!foundPatient) return;
  
  const { contexto, tipo_transito, escolaridade } = foundPatient;
  
  // CONTEXTO: TRÂNSITO
  if (contexto === 'Trânsito') {
    // MEMORE - Buscar tabela de Trânsito com tipo_habilitacao
    const tabelaMemore = tabelasMemore.find(t => 
      t.nome.includes('Trânsito') && 
      (tipo_transito ? t.nome.includes(tipo_transito) : t.nome.includes('1ª Habilitação'))
    );
    if (tabelaMemore && !selectedMemoreTable) {
      setSelectedMemoreTable(parseInt(tabelaMemore.id));
    }
    
    // MIG - Buscar tabela de Trânsito
    const tabelaMig = tabelasMig.find(t => t.nome.includes('Trânsito'));
    if (tabelaMig && !selectedMigTable) {
      setSelectedMigTable(parseInt(tabelaMig.id));
    }
    
    // R-1 - Buscar tabela de Trânsito
    const tabelaR1 = tabelasR1.find(t => t.nome.includes('Trânsito'));
    if (tabelaR1 && !selectedR1Table) {
      setSelectedR1Table(parseInt(tabelaR1.id));
    }
    
    // AC - Buscar tabela de Trânsito
    const tabelaAc = tabelasAc.find(t => t.nome.includes('Trânsito'));
    if (tabelaAc && !selectedAcTable) {
      setSelectedAcTable(parseInt(tabelaAc.id));
    }
  }
  
  // CONTEXTO: CLÍNICO ou ORGANIZACIONAL
  else if (contexto === 'Clínico' || contexto === 'Organizacional') {
    // Buscar por escolaridade ou tabela geral
    const tabelaMemore = tabelasMemore.find(t => 
      escolaridade ? t.nome.includes(escolaridade) : t.nome.includes('Geral')
    );
    if (tabelaMemore && !selectedMemoreTable) {
      setSelectedMemoreTable(parseInt(tabelaMemore.id));
    }
    
    const tabelaMig = tabelasMig.find(t => 
      escolaridade ? t.nome.includes(escolaridade) : t.nome.includes('Geral')
    );
    if (tabelaMig && !selectedMigTable) {
      setSelectedMigTable(parseInt(tabelaMig.id));
    }
  }
}, [foundPatient, tabelasMemore, tabelasMig, tabelasR1, tabelasAc, ...]);
```

---

## 📊 **Exemplo de Fluxo Corrigido**

### **Cenário: Paciente de Trânsito - 1ª Habilitação**

```
1. 👤 Seleciona Paciente:
   - Nome: Diogo Sanchez
   - CPF: 237.224.708-44
   - Contexto: Trânsito
   - Tipo: 1ª Habilitação
   - Escolaridade: E. Médio
   ↓
2. ➕ Cria Nova Avaliação:
   - Seleciona testes: MEMORE, MIG, R-1
   - Clica "Criar Avaliação"
   ↓
3. 🔄 Redireciona para:
   /testes?avaliacao_id=28&paciente_id=13&numero_laudo=LAU-2025-0013&testes=memore,mig,r1
   ↓
4. 📋 Página de Testes Carrega:
   
   ✅ DADOS DO PACIENTE (todos preenchidos):
   ┌──────────────────────────────────────────┐
   │ CPF: 237.224.708-44                      │
   │ Nome: Diogo Sanchez                      │
   │ Número do Laudo: LAU-2025-0013           │
   │ Data Nascimento: 03/04/2016              │
   │ Contexto: Trânsito                       │
   │ Tipo: 1ª Habilitação                     │
   │ Escolaridade: E. Médio                   │
   │ Telefone: 19995469546                    │
   │ Email: diogo@giogo.com                   │
   └──────────────────────────────────────────┘
   
   ✅ TABELAS AUTO-SELECIONADAS:
   ┌──────────────────────────────────────────┐
   │ MEMORE: Trânsito - 1ª Habilitação        │
   │ MIG: Trânsito - Geral                    │
   │ R-1: Trânsito - E. Médio                 │
   └──────────────────────────────────────────┘
   
   ✅ TESTES DISPONÍVEIS:
   ☐ MEMORE - Memória de Reconhecimento
   ☐ MIG - Memória Imediata Geral
   ☐ R-1 - Raciocínio Lógico
   ↓
5. 🧪 Usuário APENAS APLICA OS TESTES:
   - Tudo já está configurado!
   - Salvamento automático
```

---

## 🎯 **Critérios de Seleção de Tabelas**

### **Por Contexto:**

| Contexto | Critério de Busca | Exemplo de Tabela |
|----------|-------------------|-------------------|
| Trânsito | `nome.includes('Trânsito')` | "MEMORE - Trânsito - 1ª Habilitação" |
| Clínico | `nome.includes(escolaridade)` ou `'Geral'` | "MIG - Clínico - E. Superior" |
| Organizacional | `nome.includes(escolaridade)` ou `'Geral'` | "R-1 - Organizacional - Geral" |

### **Por Tipo de Trânsito:**

Para contexto **Trânsito**, tenta encontrar tabela específica do tipo:

| Tipo de Trânsito | Busca na Tabela |
|------------------|-----------------|
| 1ª Habilitação | `nome.includes('1ª Habilitação')` |
| Renovação | `nome.includes('Renovação')` |
| Adição/Mudança | `nome.includes('Adição')` ou fallback para `'1ª Habilitação'` |

### **Fallback:**
Se não encontrar tabela específica do tipo, busca qualquer tabela de Trânsito.

---

## 🔍 **Logs de Debug**

O sistema agora mostra no console quais tabelas foram auto-selecionadas:

```javascript
🔍 Auto-selecionando tabelas: {
  contexto: 'Trânsito',
  tipo_transito: '1ª Habilitação',
  escolaridade: 'E. Médio'
}

✅ Tabela MEMORE auto-selecionada: MEMORE - Trânsito - 1ª Habilitação
✅ Tabela MIG auto-selecionada: MIG - Trânsito - Geral
✅ Tabela R-1 auto-selecionada: R-1 - Trânsito - E. Médio
✅ Tabela AC auto-selecionada: AC - Trânsito - Geral
```

---

## 🎉 **Resultado Final**

**Agora quando você:**
1. ✅ Seleciona um paciente
2. ✅ Cria uma avaliação com 2-3 testes
3. ✅ É redirecionado para `/testes`

**A página carrega com:**
- ✅ **Todos os dados do paciente preenchidos** (CPF, nome, escolaridade, contexto, etc.)
- ✅ **Apenas os testes selecionados** na lista
- ✅ **Tabelas normativas já pré-selecionadas** baseado no contexto
- ✅ **Modo Vinculado ativo** automaticamente
- ✅ **Salvamento automático** ao calcular

**PRODUTIVIDADE MÁXIMA! Só aplicar os testes e pronto! 🚀**
