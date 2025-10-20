# 📅 Guia: Registro Automático de Reagendamento

## ✅ FUNCIONALIDADE IMPLEMENTADA

### **Sistema de Registro Automático:**
Quando um usuário modifica a data/hora de um agendamento, o sistema **automaticamente** adiciona um registro nas **Observações** com:
- ✅ Data e hora da mudança
- ✅ Data original do agendamento
- ✅ Nova data do agendamento
- ✅ Histórico completo de todas as alterações

---

## 🔧 COMO FUNCIONA

### **1️⃣ DETECÇÃO AUTOMÁTICA:**

O sistema compara a data original com a nova data ao salvar:

```javascript
const dataOriginal = selectedAgendamento.data_agendamento;
const dataAtual = formData.data_agendamento;

if (dataOriginal !== dataAtual) {
  // Data foi alterada - registrar automaticamente
}
```

---

### **2️⃣ REGISTRO AUTOMÁTICO:**

Quando detecta uma mudança, o sistema adiciona automaticamente às observações:

```
[20/10/2025, 15:30:45] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00
```

#### **Formato do Registro:**
```
[Data/Hora do registro] Reagendamento: Data original: [data antiga] → Nova data: [data nova]
```

---

### **3️⃣ HISTÓRICO COMPLETO:**

Todas as alterações ficam registradas em sequência:

```
Primeira observação do usuário...

[20/10/2025, 10:00:00] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00

[22/10/2025, 14:30:00] Reagendamento: Data original: 05/10/2025, 14:00 → Nova data: 10/10/2025, 09:00

Mais observações...
```

---

## 🎯 CASOS DE USO

### **Caso 1: Primeira Mudança de Data**

#### **Situação Inicial:**
- **Agendamento:** WESLEY OLIVEIRA PEREIRA DA SILVA
- **Data original:** 03/10/2025, 08:00
- **Observações:** (vazio)

#### **Usuário altera para:**
- **Nova data:** 05/10/2025, 14:00

#### **Resultado nas Observações:**
```
[20/10/2025, 15:30:45] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00
```

---

### **Caso 2: Segunda Mudança de Data**

#### **Situação Atual:**
- **Data atual:** 05/10/2025, 14:00
- **Observações:**
```
[20/10/2025, 15:30:45] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00
```

#### **Usuário altera para:**
- **Nova data:** 10/10/2025, 09:00

#### **Resultado nas Observações:**
```
[20/10/2025, 15:30:45] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00

[22/10/2025, 10:15:30] Reagendamento: Data original: 05/10/2025, 14:00 → Nova data: 10/10/2025, 09:00
```

---

### **Caso 3: Com Observações Existentes**

#### **Situação Inicial:**
- **Observações existentes:**
```
Paciente solicitou agendamento urgente.
Trazer documentos RG e CPF.
```

#### **Usuário altera data:**
- **De:** 03/10/2025, 08:00
- **Para:** 05/10/2025, 14:00

#### **Resultado nas Observações:**
```
Paciente solicitou agendamento urgente.
Trazer documentos RG e CPF.

[20/10/2025, 15:30:45] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00
```

---

## 🧪 TESTE DA FUNCIONALIDADE

### **Passo 1: Criar Agendamento**

1. Acesse: `http://192.168.6.230:3000/agenda`
2. Clique: **+ Novo Agendamento**
3. Preencha:
   - **Nome:** WESLEY OLIVEIRA PEREIRA DA SILVA
   - **CPF:** 376.167.778-21
   - **Telefone:** (95) 9009-9326
   - **E-mail:** oliveirapereiradasilvawesley@gmail.com
   - **Data/Hora:** 03/10/2025, 08:00
   - **Contexto:** Trânsito
   - **Tipo de Trânsito:** 1ª Habilitação
4. Clique: **Salvar**

---

### **Passo 2: Editar e Alterar Data**

1. Localize o agendamento de WESLEY
2. Clique no ícone **✏️ Editar**
3. Altere a data:
   - **De:** 03/10/2025, 08:00
   - **Para:** 05/10/2025, 14:00
4. Clique: **Salvar**

---

### **Passo 3: Verificar Registro**

1. Clique novamente em **✏️ Editar** no agendamento de WESLEY
2. Vá até o campo **Observações**
3. Verifique o registro automático:

```
[20/10/2025, 15:30:45] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00
```

---

### **Passo 4: Alterar Data Novamente**

1. Com o modal de edição aberto
2. Altere novamente a data:
   - **De:** 05/10/2025, 14:00
   - **Para:** 10/10/2025, 09:00
3. Clique: **Salvar**

---

### **Passo 5: Verificar Histórico Completo**

1. Clique em **✏️ Editar** novamente
2. Veja o histórico completo em **Observações**:

