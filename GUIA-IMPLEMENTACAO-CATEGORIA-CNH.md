# 🚗 Guia: Implementação de Categoria CNH

## ✅ FUNCIONALIDADE IMPLEMENTADA

### **Campo Categoria CNH adicionado em todo o sistema:**
- ✅ **Agendamentos** - Campo editável
- ✅ **Importação em lote** - Captura automática
- ✅ **Pacientes** - Armazenamento permanente
- ✅ **Avaliações** - Registro do tipo de habilitação
- ✅ **Conversão** - Transferência automática

---

## 🔧 ALTERAÇÕES IMPLEMENTADAS

### **1️⃣ BANCO DE DADOS:**

#### **Tabelas Atualizadas:**
```sql
-- agendamentos
ALTER TABLE agendamentos ADD COLUMN categoria_cnh VARCHAR(10);

-- pacientes
ALTER TABLE pacientes ADD COLUMN categoria_cnh VARCHAR(10);

-- avaliacoes
ALTER TABLE avaliacoes ADD COLUMN categoria_cnh VARCHAR(10);
```

#### **Categorias Suportadas:**
- **A** - Motocicleta
- **B** - Automóvel
- **AB** - Moto e Automóvel
- **C** - Caminhão
- **D** - Ônibus
- **E** - Caminhão com reboque
- **ACC** - Ciclomotor
- **AC** - Carro e Ciclomotor
- **AD** - Carro e Ônibus
- **AE** - Moto e Caminhão com reboque

---

### **2️⃣ FRONTEND - AGENDA:**

#### **Formulário de Agendamento:**
Novo campo após "Tipo de Trânsito":
```javascript
<select
  value={formData.categoria_cnh}
  onChange={(e) => setFormData(prev => ({ ...prev, categoria_cnh: e.target.value }))}
>
  <option value="">Selecione a categoria</option>
  <option value="A">A - Motocicleta</option>
  <option value="B">B - Automóvel</option>
  <option value="AB">AB - Moto e Automóvel</option>
  ...
</select>
```

#### **Importação em Lote:**
- **Linha 6** do formato de 9 linhas agora captura a categoria
- **Validação:** Aceita apenas categorias de até 3 caracteres
- **Armazenamento:** Salvo automaticamente no banco

---

### **3️⃣ BACKEND - ROTAS:**

#### **Criação de Agendamento:**
```javascript
INSERT INTO agendamentos (
  ..., contexto, tipo_transito, categoria_cnh, usuario_id
)
VALUES (..., $9, $10, $11, $12)
```

#### **Importação em Lote:**
```javascript
categoria_cnh: agend.categoria_cnh || null
```

#### **Conversão para Paciente:**
```javascript
categoria_cnh: dados_adicionais?.categoria_cnh || agend.categoria_cnh || null
```

---

## 🎯 FLUXO DE DADOS

### **Importação em Lote → Agendamento:**

#### **Formato de Entrada (9 linhas por registro):**
```
14:00               ← Hora
37616777821         ← CPF
WESLEY OLIVEIRA     ← Nome
959099326           ← Telefone
wesley@email.com    ← Email
Renovação           ← Tipo de Trânsito
AB                  ← Categoria CNH ✅ NOVA
Não Realizado       ← Status 1
Não Realizado       ← Status 2
```

#### **Resultado no Agendamento:**
```javascript
{
  nome: "WESLEY OLIVEIRA",
  cpf: "37616777821",
  contexto: "Trânsito",
  tipo_transito: "Renovação",
  categoria_cnh: "AB"  // ✅ Capturado
}
```

---

### **Agendamento → Paciente:**

#### **Conversão Automática:**
Quando um agendamento é convertido em paciente:
```javascript
categoria_cnh: agendamento.categoria_cnh → paciente.categoria_cnh
```

#### **Edição Manual:**
No modal de conversão, o campo pode ser editado:
```javascript
categoria_cnh: dados_adicionais?.categoria_cnh || agend.categoria_cnh
```

---

### **Paciente → Avaliação:**

Quando uma avaliação é criada para um paciente:
```javascript
categoria_cnh: paciente.categoria_cnh → avaliacao.categoria_cnh
```

---

## 🧪 TESTE DA FUNCIONALIDADE

### **Teste 1: Criar Agendamento Manual**

#### **Passo 1: Acessar Agenda**
```
URL: http://192.168.6.230:3000/agenda
```

#### **Passo 2: Novo Agendamento**
1. Clique: **+ Novo Agendamento**
2. Preencha:
   - **Nome:** WESLEY OLIVEIRA PEREIRA DA SILVA
   - **CPF:** 376.167.778-21
   - **Data/Hora:** 03/10/2025, 08:00
   - **Contexto:** Trânsito
   - **Tipo de Trânsito:** Renovação
   - **Categoria CNH:** AB ✅ NOVO CAMPO
3. Clique: **Salvar**

#### **Passo 3: Verificar**
1. Edite o agendamento
2. Veja que a categoria AB está salva

---

### **Teste 2: Importação em Lote**

