# Correção - Campo Endereço ✅

## 🐛 **Problema Identificado**

### **Erro:**
```
PUT http://localhost:3001/api/pacientes/13 400 (Bad Request)
```

### **Log do Backend:**
```javascript
❌ Erro de validação: {
  body: {
    nome: 'Diogo Sanchez',
    cpf: '237.224.708-44',
    data_nascimento: '2019-04-04',
    numero_laudo: 'LAU-2025-0013',
    contexto: 'Trânsito',
    tipo_transito: '1ª Habilitação',
    escolaridade: 'E. Médio',
    telefone: '19995469546',
    email: 'diogo@giogo.com',
    endereco: '',        ← CAMPO NÃO PERMITIDO
    observacoes: '',
    allow_duplicate_phone: false,
    allow_duplicate_email: false
  },
  errors: [
    {
      field: 'endereco',
      message: '"endereco" is not allowed',
      type: 'object.unknown'
    }
  ]
}
```

### **Causa:**
O frontend estava enviando o campo `endereco`, mas:
1. ❌ O schema de validação **não permitia** esse campo
2. ❌ A tabela `pacientes` **não tinha** a coluna `endereco`
3. ❌ As rotas **não extraíam/salvavam** esse campo

---

## ✅ **Solução Implementada**

### **1. Adicionado Campo à Tabela**

**Script de Migração:** `scripts/migrations/add-endereco-field.js`

```javascript
await query(`
  ALTER TABLE pacientes 
  ADD COLUMN IF NOT EXISTS endereco VARCHAR(500);
`);

await query(`
  CREATE INDEX IF NOT EXISTS idx_pacientes_endereco 
  ON pacientes(endereco);
`);
```

**Resultado:**
```
✅ Campo endereco adicionado com sucesso!
✅ Índice criado com sucesso!
```

---

### **2. Atualizado Schema de Validação**

**Arquivo:** `middleware/validation.js`

```javascript
// ✅ ADICIONADO:
endereco: Joi.string().max(500).optional().allow('', null),

// Schema completo:
const pacienteSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).required(),
  data_nascimento: Joi.alternatives().try(
    Joi.date(),
    Joi.string().isoDate()
  ).optional().allow('', null),
  numero_laudo: Joi.string().max(50).optional().allow('', null),
  contexto: Joi.string().valid('Clínico', 'Organizacional', 'Trânsito').optional().allow('', null),
  tipo_transito: Joi.string().valid('1ª Habilitação', 'Renovação', ...).optional().allow('', null),
  escolaridade: Joi.string().valid('E. Fundamental', 'E. Médio', ...).required(),
  telefone: Joi.string().max(20).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  endereco: Joi.string().max(500).optional().allow('', null),  // ✅ NOVO
  observacoes: Joi.string().max(3000).optional().allow('', null),
  allow_duplicate_phone: Joi.boolean().optional(),
  allow_duplicate_email: Joi.boolean().optional()
});
```

---

### **3. Atualizado Rotas de Pacientes**

**Arquivo:** `routes/pacientes.js`

#### **POST / (Criar Paciente)**

```javascript
// ✅ ANTES:
const { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, 
        escolaridade, telefone, email } = req.body;

// ✅ DEPOIS:
const { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, 
        escolaridade, telefone, email, endereco, observacoes } = req.body;

// ✅ INSERT atualizado:
INSERT INTO pacientes 
  (nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, 
   escolaridade, telefone, email, endereco, observacoes) 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
```

#### **PUT /:id (Atualizar Paciente)**

```javascript
// ✅ ANTES:
const { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, 
        escolaridade, telefone, email, observacoes } = req.body;

// ✅ DEPOIS:
const { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, 
        escolaridade, telefone, email, endereco, observacoes } = req.body;

// ✅ UPDATE atualizado:
UPDATE pacientes 
SET nome = $1, cpf = $2, data_nascimento = $3, numero_laudo = $4, 
    contexto = $5, tipo_transito = $6, escolaridade = $7, telefone = $8, 
    email = $9, endereco = $10, observacoes = $11, updated_at = CURRENT_TIMESTAMP 
WHERE id = $12
```

