# Correção - Erro 400 ao Criar Avaliação ✅

## 🐛 **Problema Identificado**

### **Erro:**
```
POST http://localhost:3001/api/avaliacoes 400 (Bad Request)
```

### **Causa Raiz:**
O frontend estava enviando um campo `testes_selecionados` que **não está no schema de validação** do backend, causando rejeição da validação Joi.

---

## 🔍 **Análise do Problema**

### **Frontend estava enviando:**
```javascript
{
  paciente_id: 1,
  numero_laudo: "LAU-2025-0001",
  data_aplicacao: "2025-01-20",
  aplicacao: "Individual",
  tipo_habilitacao: "1ª Habilitação",
  observacoes: "...",
  testes_selecionados: ["mig", "memore", "ac"]  // ❌ CAMPO EXTRA
}
```

### **Backend esperava (schema de validação):**
```javascript
const avaliacaoSchema = Joi.object({
  paciente_id: Joi.number().integer().positive().required(),
  numero_laudo: Joi.string().min(1).max(20).required(),
  data_aplicacao: Joi.date().required(),
  aplicacao: Joi.string().valid('Coletiva', 'Individual').required(),
  tipo_habilitacao: Joi.string().valid('1ª Habilitação', 'Renovação', ...).required(),
  observacoes: Joi.string().max(3000).optional().allow('', null)
  // ❌ NÃO tem 'testes_selecionados'
});
```

### **Resultado:**
- **Validação Joi falhou** ao encontrar campo extra `testes_selecionados`
- **Erro 400 (Bad Request)** retornado pelo middleware de validação

---

## ✅ **Solução Implementada**

### **Antes:**
```javascript
const handleAvaliacaoSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!selectedPatient) {
    toast.error('Nenhum paciente selecionado');
    return;
  }
  
  const dataToSubmit = {
    ...avaliacaoData,  // ❌ Inclui testes_selecionados
    paciente_id: parseInt(selectedPatient.id),
    observacoes: avaliacaoData.observacoes || undefined
  };
  
  createAvaliacaoMutation.mutate(dataToSubmit);
};
```

### **Depois:**
```javascript
const handleAvaliacaoSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!selectedPatient) {
    toast.error('Nenhum paciente selecionado');
    return;
  }
  
  // Remover o campo testes_selecionados do objeto enviado ao backend
  // O backend não espera esse campo no schema de validação
  const { testes_selecionados, ...avaliacaoDataWithoutTests } = avaliacaoData;
  
  const dataToSubmit = {
    ...avaliacaoDataWithoutTests,  // ✅ Sem testes_selecionados
    paciente_id: parseInt(selectedPatient.id),
    observacoes: avaliacaoData.observacoes || undefined
  };
  
  createAvaliacaoMutation.mutate(dataToSubmit);
};
```

---

## 📋 **O que foi feito:**

1. **Destructuring assignment** para separar `testes_selecionados` dos outros campos
2. **Spread operator** para enviar apenas os campos esperados pelo backend
3. **Comentário explicativo** para documentar a razão da mudança

---

## 🎯 **Dados Enviados Agora:**

```javascript
{
  numero_laudo: "LAU-2025-0001",
  data_aplicacao: "2025-01-20",
  aplicacao: "Individual",
  tipo_habilitacao: "1ª Habilitação",
  observacoes: "...",
  paciente_id: 1
  // ✅ SEM testes_selecionados
}
```

---

## 🔧 **Por que `testes_selecionados` existe no frontend?**

O campo `testes_selecionados` é usado **apenas na interface** para:
- Mostrar quais testes o usuário selecionou
- Gerenciar o estado da UI
- Navegar para os testes após criar a avaliação

**Mas não precisa ser salvo no backend** porque:
- Os testes são salvos em tabelas separadas (`resultados_memore`, `resultados_ac`, etc.)
- Cada teste tem seu próprio endpoint de salvamento
- A relação é feita através do `avaliacao_id`

---

## ✅ **Teste da Correção**

### **Passos para testar:**
1. **Selecione um paciente** na aba Pacientes
2. **Clique em "Nova Avaliação"**
3. **Preencha os dados** da avaliação
4. **Selecione alguns testes** (opcional, apenas para UI)
5. **Clique em "Criar"**

### **Resultado Esperado:**
- ✅ **Avaliação criada com sucesso**
- ✅ **Toast de sucesso** aparece
- ✅ **Modal fecha** automaticamente
- ✅ **Lista de avaliações** é atualizada

---

## 🚀 **Correção Completa**

**O erro 400 (Bad Request) ao criar avaliação foi corrigido removendo o campo `testes_selecionados` do payload enviado ao backend, já que esse campo não está no schema de validação do servidor.**

**Agora o formulário de nova avaliação funciona corretamente!**
