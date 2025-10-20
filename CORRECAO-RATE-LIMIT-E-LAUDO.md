# Correção - Rate Limit 429 e Duplicação de Laudo ✅

## 🐛 **Problemas Identificados**

### **1. Erro 429 (Too Many Requests)**

**Erro:**
```
GET http://localhost:3001/api/avaliacoes/21/testes net::ERR_FAILED 429 (Too Many Requests)
Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**Causa:**
- Rate limiter configurado com limite de **100 requisições por 15 minutos**
- Em desenvolvimento, com hot reload e múltiplas abas, facilmente ultrapassa esse limite
- CORS parece estar bloqueado, mas na verdade é o rate limiter que rejeitou a requisição antes

### **2. Erro de Duplicação de Número de Laudo**

**Erro:**
```
error: duplicate key value violates unique constraint "avaliacoes_numero_laudo_key"
detail: 'Key (numero_laudo)=(LAU-2025-0013) already exists.'
```

**Causa:**
- Função `criarOuBuscarAvaliacao` tentava criar nova avaliação mesmo quando número de laudo já existia
- Não verificava se o laudo já estava em uso antes de tentar criar

---

## ✅ **Soluções Implementadas**

### **1. Rate Limiter Mais Permissivo em Desenvolvimento**

**Antes:**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // ❌ Muito restritivo para desenvolvimento
  message: 'Muitas tentativas de acesso...',
});
```

**Depois:**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' 
    ? 100        // Produção: 100 requests
    : 10000,     // ✅ Desenvolvimento: 10000 requests
  message: 'Muitas tentativas de acesso...',
  skip: (req) => {
    // Pular rate limit para requisições OPTIONS em desenvolvimento
    return process.env.NODE_ENV !== 'production' && req.method === 'OPTIONS';
  }
});
```

**Melhorias:**
- ✅ **10000 requisições** em desenvolvimento (vs 100 antes)
- ✅ **Pula OPTIONS** em desenvolvimento (preflight requests)
- ✅ **Mantém segurança** em produção (100 requests)

### **2. Verificação de Laudo Existente**

**Antes:**
```javascript
async function criarOuBuscarAvaliacao(paciente, usuarioId, dataAvaliacao, numeroLaudo) {
  // Verificar apenas por paciente + data
  const avaliacaoExistente = await query(...);
  
  if (avaliacaoExistente.rows.length > 0) {
    return avaliacaoExistente.rows[0];
  }
  
  // ❌ Tentar criar sem verificar se o laudo já existe
  const novaAvaliacao = await query(`INSERT ...`, [paciente.id, usuarioId, laudo, data]);
  
  return novaAvaliacao.rows[0];
}
```

**Depois:**
```javascript
async function criarOuBuscarAvaliacao(paciente, usuarioId, dataAvaliacao, numeroLaudo) {
  const data = dataAvaliacao || new Date().toISOString().split('T')[0];
  
  // ✅ 1. Primeiro verificar se o laudo já existe
  if (numeroLaudo) {
    const avaliacaoPorLaudo = await query(`
      SELECT id FROM avaliacoes WHERE numero_laudo = $1
    `, [numeroLaudo]);
    
    if (avaliacaoPorLaudo.rows.length > 0) {
      return avaliacaoPorLaudo.rows[0];  // Retorna avaliação existente
    }
  }
  
  // 2. Verificar se já existe para este paciente na data
  const avaliacaoExistente = await query(...);
  if (avaliacaoExistente.rows.length > 0) {
    return avaliacaoExistente.rows[0];
  }
  
  // 3. Criar nova avaliação com try/catch
  const laudo = numeroLaudo || `LAU-${ano}-${id}-${timestamp}`;
  
  try {
    const novaAvaliacao = await query(`INSERT ...`, [...]);
    return novaAvaliacao.rows[0];
  } catch (error) {
    // ✅ Se ainda houver erro de duplicação, buscar a existente
    if (error.code === '23505') {
      const avaliacaoExistentePorLaudo = await query(...);
      if (avaliacaoExistentePorLaudo.rows.length > 0) {
        return avaliacaoExistentePorLaudo.rows[0];
      }
    }
    throw error;
  }
}
```

**Melhorias:**
- ✅ **Verifica laudo** antes de tentar criar
- ✅ **Retorna avaliação existente** se laudo já usado
- ✅ **Try/catch** para tratar duplicações residuais
- ✅ **Geração de laudo** mais robusta com ID do paciente e timestamp

---

## 📋 **Fluxo Corrigido**

### **Ao Salvar um Teste Vinculado:**

```
1. Frontend envia dados com:
   - analysisType: 'linked'
   - patientData: { foundPatient: {...}, numero_laudo: 'LAU-2025-0013' }

