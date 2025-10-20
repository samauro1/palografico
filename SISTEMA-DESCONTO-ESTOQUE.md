# 📦 Sistema de Desconto Automático de Estoque

## ✨ **Funcionalidade Implementada**

Sistema completo de controle de estoque que desconta automaticamente as folhas de teste quando uma avaliação é aplicada, com opção de desabilitar o desconto para simulações.

---

## 🎯 **Como Funciona**

### **1. Toggle de Controle**

Na página `/testes`, há um **toggle visual** que controla se o estoque será descontado:

```
┌─────────────────────────────────────────────┐
│ 📦 Descontar do Estoque          [ON/OFF]  │
│ ✅ Folhas serão descontadas ao salvar       │
│                                             │
│ 📋 Folhas que serão descontadas:           │
│ • Rotas: 3 folhas (C + A + D)               │
└─────────────────────────────────────────────┘
```

**Estados:**
- 🟢 **ON (Ativado)**: Desconta do estoque ao salvar (padrão)
- ⚪ **OFF (Desativado)**: Apenas calcula, não desconta

---

### **2. Mapeamento de Consumo**

Cada teste consome uma quantidade específica de folhas:

| Teste | Folhas Consumidas | Descrição |
|-------|-------------------|-----------|
| **Rotas de Atenção** | **3** | 1 Concentrada + 1 Alternada + 1 Dividida |
| Memore - Memória | 1 | 1 folha de Memore |
| MIG - Avaliação Psicológica | 1 | 1 folha de MIG |
| R-1 - Raciocínio | 1 | 1 folha de R-1 |
| AC - Atenção Concentrada | 1 | 1 folha de AC |
| BETA-III - Raciocínio Matricial | 1 | 1 folha de BETA-III |
| BPA-2 - Atenção | 1 | 1 folha de BPA-2 |
| MVT - Memória Visual | 1 | 1 folha de MVT |
| Palográfico | 1 | 1 folha de Palográfico |

---

### **3. Quando o Desconto Acontece**

#### **✅ Desconto OCORRE quando:**
- ✅ Modo de avaliação: **Vinculada**
- ✅ Toggle: **Ativado** (verde)
- ✅ Resultado: **Salvo com sucesso**

#### **❌ Desconto NÃO OCORRE quando:**
- ❌ Modo de avaliação: **Anônima**
- ❌ Toggle: **Desativado** (cinza)
- ❌ Erro ao salvar resultado

---

## 🔧 **Implementação Técnica**

### **Frontend (página de testes)**

#### **Estado:**
```typescript
const [descontarEstoque, setDescontarEstoque] = useState(true);
```

#### **Toggle UI:**
```tsx
<button
  onClick={() => setDescontarEstoque(!descontarEstoque)}
  className={`toggle ${descontarEstoque ? 'bg-green-500' : 'bg-gray-300'}`}
>
  <span className={`slider ${descontarEstoque ? 'translate-x-7' : 'translate-x-1'}`} />
</button>
```

#### **Envio ao Backend:**
```typescript
dataToSend.descontarEstoque = analysisType === 'linked' && descontarEstoque;
const response = await tabelasService.calculate(selectedTest.id, dataToSend);
```

---

### **Backend (routes/tabelas.js)**

#### **Mapeamento de Consumo:**
```javascript
const CONSUMO_ESTOQUE = {
  'memore': { quantidade: 1, descricao: '1 folha de Memore' },
  'mig': { quantidade: 1, descricao: '1 folha de MIG' },
  'r1': { quantidade: 1, descricao: '1 folha de R-1' },
  'ac': { quantidade: 1, descricao: '1 folha de AC' },
  'beta-iii': { quantidade: 1, descricao: '1 folha de BETA-III' },
  'bpa2': { quantidade: 1, descricao: '1 folha de BPA-2' },
  'mvt': { quantidade: 1, descricao: '1 folha de MVT' },
  'palografico': { quantidade: 1, descricao: '1 folha de Palográfico' },
  'rotas': { quantidade: 3, descricao: '3 folhas (C + A + D)' }
};
```

