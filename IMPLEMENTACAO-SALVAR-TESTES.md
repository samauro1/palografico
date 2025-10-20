# Implementação - Salvar Testes e Modo Anônimo/Vinculado ✅

## 🎯 **Funcionalidades Implementadas**

### **1. Modo de Avaliação: Anônima vs Vinculada**

Adicionado sistema de seleção de modo no topo da página de testes:

#### **Avaliação Anônima 🔓:**
- Teste executado sem vincular a paciente
- Apenas calcula resultados
- **NÃO salva** no banco de dados
- Útil para demonstrações e testes rápidos

#### **Avaliação Vinculada 🔗:**
- Teste vinculado a um paciente específico
- Requer: CPF, Nome, Número do Laudo
- **Salva automaticamente** no banco de dados
- Associa à avaliação do paciente

---

## 📋 **Interface de Seleção de Modo**

### **Botões de Modo:**
```jsx
🔓 Avaliação Anônima
Teste sem vincular a paciente ou laudo

🔗 Avaliação Vinculada  
Vincular a paciente e número de laudo
```

### **Campos para Modo Vinculado:**
Quando selecionado "Avaliação Vinculada", aparecem campos para:
- **CPF do Paciente** (busca automática ao sair do campo)
- **Nome do Paciente** (preenchido automaticamente se encontrado)
- **Número do Laudo** (obrigatório)

### **Busca Automática de Paciente:**
- Digite o CPF
- Ao sair do campo (onBlur), busca automaticamente
- Se encontrado: ✅ Preenche nome e dados
- Se não encontrado: ℹ️ Aviso que criará nova avaliação

---

## 💾 **Botão "Guardar Teste"**

### **Localização:**
- **Final do formulário** de cada teste
- **Antes do fechamento** da div do teste
- **Barra de separação** acima do botão

### **Aparência:**
```
┌──────────────────────────────────────────────────────────┐
│ Status da Vinculação              [💾 Guardar Teste]     │
└──────────────────────────────────────────────────────────┘
```

### **Comportamento:**

#### **Estado Normal:**
- Botão verde com ícone de Save
- Texto: "Guardar Teste"
- Clicável

#### **Estado Salvando:**
- Botão desabilitado
- Texto: "Salvando..."
- Loading state

#### **Estado Desabilitado:**
- Quando modo vinculado sem dados completos
- Opacidade reduzida
- Cursor not-allowed

---

## 🔧 **Lógica de Salvamento**

### **Fluxo de Salvamento:**

```
1. Usuário preenche o teste
2. Clica em "Guardar Teste"
3. Sistema valida dados (se vinculado)
4. Prepara payload com todos os dados do teste
5. Adiciona analysisType e patientData ao payload
6. Envia para endpoint de cálculo (que também salva)
7. Backend verifica se é vinculado
8. Se vinculado: cria/busca avaliação e salva resultado
9. Retorna resultado com flag 'salvo'
10. Frontend mostra toast de sucesso
```

### **Dados Enviados:**

#### **Modo Anônimo:**
```javascript
{
  ...testData,  // Dados do teste
  analysisType: 'anonymous',
  patientData: null
}
```

#### **Modo Vinculado:**
```javascript
{
  ...testData,  // Dados do teste
  analysisType: 'linked',
  patientData: {
    cpf: '111.222.333-44',
    nome: 'João Silva',
    numero_laudo: 'LAU-2025-0001',
    data_nascimento: '1989-12-31',
    foundPatient: { id: 1, ... },  // Se encontrado
    data_avaliacao: '2025-10-17',
    ...
  }
}
```

---

## 📊 **Backend - Lógica de Salvamento**

### **Endpoint:** `POST /api/tabelas/:tipo/calculate`

### **Fluxo no Backend:**

```javascript
1. Recebe dados do teste
2. Calcula resultado (percentil, classificação, etc.)
3. Verifica se analysisType === 'linked' e tem patientData
4. Se SIM:
   a. Busca ou cria avaliação para o paciente
   b. Salva resultado na tabela específica:
      - resultados_memore
      - resultados_ac
      - resultados_r1
      - resultados_mig
      - resultados_beta_iii
      - resultados_bpa2
      - resultados_rotas
      - resultados_mvt
      - resultados_palografico
   c. Adiciona flag 'salvo: true' ao resultado
5. Retorna resultado ao frontend
```

### **Função criarOuBuscarAvaliacao:**
```javascript
- Verifica se já existe avaliação para o paciente na data
- Se existe: retorna avaliação existente
- Se não existe: cria nova avaliação
- Retorna ID da avaliação
```

### **Função salvarResultadoTeste:**
```javascript
- Switch case por tipo de teste
- INSERT na tabela específica de resultados
- Vincula pelo avaliacao_id
```

---

## 🎨 **Estados Visuais**

### **Feedback para o Usuário:**

