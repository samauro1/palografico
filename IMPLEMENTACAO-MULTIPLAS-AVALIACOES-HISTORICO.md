# Implementação - Múltiplas Avaliações por Laudo e Histórico Completo ✅

## 🎯 **Funcionalidades Implementadas**

### **1. Múltiplas Avaliações por Laudo**
- ✅ Um laudo pode ter várias avaliações (em datas diferentes)
- ✅ Removida constraint UNIQUE do numero_laudo
- ✅ Avaliações ordenadas por data (mais recente primeiro)

### **2. Campo de Aptidão**
- ✅ Campo `aptidao` adicionado à tabela avaliacoes
- ✅ Valores permitidos: Apto, Inapto Temporário, Inapto
- ✅ Aparece apenas para contexto de Trânsito
- ✅ Cores diferentes por tipo de aptidão

### **3. Salvamento Automático**
- ✅ Testes vinculados salvam automaticamente ao calcular
- ✅ Aviso claro quando modo anônimo está ativo
- ✅ Texto do botão indica se vai salvar ou não

---

## 📋 **Exemplo de Múltiplas Avaliações**

### **Paciente: Diogo Sanchez**
### **Laudo: LAU-2025-0013**

```
Histórico de Avaliações:

┌────────────────────────────────────────────────────────┐
│ LAU-2025-0013                        20/10/2025        │
│ Avaliação 2 - Individual                               │
│ Testes: Memória + Inteligência                         │
│ ✅ Apto                                                │
├────────────────────────────────────────────────────────┤
│ LAU-2025-0013                        17/10/2025        │
│ Avaliação 1 - Individual                               │
│ Testes: Memória + Atenção                              │
│ ✅ Apto                                                │
└────────────────────────────────────────────────────────┘
```

**Banco de Dados:**
```sql
avaliacoes:
  id: 21  |  paciente_id: 13  |  numero_laudo: LAU-2025-0013  |  data: 2025-10-17  |  aptidao: Apto
  id: 25  |  paciente_id: 13  |  numero_laudo: LAU-2025-0013  |  data: 2025-10-20  |  aptidao: Apto

resultados_memore:
  avaliacao_id: 21  |  vp: 20  |  vn: 3  |  ...
  avaliacao_id: 25  |  vp: 22  |  vn: 2  |  ...

resultados_ac:
  avaliacao_id: 21  |  acertos: 120  |  erros: 15  |  ...

resultados_beta_iii:
  avaliacao_id: 25  |  acertos: 42  |  percentil: 65  |  ...
```

---

## 🗄️ **Mudanças no Banco de Dados**

### **Migration 1: Remover Constraint UNIQUE**

```sql
-- Antes: numero_laudo era UNIQUE
ALTER TABLE avaliacoes 
DROP CONSTRAINT avaliacoes_numero_laudo_key;

-- Depois: Múltiplas avaliações podem ter o mesmo laudo
CREATE INDEX idx_avaliacoes_numero_laudo ON avaliacoes(numero_laudo);
CREATE INDEX idx_avaliacoes_paciente_laudo ON avaliacoes(paciente_id, numero_laudo);
CREATE INDEX idx_avaliacoes_data_aplicacao ON avaliacoes(data_aplicacao DESC);
```

**Benefícios:**
- ✅ Performance mantida com indexes
- ✅ Busca rápida por laudo
- ✅ Busca rápida por paciente + laudo
- ✅ Ordenação eficiente por data

### **Migration 2: Adicionar Campo Aptidão**

```sql
-- Adicionar coluna
ALTER TABLE avaliacoes 
ADD COLUMN aptidao VARCHAR(50);

-- Constraint para valores válidos
ALTER TABLE avaliacoes 
ADD CONSTRAINT avaliacoes_aptidao_check 
CHECK (aptidao IS NULL OR aptidao IN ('Apto', 'Inapto Temporário', 'Inapto'));

-- Index parcial (apenas quando não NULL)
CREATE INDEX idx_avaliacoes_aptidao 
ON avaliacoes(aptidao) 
WHERE aptidao IS NOT NULL;
```

**Valores Permitidos:**
- `Apto` - Paciente aprovado
- `Inapto Temporário` - Reprovado temporariamente
- `Inapto` - Reprovado definitivamente
- `NULL` - Sem observação de aptidão

---

## 🔧 **Backend - Mudanças na Lógica**