#### **Função de Desconto:**
```javascript
async function descontarEstoqueTeste(tipoTeste, avaliacaoId, usuarioId) {
  // 1. Buscar consumo do teste
  const consumo = CONSUMO_ESTOQUE[tipoTeste];
  
  // 2. Buscar item no estoque
  const estoqueItem = await query('SELECT id, quantidade_atual FROM testes_estoque...');
  
  // 3. Validar estoque suficiente
  if (novaQuantidade < 0) {
    return { success: false, message: 'Estoque insuficiente' };
  }
  
  // 4. Atualizar estoque
  await query('UPDATE testes_estoque SET quantidade_atual = $1...', [novaQuantidade]);
  
  // 5. Registrar movimentação
  await query('INSERT INTO movimentacoes_estoque ...', [
    estoqueItem.id,
    'saida',
    consumo.quantidade,
    `Aplicação de teste - Avaliação #${avaliacaoId}`,
    usuarioId,
    avaliacaoId  // Vincula a movimentação à avaliação
  ]);
  
  return { success: true, quantidade_descontada, novo_saldo };
}
```

#### **Integração no Salvamento:**
```javascript
async function salvarResultadoTeste(tipo, avaliacaoId, dados, resultado, descontarEstoque, usuarioId) {
  // ... salvar resultado do teste ...
  
  // Descontar estoque se habilitado
  if (descontarEstoque && usuarioId) {
    await descontarEstoqueTeste(tipo, avaliacaoId, usuarioId);
  }
}
```

---

## 🗄️ **Banco de Dados**

### **Migração Aplicada:**
```sql
ALTER TABLE movimentacoes_estoque 
ADD COLUMN avaliacao_id INTEGER REFERENCES avaliacoes(id) ON DELETE SET NULL;

CREATE INDEX idx_movimentacoes_avaliacao 
ON movimentacoes_estoque(avaliacao_id);
```

### **Estrutura da Movimentação:**
```sql
movimentacoes_estoque:
  - id: integer
  - teste_id: integer (FK -> testes_estoque)
  - tipo_movimentacao: varchar ('entrada' | 'saida')
  - quantidade: integer
  - observacoes: text
  - usuario_id: integer (FK -> usuarios)
  - avaliacao_id: integer (FK -> avaliacoes) ← NOVO
  - created_at: timestamp
```

---

## 📊 **Exemplo de Fluxo**

### **Cenário 1: Aplicação Normal (com desconto)**

```
1. Usuário acessa /testes
2. Seleciona "Rotas de Atenção"
3. Modo: Vinculado
4. Toggle: ✅ ON (descontar estoque)
5. Preenche CPF/Laudo
6. Completa o teste
7. Clica "Calcular Resultado"
```

**Resultado:**
```
✅ Teste salvo com sucesso na avaliação! (estoque descontado)

Banco de Dados:
- resultados_rotas: 3 linhas (A, C, D)
- testes_estoque: Rotas de Atenção: 75 → 72 (-3)
- movimentacoes_estoque: 1 linha
  {
    teste_id: 4,
    tipo: 'saida',
    quantidade: 3,
    observacoes: 'Aplicação de teste Rotas de Atenção - Avaliação #25',
    usuario_id: 9,
    avaliacao_id: 25
  }
```

---

### **Cenário 2: Simulação (sem desconto)**

```
1. Usuário acessa /testes
2. Seleciona "Memore - Memória"
3. Modo: Vinculado
4. Toggle: ⚪ OFF (NÃO descontar estoque)
5. Preenche CPF/Laudo
6. Completa o teste
7. Clica "Calcular Resultado"
```

**Resultado:**
```
✅ Teste salvo com sucesso na avaliação! (sem desconto de estoque)

