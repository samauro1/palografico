# MIG - Instruções de Debug

## 🔍 Problema Identificado

O frontend está recebendo `percentil: null` mesmo com os dados corretos no banco.

## ✅ Correções Aplicadas

### 1. Conversão de Tipo no Backend

Adicionado `parseInt()` para garantir que `acertos` seja sempre um número inteiro:

```javascript
const acertos = parseInt(acertosRaw);
```

### 2. Validação de Entrada

Verifica se `acertos` é um número válido antes de processar:

```javascript
if (isNaN(acertos)) {
  console.error('❌ MIG: Acertos inválido:', acertosRaw);
  return { acertos: 0, percentil: null, ... };
}
```

### 3. Logs Detalhados

Adicionados logs para rastrear o fluxo:
- Tipo do valor de acertos
- Resultado da query
- Valores encontrados ou erro

---

## 🧪 Como Testar

### Passo 1: Reiniciar o Backend

**IMPORTANTE:** Você PRECISA reiniciar o backend para aplicar as mudanças!

1. No terminal onde o backend está rodando, pressione **Ctrl+C**
2. Execute novamente:
   ```bash
   npm run dev
   ```

### Passo 2: Testar no Navegador

1. Abra http://localhost:3000/testes
2. **Abra DOIS consoles simultaneamente:**
   - **Console do navegador** (F12 → Console)
   - **Terminal do backend** (onde você executou `npm run dev`)

3. Selecione **MIG - Ensino Superior**
4. Digite **15** no campo Acertos
5. Observe os logs em **AMBOS** os lugares

### Passo 3: Analisar os Logs

#### No Console do Navegador (Frontend):
```
🔍 MIG: Acertos manual = 15, Tabela = 190
📤 MIG: Enviando cálculo - Tabela 190, Acertos 15
📥 MIG: Resposta recebida: {resultado: {…}}
📊 MIG: Resultado processado: {...}
```

#### No Terminal do Backend:
```
🔍 MIG Calculation - Tabela ID: 190, Tipo Avaliação: geral, Acertos: 15 (tipo: number)
📊 MIG Query Result - Linhas encontradas: 1
   Percentil: 45, Classificação: Médio
```

---

## 🐛 Diagnóstico de Problemas

### Problema 1: Backend não mostra logs

**Causa:** Servidor não foi reiniciado  
**Solução:** Reinicie o backend (Ctrl+C e `npm run dev`)

### Problema 2: Tipo do acertos não é `number`

**Logs esperados:**
```
🔍 MIG Calculation - Acertos: 15 (tipo: number)
```

**Se aparecer `(tipo: string)`:**
- Problema no frontend ao enviar os dados
- Verificar se `parseInt()` está sendo aplicado

### Problema 3: Linhas encontradas = 0

**Logs:**
```
📊 MIG Query Result - Linhas encontradas: 0
❌ MIG: Nenhuma norma encontrada para Tabela 190, Acertos 15
```

**Possíveis causas:**
1. Tabela ID incorreto
2. `tipo_avaliacao` incorreto (deve ser 'geral')
3. Norma foi deletada acidentalmente
4. Problema com faixas (`acertos_min`, `acertos_max`)

**Solução:** Execute o script de verificação:
```bash
node scripts/debug-ensino-superior-15.js
```

---

## 📊 Verificação do Banco de Dados

Execute este script para confirmar que os dados estão corretos:

```bash
node scripts/debug-ensino-superior-15.js
```

**Resultado esperado:**
```
✅ Backend encontrou: Percentil 45, Médio
```

---

## 🔧 Scripts de Diagnóstico

### 1. Verificar Banco de Dados
```bash
node scripts/debug-ensino-superior-15.js
```

### 2. Verificar Todas as Duplicatas
```bash
node scripts/verificar-duplicatas-mig.js
```

### 3. Testar API Diretamente (via terminal do backend)
Observe os logs quando você testa no navegador.

---

## ✅ Checklist de Resolução

- [ ] Backend foi reiniciado após as mudanças
- [ ] Frontend está atualizando (sem cache)
- [ ] Console do navegador mostra logs detalhados
- [ ] Terminal do backend mostra logs detalhados
- [ ] Script `debug-ensino-superior-15.js` retorna resultado correto
- [ ] Tipo de `acertos` é `number` (não `string`)
- [ ] Query encontra linhas (`Linhas encontradas: 1`)

---

## 📋 Informações Importantes

### Endpoints

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:3000
- **API MIG:** POST http://localhost:3001/api/tabelas/mig/calculate

### Tabelas no Banco

- **ID 190:** MIG - Ensino Superior
- **ID 193:** MIG - Trânsito - Motorista Profissional  
- **ID 194:** MIG - Conversão QI

### Dados Corretos

**Ensino Superior, 15 acertos:**
- Percentil: 45
- Classificação: Médio
- QI: 100

**Motorista Profissional, 13 acertos:**
- Percentil: 70
- Classificação: Médio
- QI: 94

---

## 🎯 Próximo Passo

**REINICIE O BACKEND e teste novamente!**

Se ainda houver problema, copie os logs completos:
1. Do console do navegador (frontend)
2. Do terminal do backend

E envie para análise.

---

**Data:** 13 de outubro de 2025  
**Status:** ⏳ Aguardando reinício do backend e novo teste