### **1. criarOuBuscarAvaliacao (Atualizada):**

**Antes:**
```javascript
// Verificava apenas por laudo (não permitia múltiplas)
if (numeroLaudo) {
  const avaliacaoPorLaudo = await query(`
    SELECT id FROM avaliacoes WHERE numero_laudo = $1
  `);
  if (avaliacaoPorLaudo.rows.length > 0) {
    return avaliacaoPorLaudo.rows[0]; // Reutilizava única
  }
}
```

**Depois:**
```javascript
// Verifica por paciente + laudo + data (permite múltiplas em datas diferentes)
const avaliacaoExistente = await query(`
  SELECT id FROM avaliacoes 
  WHERE paciente_id = $1 AND numero_laudo = $2 AND DATE(data_aplicacao) = $3
  ORDER BY created_at DESC 
  LIMIT 1
`, [paciente.id, numeroLaudo, data]);

if (avaliacaoExistente.rows.length > 0) {
  return avaliacaoExistente.rows[0]; // Reutiliza da mesma data
}

// Cria nova se for data diferente (mesmo com mesmo laudo)
```

### **2. Criar Avaliação (Atualizada):**

**Antes:**
```javascript
// Verificava se laudo já existia
const existingLaudo = await query(
  'SELECT id FROM avaliacoes WHERE numero_laudo = $1'
);
if (existingLaudo.rows.length > 0) {
  return res.status(400).json({ error: 'Laudo já em uso' });
}
```

**Depois:**
```javascript
// Não mais verifica - permite múltiplas avaliações com mesmo laudo
// Removida verificação de laudo único

const result = await query(`
  INSERT INTO avaliacoes (..., aptidao) 
  VALUES (..., $8)
`, [..., aptidao]);
```

### **3. Ordenação por Data:**

**Antes:**
```sql
ORDER BY a.created_at DESC
```

**Depois:**
```sql
ORDER BY a.data_aplicacao DESC, a.created_at DESC
```

- Primeiro por data de aplicação (mais recente)
- Depois por data de criação (desempate)

---

## 🎨 **Frontend - Interface Atualizada**

### **1. Formulário de Nova Avaliação:**

**Campo de Aptidão (Condicional):**
```jsx
{selectedPatient?.contexto === 'Trânsito' && (
  <div>
    <label>Observação de Aptidão</label>
    <select value={avaliacaoData.aptidao}>
      <option value="">Sem observação</option>
      <option value="Apto">Apto</option>
      <option value="Inapto Temporário">Inapto Temporário</option>
      <option value="Inapto">Inapto</option>
    </select>
  </div>
)}
```

**Comportamento:**
- Só aparece se `contexto === 'Trânsito'`
- Opcional (pode ficar em branco)
- Salvo junto com a avaliação

### **2. Lista de Avaliações:**

**Exibição da Aptidão:**
```jsx
{avaliacao.aptidao && (
  <p className={
    avaliacao.aptidao === 'Apto' ? 'text-green-600' :
    avaliacao.aptidao === 'Inapto Temporário' ? 'text-yellow-600' :
    'text-red-600'
  }>
    {avaliacao.aptidao === 'Apto' && '✅ '}
    {avaliacao.aptidao === 'Inapto Temporário' && '⚠️ '}
    {avaliacao.aptidao === 'Inapto' && '❌ '}
    {avaliacao.aptidao}
  </p>
)}
```

**Cores:**
- **Apto**: Verde ✅
- **Inapto Temporário**: Amarelo ⚠️
- **Inapto**: Vermelho ❌

### **3. Avisos de Modo:**

**Botão Anônimo:**
```
🔓 Avaliação Anônima
Teste sem vincular a paciente ou laudo
⚠️ Não será guardado na base de dados  {/* NOVO */}
```

**Botão Vinculado:**
```
🔗 Avaliação Vinculada
Vincular a paciente e número de laudo
✅ Salvamento automático na base de dados  {/* NOVO */}
```

**Card de Aviso (Anônimo Ativo):**
```
⚠️ Modo Anônimo Ativo

• O resultado do teste NÃO será guardado na base de dados
• Não há como associar o teste a uma pessoa ou avaliação
• Para salvar os resultados, mude para Avaliação Vinculada
```

---

## 📊 **Exemplo de Uso Completo**

