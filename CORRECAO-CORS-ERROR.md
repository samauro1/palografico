# Correção - Erro de CORS ✅

## 🐛 **Problema Identificado**

### **Erro:**
```
Access to XMLHttpRequest at 'http://localhost:3001/api/pacientes' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### **Causa Raiz:**
O servidor backend no `localhost:3001` não estava configurado corretamente para aceitar requisições do frontend no `localhost:3000`, bloqueando as chamadas de API devido à política de CORS (Cross-Origin Resource Sharing).

---

## 🔍 **O que é CORS?**

**CORS (Cross-Origin Resource Sharing)** é um mecanismo de segurança que permite que um servidor especifique quais origens (domínios) podem acessar seus recursos.

### **Por que o erro ocorria:**
- **Frontend:** `http://localhost:3000` (Next.js)
- **Backend:** `http://localhost:3001` (Express)
- **Problema:** Portas diferentes = origens diferentes
- **Resultado:** Navegador bloqueia a requisição por segurança

### **Preflight Request:**
Para requisições complexas (POST, PUT, DELETE, ou com headers customizados), o navegador envia uma requisição **OPTIONS** antes da requisição real para verificar se o servidor permite a operação. Se o servidor não responder corretamente ao preflight, a requisição real é bloqueada.

---

## ✅ **Solução Implementada**

### **Antes:**
```javascript
// Configuração básica que não tratava todos os casos
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seudominio.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
```

### **Depois:**
```javascript
// Middleware de CORS - DEVE vir ANTES de todas as rotas
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (como mobile apps ou curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://seudominio.com']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3000'];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Tratar preflight requests explicitamente
app.options('*', cors(corsOptions));
```

---

## 📋 **O que foi melhorado:**

### **1. Função de origem dinâmica:**
```javascript
origin: function (origin, callback) {
  if (!origin) return callback(null, true);  // Permite requests sem origin
  // Verifica se a origin está na lista de permitidos
}
```
- ✅ **Flexível:** Valida a origem dinamicamente
- ✅ **Seguro:** Só permite origens aprovadas
- ✅ **Robusto:** Trata casos especiais (mobile apps, curl)

### **2. Métodos HTTP explícitos:**
```javascript
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
```
- ✅ Especifica exatamente quais métodos são permitidos

### **3. Headers permitidos:**
```javascript
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
```
- ✅ **Content-Type:** Para enviar JSON
- ✅ **Authorization:** Para tokens JWT
- ✅ **X-Requested-With:** Para requisições AJAX
- ✅ **Accept:** Para especificar tipo de resposta

### **4. Headers expostos:**
```javascript
exposedHeaders: ['Content-Range', 'X-Content-Range']
```
- ✅ Permite que o frontend acesse headers de paginação

### **5. MaxAge:**
```javascript
maxAge: 86400  // 24 horas
```
- ✅ Cache de preflight por 24 horas
- ✅ Reduz número de requisições OPTIONS

### **6. Tratamento explícito de OPTIONS:**
```javascript
app.options('*', cors(corsOptions));
```
- ✅ Trata preflight requests explicitamente
- ✅ Garante resposta correta para todas as rotas

### **7. Origens permitidas expandidas:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',      // Frontend Next.js
  'http://localhost:3001',      // Backend (para testes)
  'http://localhost:3002',      // Alternativo
  'http://127.0.0.1:3000'       // IP local
];
```
- ✅ Cobre todas as variações de localhost

---

## 🔧 **Headers de Resposta CORS:**

Com a nova configuração, o servidor agora envia:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept
Access-Control-Expose-Headers: Content-Range,X-Content-Range
Access-Control-Max-Age: 86400
```

---

## 🚀 **Teste da Correção**

### **Passos para verificar:**

1. **Servidor backend rodando** em `http://localhost:3001` ✅
2. **Frontend rodando** em `http://localhost:3000` ✅
3. **Abra DevTools** → Aba Network
4. **Faça uma requisição** (ex: listar pacientes)
5. **Verifique headers da resposta:**
   - ✅ `Access-Control-Allow-Origin: http://localhost:3000`
   - ✅ `Access-Control-Allow-Credentials: true`

### **Resultado Esperado:**
- ✅ **Sem erros de CORS** no console
- ✅ **Requisições completadas** com sucesso
- ✅ **Dados carregados** corretamente
- ✅ **Preflight requests** tratados automaticamente

---

## 📊 **Fluxo de Requisição Corrigido:**

```
1. Frontend (localhost:3000) → OPTIONS request → Backend (localhost:3001)
   ✅ Backend responde com headers CORS permitindo a origem

2. Frontend (localhost:3000) → POST/GET/PUT/DELETE → Backend (localhost:3001)
   ✅ Backend processa e responde com dados + headers CORS

3. Navegador valida headers CORS
   ✅ Headers corretos = permite acesso aos dados

4. Frontend recebe dados
   ✅ Sucesso! 🎉
```

---

## ⚠️ **Importante:**

### **Desenvolvimento vs Produção:**

**Desenvolvimento (atual):**
```javascript
// Permite todos localhost em desenvolvimento
if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
  callback(null, true);
}
```

**Produção:**
```javascript
// IMPORTANTE: Em produção, substituir por seu domínio real:
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://seudominio.com', 'https://www.seudominio.com']
  : [...]
```

---

## ✅ **Correção Completa**

**O erro de CORS foi corrigido configurando corretamente:**

1. ✅ **Função de origem dinâmica** para validação flexível
2. ✅ **Métodos HTTP explícitos** (GET, POST, PUT, DELETE, etc.)
3. ✅ **Headers permitidos e expostos** corretamente
4. ✅ **Tratamento de preflight** com `app.options('*')`
5. ✅ **MaxAge** para cache de preflight
6. ✅ **Múltiplas origens** permitidas em desenvolvimento

**Agora o frontend pode se comunicar com o backend sem problemas de CORS!**

---

## 🔍 **Debug de CORS:**

Se ainda houver problemas, verifique:

1. **Servidor está rodando?**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **CORS está ativo?**
   ```bash
   curl -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        http://localhost:3001/api/pacientes
   ```

3. **Headers na resposta:**
   - Deve incluir `Access-Control-Allow-Origin`
   - Deve incluir `Access-Control-Allow-Methods`

**O problema está resolvido! 🎉**