#### **GET / (Listar Pacientes)**

```javascript
// ✅ SELECT atualizado:
SELECT id, nome, cpf, idade, data_nascimento, numero_laudo, contexto, 
       tipo_transito, escolaridade, telefone, email, endereco, observacoes, 
       created_at, updated_at 
FROM pacientes
```

#### **GET /:id (Buscar por ID)**

```javascript
// ✅ SELECT atualizado:
SELECT id, nome, cpf, idade, data_nascimento, numero_laudo, contexto, 
       tipo_transito, escolaridade, telefone, email, endereco, observacoes, 
       created_at, updated_at 
FROM pacientes 
WHERE id = $1
```

---

### **4. Logs de Debug Adicionados**

**Arquivo:** `middleware/validation.js`

```javascript
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      console.log('❌ Erro de validação:', {
        body: req.body,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }))
      });
      
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = value;
    next();
  };
};
```

**Benefício:** Agora qualquer erro de validação mostra **exatamente** qual campo está falhando e por quê.

---

## 📊 **Estrutura Atualizada**

### **Tabela `pacientes`**

```sql
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  idade INTEGER,
  data_nascimento DATE,
  numero_laudo VARCHAR(50),
  contexto VARCHAR(50),
  tipo_transito VARCHAR(100),
  escolaridade VARCHAR(50) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco VARCHAR(500),           -- ✅ NOVO CAMPO
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pacientes_endereco ON pacientes(endereco);  -- ✅ NOVO ÍNDICE
```

---

## 🔄 **Fluxo Corrigido**

### **Criar/Atualizar Paciente:**

```
1. 📤 Frontend envia dados:
   {
     nome: 'Diogo Sanchez',
     cpf: '237.224.708-44',
     endereco: 'Rua ABC, 123',  ← CAMPO AGORA ACEITO
     ...
   }
   ↓
2. 🔍 Middleware de validação:
   ✅ endereco: Joi.string().max(500).optional().allow('', null)
   ✅ Validação passa!
   ↓
3. 📋 Rota extrai o campo:
   const { nome, cpf, ..., endereco, ... } = req.body;
   ↓
4. 💾 INSERT/UPDATE no banco:
   INSERT INTO pacientes (..., endereco, ...)
   VALUES (..., $10, ...)
   ↓
5. ✅ Sucesso:
   {
     message: 'Paciente atualizado com sucesso',
     paciente: { ..., endereco: 'Rua ABC, 123', ... }
   }
```

---

## 🎯 **Teste da Correção**

### **Passos:**

1. **Acesse a página de Pacientes**
2. **Edite o paciente Diogo Sanchez**
3. **Preencha o campo Endereço:**
   ```
   Endereço: Rua das Flores, 456 - Centro
   ```
4. **Clique em "Salvar"**
5. **✅ Deve funcionar sem erros!**

### **Resultado Esperado:**

```javascript
// Request:
PUT /api/pacientes/13
{
  nome: "Diogo Sanchez",
  cpf: "237.224.708-44",
  endereco: "Rua das Flores, 456 - Centro",
  ...
}

// Response: 200 OK
{
  message: "Paciente atualizado com sucesso",
  paciente: {
    id: 13,
    nome: "Diogo Sanchez",
    cpf: "237.224.708-44",
    endereco: "Rua das Flores, 456 - Centro",  ✅
    ...
  }
}
```

---

## 🎉 **Correção Completa**

**Mudanças Aplicadas:**
- ✅ **Campo `endereco` adicionado** à tabela `pacientes`
- ✅ **Índice criado** para melhor performance
- ✅ **Schema de validação atualizado** para aceitar o campo
- ✅ **Rotas POST/PUT/GET atualizadas** para manipular o campo
- ✅ **Logs de debug adicionados** para facilitar troubleshooting

**Agora você pode criar e editar pacientes com endereço sem erros! 🚀**
