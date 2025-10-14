# MIG - Diagnóstico de Problemas

## 🔍 Problemas Reportados

### Problema 1: Motoristas Profissionais, 13 acertos
**Reportado:** QI não aparece  
**Esperado:** Percentil 70, Classificação Médio, QI 94

**Status do Banco de Dados:** ✅ CORRETO
```
Percentil: 70
Classificação: Médio
QI: 94
Classificação QI: Médio
```

### Problema 2: Ensino Superior, 15 acertos
**Reportado:** Percentil N/A, QI N/A, Classificação Fora da faixa normativa  
**Esperado:** Percentil 45, Classificação Médio, QI 100

**Status do Banco de Dados:** ✅ PARCIALMENTE CORRETO
```
Percentil: 50 (não 45, pois há dois percentis para 15 acertos: 45 e 50)
Classificação: Médio
QI: 100
Classificação QI: Médio
```

**Nota:** O sistema usa o MAIOR percentil quando há duplicatas, então retorna **50** em vez de **45**.

---

## 🧪 Como Testar

### Teste 1: Verificar Backend (API)

Execute o script de teste:
```bash
node scripts/test-mig-problemas.js
```

**Resultado esperado:**
- Motoristas Profissionais, 13 acertos → Percentil 70, QI 94 ✅
- Ensino Superior, 15 acertos → Percentil 50, QI 100 ✅

### Teste 2: Verificar Frontend

1. **Abra o navegador** e acesse http://localhost:3000/testes
2. **Abra o Console** (F12 → Console)
3. **Selecione o teste MIG**
4. **Selecione a tabela:** "MIG - Trânsito - Motorista Profissional"
5. **Digite no campo Acertos:** 13
6. **Observe os logs no console:**
   ```
   🔍 MIG: Acertos manual = 13, Tabela = 193
   📤 MIG: Enviando cálculo - Tabela 193, Acertos 13
   📥 MIG: Resposta recebida: { resultado: { ... } }
   📊 MIG: Resultado processado: { acertos: 13, percentil: 70, classificacao: 'Médio', qi: '94' }
   ```
7. **Verifique a interface:**
   - ✅ Acertos: 13
   - 📊 Percentil: 70
   - 🏆 Classificação: Médio
   - 🎯 QI: 94

### Teste 3: Ensino Superior

1. **Selecione a tabela:** "MIG - Ensino Superior"
2. **Digite no campo Acertos:** 15
3. **Observe os logs no console**
4. **Verifique a interface:**
   - ✅ Acertos: 15
   - 📊 Percentil: 50 (ou 45, dependendo da correção)
   - 🏆 Classificação: Médio
   - 🎯 QI: 100

---

## 🔧 Correções Aplicadas

### 1. Faixas de Acertos
✅ Script `corrigir-mig-faixas.js` executado  
✅ Todas as normas agora usam **faixas** em vez de valores exatos  
✅ Exemplo: 12 acertos está na faixa 12-13 para Percentil 30

### 2. Regra de Percentil Duplicado
✅ Query modificada para usar `ORDER BY percentil DESC`  
✅ Quando há múltiplos percentis para o mesmo número de acertos, usa o MAIOR

### 3. Cálculo Automático
✅ `useEffect` implementado no frontend  
✅ Calcula automaticamente quando o campo Acertos ou Tabela mudam  
✅ Logs adicionados para debug

### 4. Exibição de Resultados
✅ Seção dedicada para MIG com 4 cards:
- Acertos
- Percentil
- QI
- Classificação

---

## 📊 Dados no Banco (Verificados)

### Motoristas Profissionais (Tabela 193)
```
PERCENTIL | ACERTOS  | CLASSIFICAÇÃO
----------|----------|---------------
        5 |      3-3 | Inferior
       10 |      4-5 | Inferior
       15 |      6-6 | Médio inferior
       20 |      7-7 | Médio inferior
       25 |      7-7 | Médio inferior
       30 |      8-8 | Médio
       35 |      9-9 | Médio
       40 |      9-9 | Médio
       45 |    10-10 | Médio
       50 |    10-10 | Médio
       55 |    11-11 | Médio
       60 |    11-11 | Médio
       65 |    12-12 | Médio
       70 |    13-13 | Médio       ← 13 ACERTOS = PERCENTIL 70 ✅
       75 |    14-14 | Médio superior
       80 |    15-15 | Médio superior
       85 |    16-18 | Médio superior
       90 |    16-18 | Superior
       95 |    19-28 | Superior
```

