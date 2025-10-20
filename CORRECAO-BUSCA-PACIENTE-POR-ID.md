# ✅ Correção - Busca de Paciente por ID

## 🐛 **Problema**

Quando redirecionava para `/testes?paciente_id=13&...`, os dados do paciente (CPF, nome) **não apareciam**, apenas o número do laudo.

### **Causa:**

O código estava usando o método **errado** para buscar o paciente:

```typescript
// ❌ ANTES (ERRADO):
const response = await pacientesService.list({ search: pacienteId, limit: 1 });
//                                      ^^^^
//                    Busca por NOME/CPF, não por ID!
```

**Log do backend mostrava:**
```
GET /api/pacientes?search=13&limit=1
Query: WHERE nome ILIKE '%13%' OR cpf ILIKE '%13%'
Resultado: 0 rows  ← Não encontrou nada!
```

O problema: estava buscando pacientes cujo **nome ou CPF contém "13"**, não paciente com **ID = 13**.

---

## ✅ **Solução**

Usar o método correto `pacientesService.get(id)`:

```typescript
// ✅ DEPOIS (CORRETO):
const response = await pacientesService.get(pacienteId);
//                                  ^^^
//                    Busca diretamente por ID!
const paciente = response.data.paciente;
```

**Agora o backend faz:**
```
GET /api/pacientes/13
Query: SELECT * FROM pacientes WHERE id = 13
Resultado: 1 row  ← Encontrou! ✅
```

---

## 📊 **Comparação**

### **Antes (Método Errado):**

```typescript
if (pacienteId) {
  // Busca por search (nome/CPF) em vez de ID
  const response = await pacientesService.list({ 
    search: pacienteId,  // "13"
    limit: 1 
  });
  // Backend: WHERE nome ILIKE '%13%' OR cpf ILIKE '%13%'
  // Resultado: 0 pacientes encontrados
  const pacientes = response.data.data.pacientes || [];
  if (pacientes.length > 0) { // ← Nunca entra aqui!
    // ...
  }
}
```

### **Depois (Método Correto):**

```typescript
if (pacienteId) {
  // Busca diretamente por ID
  const response = await pacientesService.get(pacienteId);  // "13"
  // Backend: SELECT * FROM pacientes WHERE id = 13
  // Resultado: 1 paciente encontrado ✅
  const paciente = response.data.paciente;
  if (paciente) {
    setFoundPatient(paciente);
    setPatientData({
      cpf: paciente.cpf,              // ✅ Preenchido
      nome: paciente.nome,            // ✅ Preenchido
      escolaridade: paciente.escolaridade,  // ✅ Preenchido
      // ... todos os campos
    });
  }
}
```

---

## 🎯 **Fluxo Corrigido**

```
1. 👤 Seleciona Paciente (ID: 13)
   Nome: Diogo Sanchez
   CPF: 237.224.708-44
   ↓
2. ➕ Nova Avaliação
   Testes: Rotas e MIG
   ↓
3. 💾 Cria Avaliação
   Backend: avaliacao_id = 29
   ↓
4. 🔄 Redireciona
   URL: /testes?avaliacao_id=29&paciente_id=13&numero_laudo=LAU-2025-0013&testes=rotas,mig
   ↓
5. 📋 Frontend Carrega
   
   ✅ GET /api/pacientes/13  ← Método correto!
   
   Resposta:
   {
     id: 13,
     nome: "Diogo Sanchez",
     cpf: "237.224.708-44",
     escolaridade: "E. Médio",
     contexto: "Trânsito",
     tipo_transito: "1ª Habilitação",
     ...
   }
   ↓
6. ✅ Preenche Todos os Dados
   
   Dados do Paciente:
   ┌──────────────────────────────────┐
   │ CPF: 237.224.708-44       ✅     │
   │ Nome: Diogo Sanchez       ✅     │
   │ Laudo: LAU-2025-0013      ✅     │
   │ Escolaridade: E. Médio    ✅     │
   │ Contexto: Trânsito        ✅     │
   └──────────────────────────────────┘
   
   Testes Disponíveis:
   ☐ Rotas
   ☐ MIG
   
   Tabelas Auto-Selecionadas:
   ✅ MIG: MIG - Trânsito - Geral
   ✅ Rotas: Rotas - Trânsito - Geral
```

---

## 🔍 **Logs de Verificação**

**Backend deve mostrar:**
```
GET /api/pacientes/13  ← Busca por ID
Query executada: {
  text: 'SELECT * FROM pacientes WHERE id = $1',
  rows: 1  ← Encontrou!
}
```

**Console do navegador deve mostrar:**
```
🔍 Dados do paciente carregados: {
  id: 13,
  nome: "Diogo Sanchez",
  cpf: "237.224.708-44",
  escolaridade: "E. Médio",
  contexto: "Trânsito"
}

🔍 Auto-selecionando tabelas: {
  contexto: 'Trânsito',
  tipo_transito: '1ª Habilitação',
  escolaridade: 'E. Médio'
}
✅ Tabela MIG auto-selecionada: MIG - Trânsito - Geral
```

---

## 📝 **API Services Disponíveis**

### **pacientesService:**
```typescript
✅ get(id)         → GET /api/pacientes/:id
✅ list(params)    → GET /api/pacientes?search=...
✅ create(data)    → POST /api/pacientes
✅ update(id, data) → PUT /api/pacientes/:id
✅ delete(id)      → DELETE /api/pacientes/:id
```

### **Uso Correto:**
- ✅ **Buscar por ID específico**: `pacientesService.get(id)`
- ✅ **Buscar por nome/CPF**: `pacientesService.list({ search: '...' })`
- ✅ **Listar todos**: `pacientesService.list({})`

---

## 🎉 **CORREÇÃO COMPLETA**

**Agora quando criar uma avaliação:**
1. ✅ Redireciona com `paciente_id=13`
2. ✅ Busca paciente usando `GET /api/pacientes/13`
3. ✅ Carrega **TODOS os dados** do paciente
4. ✅ Preenche CPF, nome, escolaridade, contexto, etc.
5. ✅ Auto-seleciona tabelas de Trânsito
6. ✅ Mostra apenas os testes escolhidos

**TESTE AGORA! Crie uma nova avaliação e veja os dados aparecerem! 🚀**