### **Cenário: Diogo Sanchez - Laudo LAU-2025-0013**

#### **Dia 1 (17/10/2025) - Primeira Avaliação:**
```
1. Seleciona paciente Diogo Sanchez
2. Cria avaliação:
   - Laudo: LAU-2025-0013
   - Data: 17/10/2025
   - Aptidão: Apto
3. Executa testes:
   - Memore: 20VP, 3VN → Percentil 65
   - AC: 120 acertos → Classificação Médio
4. Salva automaticamente
```

**Banco de Dados:**
```sql
avaliacoes (id: 21):
  paciente_id: 13
  numero_laudo: LAU-2025-0013
  data_aplicacao: 2025-10-17
  aptidao: Apto

resultados_memore (avaliacao_id: 21)
resultados_ac (avaliacao_id: 21)
```

#### **Dia 2 (20/10/2025) - Segunda Avaliação (MESMO LAUDO):**
```
1. Seleciona paciente Diogo Sanchez
2. Cria avaliação:
   - Laudo: LAU-2025-0013  ← MESMO LAUDO!
   - Data: 20/10/2025      ← DATA DIFERENTE!
   - Aptidão: Apto
3. Executa testes:
   - Memore: 22VP, 2VN → Percentil 75
   - BETA-III: 42 acertos → Classificação Superior
4. Salva automaticamente
```

**Banco de Dados:**
```sql
avaliacoes (id: 25):  ← NOVA AVALIAÇÃO
  paciente_id: 13
  numero_laudo: LAU-2025-0013  ← MESMO LAUDO!
  data_aplicacao: 2025-10-20   ← DATA DIFERENTE!
  aptidao: Apto

resultados_memore (avaliacao_id: 25)  ← NOVOS RESULTADOS
resultados_beta_iii (avaliacao_id: 25)
```

#### **Histórico Completo do Paciente:**

**Ao clicar "Ver Resultados" no paciente:**
```
Diogo Sanchez - LAU-2025-0013

Histórico de Avaliações (2 avaliações com esse laudo):

┌─────────────────────────────────────────────────┐
│ Avaliação 2 - 20/10/2025                        │
│ ✅ Apto                                         │
│ Testes realizados:                              │
│   • Memore: 22VP, 2VN - Percentil 75 - Superior│
│   • BETA-III: 42 acertos - Percentil 65 - Médio│
├─────────────────────────────────────────────────┤
│ Avaliação 1 - 17/10/2025                        │
│ ✅ Apto                                         │
│ Testes realizados:                              │
│   • Memore: 20VP, 3VN - Percentil 65 - Médio   │
│   • AC: 120 acertos - Classificação Médio      │
└─────────────────────────────────────────────────┘
```

---

## ✅ **Mudanças no Schema de Validação**

### **avaliacaoSchema (middleware/validation.js):**

```javascript
const avaliacaoSchema = Joi.object({
  paciente_id: Joi.number().integer().positive().required(),
  numero_laudo: Joi.string().min(1).max(20).required(),
  data_aplicacao: Joi.date().required(),
  aplicacao: Joi.string().valid('Coletiva', 'Individual').required(),
  tipo_habilitacao: Joi.string().valid(...).required(),
  observacoes: Joi.string().max(3000).optional().allow('', null),
  aptidao: Joi.string()
    .valid('Apto', 'Inapto Temporário', 'Inapto')
    .optional()
    .allow('', null)  // ✅ NOVO CAMPO
});
```

---

## 🔍 **Queries Atualizadas**

### **Listar Avaliações:**

```sql
SELECT 
  a.id, a.numero_laudo, a.data_aplicacao, a.aplicacao, 
  a.tipo_habilitacao, a.observacoes, a.aptidao, a.created_at,  -- aptidao adicionado
  p.nome as paciente_nome, p.cpf as paciente_cpf,
  u.nome as usuario_nome
FROM avaliacoes a 
JOIN pacientes p ON a.paciente_id = p.id 
JOIN usuarios u ON a.usuario_id = u.id
ORDER BY a.data_aplicacao DESC, a.created_at DESC  -- Ordenação por data
```

### **Criar Avaliação:**

```sql
INSERT INTO avaliacoes (
  paciente_id, usuario_id, numero_laudo, data_aplicacao, 
  aplicacao, tipo_habilitacao, observacoes, aptidao  -- aptidao adicionado
) 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
```