2. Backend chama criarOuBuscarAvaliacao():
   
   a. ✅ Verifica se laudo 'LAU-2025-0013' já existe
      - Se SIM: retorna avaliacao_id existente
      - Se NÃO: continua
   
   b. ✅ Verifica se existe avaliação para paciente na data
      - Se SIM: retorna avaliacao_id existente
      - Se NÃO: continua
   
   c. ✅ Tenta criar nova avaliação
      - Se sucesso: retorna novo avaliacao_id
      - Se erro de duplicação: busca e retorna existente
   
3. Backend salva resultado do teste com avaliacao_id

4. ✅ Sucesso sem erro de duplicação!
```

---

## 🔧 **Tratamento de Erros**

### **Erro 429 - Too Many Requests:**

**Solução:**
- Aumentar limite para 10000 em desenvolvimento
- Pular OPTIONS em desenvolvimento
- Manter 100 em produção

**Resultado:**
- ✅ Sem bloqueio em desenvolvimento
- ✅ Preflight requests não contam
- ✅ Segurança mantida em produção

### **Erro 23505 - Duplicate Key:**

**Solução:**
- Verificar antes de inserir
- Try/catch para tratar duplicações
- Retornar avaliação existente em caso de erro

**Resultado:**
- ✅ Sem erro de duplicação
- ✅ Reutiliza avaliação existente
- ✅ Múltiplos testes na mesma avaliação

---

## 🎯 **Comportamento Esperado**

### **Cenário 1: Primeira vez salvando teste**
```
Paciente: João Silva (ID: 2)
Laudo: LAU-2025-0013
Data: 17/10/2025

1. Busca por laudo 'LAU-2025-0013' → Não existe
2. Busca por paciente 2 + data 17/10/2025 → Não existe
3. Cria nova avaliação (ID: 24)
4. Salva teste MIG na avaliação 24
✅ Sucesso!
```

### **Cenário 2: Salvando segundo teste na mesma avaliação**
```
Paciente: João Silva (ID: 2)
Laudo: LAU-2025-0013
Data: 17/10/2025

1. Busca por laudo 'LAU-2025-0013' → ✅ Encontrado (ID: 24)
2. Retorna avaliação existente (ID: 24)
3. Salva teste AC na avaliação 24
✅ Ambos testes na mesma avaliação!
```

### **Cenário 3: Mesmo paciente, dia diferente**
```
Paciente: João Silva (ID: 2)
Laudo: LAU-2025-0014
Data: 18/10/2025

1. Busca por laudo 'LAU-2025-0014' → Não existe
2. Busca por paciente 2 + data 18/10/2025 → Não existe
3. Cria nova avaliação (ID: 25)
4. Salva teste MIG na avaliação 25
✅ Nova avaliação criada!
```

---

## 📊 **Configurações Atualizadas**

### **Rate Limiter:**

| Ambiente       | Max Requests | Tempo   | OPTIONS  |
|----------------|--------------|---------|----------|
| Desenvolvimento| 10000        | 15 min  | Pulados  |
| Produção       | 100          | 15 min  | Contam   |

### **Validação de Laudo:**

```javascript
1. ✅ Buscar por número de laudo
2. ✅ Buscar por paciente + data
3. ✅ Tentar criar
4. ✅ Catch duplicação e buscar existente
5. ✅ Retornar avaliação (nova ou existente)
```

---

## ✅ **Teste das Correções**

### **Passos para testar:**

1. **Reinicie o servidor** backend (já feito)
2. **Acesse uma avaliação existente**
3. **Clique em "Realizar Testes"**
4. **Selecione e execute um teste**
5. **Clique em "Guardar Teste"**
6. **Resultado esperado:**
   - ✅ Sem erro 429
   - ✅ Sem erro de duplicação de laudo
   - ✅ Toast de sucesso
   - ✅ Teste salvo corretamente

### **Validação:**

**No console do backend:**
```
🔍 Verificando salvamento: { analysisType: 'linked', hasPatientData: true, hasFoundPatient: true }
💾 Salvando resultado vinculado...
📋 Dados do paciente: { id: 2, nome: 'João Silva', ... }
📋 Dados da avaliação: { data_avaliacao: '2025-10-17', numero_laudo: 'LAU-2025-0013' }
📋 Avaliação encontrada/criada: { id: 24 }
✅ Resultado do teste mig salvo na avaliação 24
```

**No frontend:**
```
✅ Teste salvo com sucesso na avaliação!
```

---

## 🎉 **Correções Completas**

**Problemas resolvidos:**
- ✅ **Erro 429** - Rate limiter ajustado para desenvolvimento
- ✅ **Erro de duplicação** - Verificação de laudo antes de criar
- ✅ **CORS bloqueado** - Era consequência do 429, agora resolvido
- ✅ **Reutilização de avaliação** - Múltiplos testes na mesma avaliação

**Melhorias implementadas:**
- ✅ **Rate limit flexível** por ambiente
- ✅ **Validação robusta** de número de laudo
- ✅ **Try/catch** para erros de duplicação
- ✅ **Reutilização inteligente** de avaliações existentes

**O sistema agora funciona sem erros de rate limit e sem duplicação de laudos!**