```
[20/10/2025, 15:30:45] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00

[20/10/2025, 15:45:20] Reagendamento: Data original: 05/10/2025, 14:00 → Nova data: 10/10/2025, 09:00
```

---

## 📋 FORMATO DO REGISTRO

### **Componentes do Registro:**

```
[Data/Hora do registro] Reagendamento: Data original: [data antiga] → Nova data: [data nova]
```

#### **1. Timestamp da Mudança:**
```javascript
[20/10/2025, 15:30:45]
```
- Formato: DD/MM/AAAA, HH:MM:SS
- Registra quando a mudança foi feita

#### **2. Tipo de Ação:**
```
Reagendamento:
```
- Indica claramente que é uma mudança de data

#### **3. Data Original:**
```
Data original: 03/10/2025, 08:00
```
- Formato: DD/MM/AAAA, HH:MM
- Data/hora antes da alteração

#### **4. Seta de Mudança:**
```
→
```
- Indicador visual de transformação

#### **5. Nova Data:**
```
Nova data: 05/10/2025, 14:00
```
- Formato: DD/MM/AAAA, HH:MM
- Data/hora após a alteração

---

## 🔍 DETALHES TÉCNICOS

### **Código Implementado:**

```javascript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (selectedAgendamento) {
    // Comparar datas
    const dataOriginal = selectedAgendamento.data_agendamento.slice(0, 16);
    const dataAtual = formData.data_agendamento;
    
    let dataToSubmit = { ...formData };
    
    if (dataOriginal !== dataAtual) {
      // Formatar datas para exibição
      const dataOriginalFormatada = new Date(dataOriginal).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const dataNovaFormatada = new Date(dataAtual).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Criar registro
      const registroMudanca = `\n\n[${new Date().toLocaleString('pt-BR')}] Reagendamento: Data original: ${dataOriginalFormatada} → Nova data: ${dataNovaFormatada}`;
      
      // Adicionar às observações existentes
      dataToSubmit = {
        ...formData,
        observacoes: (formData.observacoes || '') + registroMudanca
      };
    }
    
    updateMutation.mutate({ id: selectedAgendamento.id, data: dataToSubmit });
  } else {
    createMutation.mutate(formData);
  }
};
```

---

## ✅ BENEFÍCIOS

### **Rastreabilidade:**
- ✅ **Histórico completo** de todas as alterações
- ✅ **Data e hora exatas** de cada mudança
- ✅ **Auditoria** de reagendamentos

### **Automação:**
- ✅ **Sem intervenção manual** - Registro automático
- ✅ **Nunca esquece** - Sempre registra
- ✅ **Consistência** - Formato padronizado

### **Transparência:**
- ✅ **Informação clara** - Fácil de entender
- ✅ **Cronologia** - Ordem das mudanças
- ✅ **Evidência** - Prova de alterações

---

## 📊 EXEMPLOS PRÁTICOS

### **Exemplo 1: Reagendamento Simples**

```
Observações:

[20/10/2025, 10:30:00] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00
```

---

### **Exemplo 2: Múltiplos Reagendamentos**

```
Observações:

[19/10/2025, 14:00:00] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 04/10/2025, 10:00

[20/10/2025, 09:15:00] Reagendamento: Data original: 04/10/2025, 10:00 → Nova data: 05/10/2025, 14:00

[21/10/2025, 16:30:00] Reagendamento: Data original: 05/10/2025, 14:00 → Nova data: 10/10/2025, 08:00
```

---

### **Exemplo 3: Com Observações Manuais**

```
Observações:

Paciente solicitou reagendamento por motivo de trabalho.
Preferência: período da tarde.

[20/10/2025, 10:30:00] Reagendamento: Data original: 03/10/2025, 08:00 → Nova data: 05/10/2025, 14:00

Confirmado por telefone. Paciente ciente do novo horário.
```

---

## ⚠️ NOTAS IMPORTANTES

### **O Sistema NÃO Registra:**
- ❌ Alterações em outros campos (nome, telefone, etc.)
- ❌ Mudanças de status
- ❌ Se a data não foi alterada

### **O Sistema APENAS Registra:**
- ✅ Alterações na data/hora de agendamento
- ✅ Automaticamente
- ✅ Sem apagar observações existentes

---

## 🎯 CASOS ESPECIAIS

### **1. Editar sem Alterar Data:**
- **Resultado:** Nenhum registro adicionado
- **Observações:** Permanecem inalteradas

### **2. Alterar Data Múltiplas Vezes na Mesma Edição:**
- **Resultado:** Registra apenas a última mudança
- **Comparação:** Sempre com a data original do banco

### **3. Criar Novo Agendamento:**
- **Resultado:** Nenhum registro
- **Motivo:** Não há data anterior para comparar

---

**Sistema Palográfico - Registro Automático de Reagendamento** 📅✅

**Histórico completo de alterações de datas!** 🕒📝