### **Buscar ou Criar Avaliação:**

```sql
-- Busca por paciente + laudo + data (permite múltiplas em datas diferentes)
SELECT id FROM avaliacoes 
WHERE paciente_id = $1 AND numero_laudo = $2 AND DATE(data_aplicacao) = $3
ORDER BY created_at DESC 
LIMIT 1
```

---

## 🎯 **Cores da Aptidão**

### **Visual:**

| Aptidão | Cor | Ícone | CSS Class |
|---------|-----|-------|-----------|
| Apto | Verde | ✅ | `text-green-600` |
| Inapto Temporário | Amarelo | ⚠️ | `text-yellow-600` |
| Inapto | Vermelho | ❌ | `text-red-600` |

### **Exemplo Visual:**

```
LAU-2025-0013
17/10/2025 - Individual
1ª Habilitação
✅ Apto  ← Verde
```

```
LAU-2025-0014
18/10/2025 - Individual
Renovação
⚠️ Inapto Temporário  ← Amarelo
```

```
LAU-2025-0015
19/10/2025 - Individual
Adição/Mudança de Categoria
❌ Inapto  ← Vermelho
```

---

## 📱 **Interface de Seleção de Aptidão**

### **Dropdown (Contexto Trânsito):**

```jsx
<label>Observação de Aptidão</label>
<select value={avaliacaoData.aptidao}>
  <option value="">Sem observação</option>
  <option value="Apto">Apto</option>
  <option value="Inapto Temporário">Inapto Temporário</option>
  <option value="Inapto">Inapto</option>
</select>
```

**Comportamento:**
- Só aparece se `contexto === 'Trânsito'`
- Opcional - pode ficar sem observação
- Salvo automaticamente ao criar avaliação

---

## 🚀 **Salvamento Automático**

### **Texto do Botão:**

**Modo Vinculado:**
```
[💾 Calcular e Guardar]
```

**Modo Anônimo:**
```
[💾 Calcular (Não Salva)]
```

### **Toasts:**

**Vinculado - Sucesso:**
```
✅ Teste salvo com sucesso na avaliação!
```

**Anônimo - Info:**
```
ℹ️ Modo Anônimo: Resultado não será guardado na base de dados 
(não há paciente associado)
```

---

## 🗂️ **Estrutura de Dados**

### **Relação:**

```
Paciente (1)
  ↓
Laudo (ex: LAU-2025-0013)
  ↓
Avaliações (N) - Múltiplas em datas diferentes
  ├─ Avaliação 1 (17/10/2025)
  │   ├─ resultado_memore
  │   └─ resultado_ac
  │
  └─ Avaliação 2 (20/10/2025)
      ├─ resultado_memore
      └─ resultado_beta_iii
```

### **Exemplo de Consulta:**

```sql
-- Buscar todas as avaliações de um laudo
SELECT * FROM avaliacoes 
WHERE numero_laudo = 'LAU-2025-0013' 
ORDER BY data_aplicacao DESC;

-- Resultado:
-- id: 25, data: 2025-10-20, aptidao: Apto
-- id: 21, data: 2025-10-17, aptidao: Apto
```

---

## ✅ **Próximos Passos**

Para completar a funcionalidade de histórico:

1. **Criar página de histórico completo** do paciente
   - Mostrar todas as avaliações
   - Agrupar por laudo
   - Mostrar todos os testes de cada avaliação
   - Ordenar por data (mais recente primeiro)

2. **Adicionar botão "Ver Histórico Completo"** no painel do paciente

3. **Mostrar aptidão** em todas as visualizações de avaliações

4. **Permitir editar aptidão** após a avaliação

---

## 🎉 **Implementação Completa**

**Funcionalidades Implementadas:**
- ✅ **Múltiplas avaliações por laudo** (constraint UNIQUE removida)
- ✅ **Campo de aptidão** (Apto/Inapto Temporário/Inapto)
- ✅ **Ordenação por data** (mais recente primeiro)
- ✅ **Indexes de performance** adicionados
- ✅ **Salvamento automático** em modo vinculado
- ✅ **Avisos claros** em modo anônimo
- ✅ **Cores diferenciadas** por tipo de aptidão
- ✅ **Validações** de dados obrigatórios

**O sistema agora suporta múltiplas avaliações por laudo e campo de aptidão para contexto de trânsito!**