#### **Modo Anônimo:**
```
🔓 Teste anônimo - não será vinculado a paciente
[💾 Guardar Teste]
```
Ao salvar: "✅ Teste calculado (não vinculado ao paciente)"

#### **Modo Vinculado - Com Paciente:**
```
✅ Teste vinculado a: João Silva - Laudo: LAU-2025-0001
[💾 Guardar Teste]
```
Ao salvar: "✅ Teste salvo com sucesso na avaliação!"

#### **Modo Vinculado - Sem Paciente:**
```
⚠️ Preencha os dados do paciente acima para vincular
[💾 Guardar Teste] (desabilitado)
```

#### **Paciente Não Encontrado:**
```
ℹ️ Paciente não encontrado com esse CPF. O sistema criará uma nova avaliação ao guardar.
```

---

## 📋 **Testes Suportados**

Todos os testes agora têm o botão "Guardar":

1. ✅ **MIG** - Memória Imediata Geral
2. ✅ **MEMORE** - Memória de Reconhecimento
3. ✅ **AC** - Atenção Concentrada
4. ✅ **R-1** - Raciocínio Lógico
5. ✅ **BETA-III** - Bateria de Testes de Inteligência
6. ✅ **BPA-2** - Bateria de Provas de Atenção
7. ✅ **Rotas** - Rotas de Atenção
8. ✅ **MVT** - Memória Visual para o Trânsito
9. ✅ **Palográfico** - Teste Palográfico

---

## 🔍 **Validações Implementadas**

### **Antes de Salvar:**

1. **Teste selecionado?**
   - Se não: Toast de erro "Nenhum teste selecionado"

2. **Modo vinculado?**
   - Se sim: Validar CPF, Nome e Número do Laudo
   - Se faltando: Toast de erro + botão desabilitado

3. **Dados do teste preenchidos?**
   - Não valida se campos obrigatórios estão vazios
   - Backend valida na hora de calcular

### **Feedback ao Usuário:**

- 🔵 **Modo selecionado** mostrado visualmente
- 🟢 **Paciente encontrado** com confirmação
- 🟡 **Dados incompletos** com aviso
- 🔴 **Erros** com toast de erro
- ✅ **Sucesso** com toast de confirmação

---

## 🚀 **Como Usar**

### **Modo Anônimo:**
1. Selecione "Avaliação Anônima"
2. Escolha um teste
3. Preencha os dados
4. Clique em "Guardar Teste"
5. ✅ Resultado calculado (não salvo)

### **Modo Vinculado:**
1. Selecione "Avaliação Vinculada"
2. Digite o CPF do paciente
3. Sistema busca automaticamente
4. Se encontrado: dados preenchidos ✅
5. Preencha número do laudo
6. Escolha um teste
7. Preencha os dados do teste
8. Clique em "Guardar Teste"
9. ✅ Resultado salvo no banco de dados

---

## 📊 **Estrutura de Dados Salvos**

### **Tabelas de Resultados:**

```sql
-- Cada teste tem sua tabela específica
resultados_memore (avaliacao_id, vp, vn, fn, fp, resultado_final, percentil, classificacao)
resultados_ac (avaliacao_id, acertos, erros, omissoes, resultado, percentil, classificacao)
resultados_r1 (avaliacao_id, acertos, percentil, classificacao)
resultados_mig (avaliacao_id, acertos, percentil, classificacao)
resultados_beta_iii (avaliacao_id, acertos, percentil, classificacao)
resultados_bpa2 (avaliacao_id, tipo_atencao, acertos, erros, omissoes, percentil, classificacao)
resultados_rotas (avaliacao_id, rota_tipo, acertos, erros, omissoes, percentil, classificacao)
resultados_mvt (avaliacao_id, acertos, erros, tempo, percentil, classificacao)
resultados_palografico (avaliacao_id, ritmo, expansividade, tensao, percentil, classificacao)
```

### **Relação:**
```
Paciente (1) ─── (N) Avaliações (1) ─── (N) Resultados de Testes
```

---

## ✅ **Status Final**

### **🎉 IMPLEMENTAÇÃO COMPLETA**

**Funcionalidades Implementadas:**
- ✅ **Modo Anônimo/Vinculado** com seleção visual
- ✅ **Campos de vinculação** (CPF, Nome, Laudo)
- ✅ **Busca automática** de paciente por CPF
- ✅ **Botão "Guardar Teste"** em todos os testes
- ✅ **Função de salvamento** completa
- ✅ **Validações** de dados obrigatórios
- ✅ **Feedback visual** em tempo real
- ✅ **Toasts de sucesso/erro** informativos
- ✅ **Backend já configurado** para salvar
- ✅ **Compatível com todos os 9 testes**

**O sistema agora permite salvar todos os testes no banco de dados, tanto em modo anônimo quanto vinculado a pacientes!**
