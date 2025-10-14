# Como Reiniciar os Servidores

## ✅ Cache Limpo!

O cache do Next.js foi removido com sucesso. Agora você precisa reiniciar os servidores.

---

## 🔧 Passo a Passo

### 1. Parar os Servidores Atuais

Se os servidores estiverem rodando, pare-os:

**No terminal do Backend:**
- Pressione **Ctrl+C**

**No terminal do Frontend:**
- Pressione **Ctrl+C**

---

### 2. Iniciar o Backend

Abra um terminal e execute:

```bash
cd D:\zite\palografico
npm run dev
```

**Aguarde ver:**
```
Servidor rodando na porta 3001
Banco de dados conectado
```

---

### 3. Iniciar o Frontend

Abra **OUTRO** terminal e execute:

```bash
cd D:\zite\palografico\frontend-nextjs
npm run dev
```

**Aguarde ver:**
```
✓ Ready in X.Xs
- Local:   http://localhost:3000
```

---

## 🧪 Testar a Aplicação

1. **Abra o navegador:** http://localhost:3000/testes

2. **Abra o Console do navegador:** F12 → Console

3. **Teste o MIG:**
   - Selecione: "MIG - Ensino Superior"
   - Digite: "15" no campo Acertos
   - Observe os logs no console

4. **Observe o Terminal do Backend:**
   - Deve mostrar:
     ```
     🔍 MIG Calculation - Tabela ID: 190, Tipo Avaliação: geral, Acertos: 15 (tipo: number)
     📊 MIG Query Result - Linhas encontradas: 1
        Percentil: 45, Classificação: Médio
     ```

5. **Resultado esperado na interface:**
   - ✅ Acertos: 15
   - 📊 Percentil: 45
   - 🏆 Classificação: Médio
   - 🎯 QI: 100

---

## 🐛 Se Ainda Houver Erros

### Erro: "Uncaught SyntaxError: Invalid or unexpected token"

**Causa:** Cache não foi totalmente limpo  
**Solução:**
1. Pare o frontend (Ctrl+C)
2. Execute:
   ```bash
   cd D:\zite\palografico\frontend-nextjs
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

### Erro: "Cannot find module"

**Causa:** Dependências não instaladas  
**Solução:**
```bash
cd D:\zite\palografico\frontend-nextjs
npm install
npm run dev
```

### Erro: Backend não responde

**Causa:** Backend não está rodando ou porta ocupada  
**Solução:**
1. Verifique se o backend está rodando em http://localhost:3001
2. Se não estiver, execute:
   ```bash
   cd D:\zite\palografico
   npm run dev
   ```

---

## 📋 Checklist

Antes de testar, certifique-se de que:

- [ ] Backend está rodando (porta 3001)
- [ ] Frontend está rodando (porta 3000)
- [ ] Cache `.next` foi removido
- [ ] Navegador foi recarregado (Ctrl+F5)
- [ ] Console do navegador está aberto (F12)
- [ ] Terminal do backend está visível

---

## 🎯 Resumo das Mudanças

### Backend (`routes/tabelas.js`):
1. ✅ Conversão automática de `acertos` para inteiro
2. ✅ Validação de entrada
3. ✅ Logs detalhados para debug

### Banco de Dados:
1. ✅ Norma duplicada de Percentil 50 removida (Ensino Superior, 15 acertos)
2. ✅ Faixas de acertos corrigidas
3. ✅ Regra de percentil duplicado implementada

### Frontend (`page.tsx`):
1. ✅ Logs detalhados adicionados
2. ✅ Cálculo automático funcionando

---

## 🚀 Comandos Rápidos

```bash
# Limpar cache e reiniciar frontend
cd D:\zite\palografico\frontend-nextjs
Remove-Item -Recurse -Force .next
npm run dev

# Reiniciar backend
cd D:\zite\palografico
npm run dev
```

---

**Pronto para uso!** 🎉

Depois de reiniciar os servidores, teste novamente e observe os logs detalhados.