Banco de Dados:
- resultados_memore: 1 linha
- testes_estoque: Memore: 60 → 60 (sem alteração)
- movimentacoes_estoque: nenhuma linha criada
```

---

### **Cenário 3: Modo Anônimo**

```
1. Usuário acessa /testes
2. Seleciona "MIG"
3. Modo: ❌ Anônima
4. Toggle: (irrelevante, nunca desconta)
5. Completa o teste
6. Clica "Calcular Resultado"
```

**Resultado:**
```
✅ Teste calculado (não vinculado ao paciente)

Banco de Dados:
- Nenhuma alteração (não salva resultado nem desconta estoque)
```

---

## 🚨 **Validações e Segurança**

### **1. Estoque Insuficiente**

Se não houver folhas suficientes:

```javascript
{
  success: false,
  message: 'Estoque insuficiente de Rotas de Atenção. Disponível: 2, Necessário: 3'
}
```

**Comportamento:**
- ✅ Teste **ainda é salvo** no banco
- ⚠️ Estoque **não é alterado**
- ⚠️ Log registra o erro
- ℹ️ Usuário **não é bloqueado**

### **2. Modo Anônimo**

Em modo anônimo:
- ❌ **Nunca** desconta estoque
- ❌ **Nunca** salva no banco
- ✅ Aviso claro ao usuário

---

## 📋 **Rastreabilidade**

Cada movimentação de estoque está **vinculada à avaliação** que a originou:

```sql
SELECT 
  m.quantidade,
  m.created_at,
  t.nome_teste,
  u.nome as usuario,
  a.numero_laudo,
  p.nome as paciente
FROM movimentacoes_estoque m
JOIN testes_estoque t ON m.teste_id = t.id
JOIN usuarios u ON m.usuario_id = u.id
LEFT JOIN avaliacoes a ON m.avaliacao_id = a.id
LEFT JOIN pacientes p ON a.paciente_id = p.id
WHERE m.tipo_movimentacao = 'saida'
ORDER BY m.created_at DESC;
```

**Resultado:**
```
quantidade | created_at | nome_teste    | usuario  | numero_laudo | paciente
-----------|------------|---------------|----------|--------------|---------------
    3      | 2025-10-17 | Rotas...      | Admin    | LAU-2025-13  | Diogo Sanchez
    1      | 2025-10-17 | Memore...     | Admin    | LAU-2025-13  | Diogo Sanchez