### Ensino Superior (Tabela 190)
```
PERCENTIL | ACERTOS  | CLASSIFICAÇÃO
----------|----------|---------------
        5 |      6-7 | Inferior
       10 |      8-9 | Inferior
       15 |    10-10 | Médio inferior
       20 |    11-11 | Médio inferior
       25 |    12-12 | Médio inferior
       30 |    12-12 | Médio
       35 |    13-13 | Médio
       40 |    14-14 | Médio
       45 |    15-15 | Médio       ← 15 ACERTOS = PERCENTIL 45 (ou 50)
       50 |    15-15 | Médio       ← 15 ACERTOS = PERCENTIL 50 ✅
       55 |    16-16 | Médio
       60 |    17-17 | Médio
       65 |    18-18 | Médio
       70 |    19-19 | Médio
       75 |    19-19 | Médio superior
       80 |    20-20 | Médio superior
       85 |    21-21 | Médio superior
       90 |    22-23 | Superior
       95 |    24-28 | Superior
```

### Conversão QI (Tabela 194)
```
ACERTOS | QI  | CLASSIFICAÇÃO
--------|-----|---------------
   0    | <65 | Extremamente baixo
   1-2  | 65  | Extremamente baixo
   3    | 68  | Extremamente baixo
   4    | 71  | Limítrofe
   5    | 74  | Limítrofe
   6    | 77  | Limítrofe
   7    | 80  | Médio inferior
   8    | 82  | Médio inferior
   9    | 84  | Médio inferior
   10   | 87  | Médio inferior
   11   | 89  | Médio inferior
   12   | 91  | Médio
   13   | 94  | Médio              ← 13 ACERTOS = QI 94 ✅
   14   | 97  | Médio
   15   | 100 | Médio              ← 15 ACERTOS = QI 100 ✅
   16   | 102 | Médio
   17   | 105 | Médio
   18   | 107 | Médio
   19   | 110 | Médio Superior
   20   | 112 | Médio Superior
   21   | 115 | Médio Superior
   22   | 119 | Médio Superior
   23   | 123 | Superior
   24   | 127 | Superior
   25   | 132 | Muito superior
   26-28| >132| Muito superior
```

---

## 🚨 Possíveis Causas do Problema

Se o frontend ainda mostra N/A após as correções:

### 1. **Cache do Navegador**
- Limpe o cache do navegador (Ctrl+Shift+Del)
- Recarregue a página com Ctrl+F5

### 2. **Build Antigo do Frontend**
```bash
cd frontend-nextjs
npm run build
```

### 3. **Servidor não atualizado**
- Reinicie o backend: `npm run dev`
- Reinicie o frontend: `cd frontend-nextjs && npm run dev`

### 4. **Validação no Backend**
- O endpoint pode estar exigindo campos adicionais (email, cpf, etc.)
- Verifique o middleware de validação em `middleware/validation.js`

### 5. **Estado do Frontend**
- O campo `testData.acertos_manual` pode não estar sendo atualizado
- Verifique se o `onChange` do input está correto

---

## ✅ Checklist de Verificação

- [ ] Script `test-mig-problemas.js` retorna dados corretos
- [ ] Backend está rodando (http://localhost:3001)
- [ ] Frontend está rodando (http://localhost:3000)
- [ ] Console do navegador mostra logs `🔍 MIG:...`
- [ ] Campo "Acertos" está preenchido
- [ ] Tabela normativa está selecionada
- [ ] Resposta da API contém `resultado` com `percentil`, `classificacao`, `qi`
- [ ] Interface exibe os valores corretamente

---

## 📋 Próximos Passos

1. **Execute o script de teste:**
   ```bash
   node scripts/test-mig-problemas.js
   ```

2. **Teste no navegador** e copie os logs do console

3. **Se ainda houver problema**, envie os logs completos para análise

---

**Data:** 13 de outubro de 2025  
**Status:** ✅ Backend verificado e corrigido  
**Aguardando:** Teste no frontend pelo usuário