#### **Passo 1: Preparar Dados**
```
EXAMES PSICOLÓGICOS AGENDADOS
DATA: 21/10/2025
PSICÓLOGO: MAURO ARIEL SANCHEZ

Hora CPF Nome Telefone E-mail Tipo Categoria Status1 Status2
14:00
37616777821
WESLEY OLIVEIRA PEREIRA DA SILVA
959099326
wesley@email.com
Renovação
AB
Não Realizado
Não Realizado
```

#### **Passo 2: Importar**
1. Clique: **Importar Lote**
2. Cole os dados
3. Selecione: **Data:** 21/10/2025
4. Clique: **Importar**

#### **Passo 3: Verificar**
1. Localize o agendamento de WESLEY
2. Edite o agendamento
3. Veja que:
   - **Tipo de Trânsito:** Renovação
   - **Categoria CNH:** AB ✅ IMPORTADO

---

### **Teste 3: Conversão para Paciente**

#### **Passo 1: Converter**
1. Localize o agendamento de WESLEY
2. Clique: **Converter em Paciente**
3. Preencha dados adicionais
4. Clique: **Converter**

#### **Passo 2: Verificar Paciente**
1. Vá para: **Pacientes**
2. Busque: WESLEY OLIVEIRA
3. Veja que o paciente tem:
   - **Tipo de Trânsito:** Renovação
   - **Categoria CNH:** AB ✅ TRANSFERIDO

---

### **Teste 4: Criar Avaliação**

#### **Passo 1: Nova Avaliação**
1. No perfil do paciente WESLEY
2. Clique: **Nova Avaliação**
3. A categoria CNH deve ser herdada

#### **Passo 2: Verificar no Laudo**
1. Gere um laudo para o paciente
2. A categoria CNH deve aparecer nas informações

---

## 📋 CATEGORIAS CNH - DETALHES

### **Categorias Básicas:**

| Código | Veículo | Descrição |
|--------|---------|-----------|
| **A** | 🏍️ | Motocicletas, motonetas e triciclos |
| **B** | 🚗 | Automóveis e pequenos comerciais |
| **AB** | 🏍️🚗 | Combinação de A e B |

### **Categorias Profissionais:**

| Código | Veículo | Descrição |
|--------|---------|-----------|
| **C** | 🚛 | Caminhões e veículos de carga |
| **D** | 🚌 | Ônibus e veículos de passageiros |
| **E** | 🚚 | Caminhões com reboque/articulados |

### **Categorias Especiais:**

| Código | Veículo | Descrição |
|--------|---------|-----------|
| **ACC** | 🛵 | Ciclomotores (até 50cc) |
| **AC** | 🚗🛵 | Carro + Ciclomotor |
| **AD** | 🚗🚌 | Carro + Ônibus |
| **AE** | 🏍️🚚 | Moto + Caminhão com reboque |

---

## 🔍 ONDE A CATEGORIA APARECE

### **1. Agenda:**
- Campo editável no formulário
- Visível na lista de agendamentos
- Importável em lote

### **2. Pacientes:**
- Armazenado no cadastro
- Visível no perfil
- Editável

### **3. Avaliações:**
- Herdado do paciente
- Registrado permanentemente
- Usado em laudos

### **4. Laudos:**
- Aparece nas informações do avaliado
- Contexto da avaliação
- Requisito para trânsito

---

## 💡 BENEFÍCIOS

### **Rastreabilidade:**
- ✅ **Histórico completo** da categoria solicitada
- ✅ **Auditoria** de mudanças
- ✅ **Conformidade** com requisitos do DETRAN

### **Automação:**
- ✅ **Importação automática** em lote
- ✅ **Transferência automática** entre módulos
- ✅ **Sem digitação manual** repetitiva

### **Integração:**
- ✅ **Fluxo completo** Agenda → Paciente → Avaliação
- ✅ **Dados consistentes** em todo o sistema
- ✅ **Informação sempre disponível**

---

## ⚠️ VALIDAÇÕES

### **No Frontend:**
```javascript
categoria && categoria.length <= 3
```
- Aceita apenas categorias válidas
- Máximo 3 caracteres (AB, ACC, etc.)
- Opcional (pode ficar vazio)

### **No Backend:**
```javascript
categoria_cnh: req.body.categoria_cnh || null
```
- Aceita `null` se não informado
- Salva como VARCHAR(10)
- Não tem restrição de FK

---

## 📊 FORMATO DE IMPORTAÇÃO ATUALIZADO

### **Antes (8 linhas):**
```
Hora, CPF, Nome, Telefone, Email, Tipo, Status1, Status2
```

### **Agora (9 linhas):**
```
Hora, CPF, Nome, Telefone, Email, Tipo, Categoria, Status1, Status2
                                         ↑
                                    NOVO CAMPO
```

### **Exemplo Completo:**
```
14:00
37616777821
WESLEY OLIVEIRA PEREIRA DA SILVA
(95) 9009-9326
wesley@email.com
Renovação
AB          ← CATEGORIA CNH
Não Realizado
Não Realizado
```

---

**Sistema Palográfico - Categoria CNH Implementada** 🚗✅

**Rastreabilidade completa da categoria de habilitação!** 📋🚦