```

---

## 🎨 **Interface do Usuário**

### **Toggle de Estoque:**

```
┌─────────────────────────────────────────────────────┐
│ 📦 Descontar do Estoque                    [🟢 ON] │
│ ✅ Folhas serão descontadas ao salvar o resultado   │
│                                                     │
│ 📋 Folhas que serão descontadas:                   │
│ • Rotas: 3 folhas (Concentrada + Alternada +       │
│          Dividida)                                  │
└─────────────────────────────────────────────────────┘
```

**Quando OFF:**
```
┌─────────────────────────────────────────────────────┐
│ 📦 Descontar do Estoque                    [⚪ OFF]│
│ ⚠️ Estoque não será alterado (apenas cálculo)       │
└─────────────────────────────────────────────────────┘
```

---

## 📈 **Casos de Uso**

### **✅ Quando ATIVAR o desconto:**
- Aplicação real de teste com folhas físicas
- Avaliação oficial de paciente
- Necessário rastreamento de consumo

### **⚪ Quando DESATIVAR o desconto:**
- Simulação/treinamento
- Teste de exemplo para demonstração
- Cálculo de pontuação sem aplicação física
- Revisão de gabarito sem usar material

---

## 🔄 **Fluxo Completo**

```
┌──────────────────┐
│ Usuário completa │
│ teste vinculado  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Frontend envia:  │
│ - dados do teste │
│ - descontarEstoque: true/false
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Backend:         │
│ 1. Calcula       │
│ 2. Salva resultado│
│ 3. Se descontar: │
│    - Busca item  │
│    - Valida qntd │
│    - Desconta    │
│    - Registra    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Resposta:        │
│ ✅ Salvo com     │
│    desconto      │
│ ou               │
│ ✅ Salvo sem     │
│    desconto      │
└──────────────────┘
```

---

## 💾 **Dados Salvos**

### **Avaliação Vinculada + Estoque ON:**
```json
{
  "resultados_rotas": [
    { "avaliacao_id": 25, "rota_tipo": "C", "acertos": 45, ... },
    { "avaliacao_id": 25, "rota_tipo": "A", "acertos": 48, ... },
    { "avaliacao_id": 25, "rota_tipo": "D", "acertos": 42, ... }
  ],
  "testes_estoque": {
    "Rotas de Atenção": {
      "antes": 75,
      "depois": 72,
      "descontado": 3
    }
  },
  "movimentacoes_estoque": [{
    "id": 156,
    "teste_id": 4,
    "tipo_movimentacao": "saida",
    "quantidade": 3,
    "observacoes": "Aplicação de teste Rotas de Atenção - Avaliação #25",
    "usuario_id": 9,
    "avaliacao_id": 25,
    "created_at": "2025-10-17T19:15:00Z"
  }]
}
```

---

## 🎯 **Benefícios**

### **1. Controle Preciso:**
- ✅ Rastreamento de cada folha usada
- ✅ Histórico completo de consumo
- ✅ Vínculo direto avaliação ↔ estoque

### **2. Flexibilidade:**
- ✅ Pode desabilitar para simulações
- ✅ Não bloqueia se estoque acabar
- ✅ Avisos claros ao usuário

### **3. Auditoria:**
- ✅ Quem usou a folha (usuario_id)
- ✅ Para qual avaliação (avaliacao_id)
- ✅ Quando foi usado (created_at)
- ✅ Quantas folhas (quantidade)

---

## 🔔 **Notificações**

### **Com Desconto:**
```
✅ Teste salvo com sucesso na avaliação! (estoque descontado)
```

### **Sem Desconto:**
```
✅ Teste salvo com sucesso na avaliação! (sem desconto de estoque)
```

### **Estoque Insuficiente:**
```
⚠️ Não foi possível descontar estoque: Estoque insuficiente de Rotas de Atenção. 
    Disponível: 2, Necessário: 3
```
*(O teste ainda é salvo, apenas o estoque não é descontado)*

---

## 📍 **Onde Ver**

### **Página de Testes:**
`/testes` → Toggle abaixo de "Modo de Avaliação"

### **Página de Estoque:**
`/estoque` → Ver saldo atual de cada teste

### **Histórico de Movimentações:**
_(A implementar no futuro: `/estoque/movimentacoes`)_

---

## ✅ **Status da Implementação**

| Componente | Status |
|------------|--------|
| Toggle UI | ✅ Completo |
| Mapeamento de consumo | ✅ Completo |
| Função de desconto | ✅ Completo |
| Validação de estoque | ✅ Completo |
| Registro de movimentação | ✅ Completo |
| Vínculo avaliação ↔ movimento | ✅ Completo |
| Feedback visual | ✅ Completo |
| Logs detalhados | ✅ Completo |

---

## 🚀 **Como Usar**

1. Acesse `/testes`
2. Selecione um teste (ex: Rotas de Atenção)
3. Escolha **"Vinculado"**
4. Veja o toggle **"Descontar do Estoque"**:
   - 🟢 **Ativado**: Vai descontar 3 folhas
   - ⚪ **Desativado**: Só calcula, não desconta
5. Complete e salve o teste
6. Veja a notificação confirmando o desconto (ou não)
7. Acesse `/estoque` para ver o novo saldo

**Sistema 100% operacional! 🎉**

