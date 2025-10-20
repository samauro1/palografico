# ⚠️ IMPORTANTE: Assinatura Digital é SIMULADA

## 🔍 CERTIFICADO EXIBIDO É MOCK/TESTE

### **O que você está vendo:**
Quando clica em "Carregar Certificados" no sistema, aparece:
```
MAURO ARIEL SANCHEZ - 237.244.708-43 (Válido até: 2025-12-31)
```

### **⚠️ ISSO É UMA SIMULAÇÃO!**

Este certificado **NÃO É REAL**. Está codificado diretamente no arquivo:
```
routes/assinatura-digital.js (linhas 19-28)
```

---

## 📝 CÓDIGO ATUAL (SIMULADO)

### **Localização:**
`routes/assinatura-digital.js`

### **Certificados Simulados:**
```javascript
const certificados = [
  {
    id: 'cert-001',
    nome: 'MAURO ARIEL SANCHEZ',      // ← HARDCODED
    cpf: '237.244.708-43',             // ← HARDCODED
    validade: '2025-12-31',            // ← HARDCODED
    tipo: 'e-CPF',                     // ← HARDCODED
    status: 'ativo'                    // ← HARDCODED
  }
];
```

### **Por que simulado?**
```javascript
// Linha 7-10 do arquivo:
// Simulação de acesso ao certificado digital e-CPF
// Em produção, isso seria implementado com bibliotecas como:
// - node-pkcs11 (para acesso direto ao leitor CCID)
// - ou integração com serviços como Lacuna Software
```

---

## 🎯 COMO FUNCIONA ATUALMENTE

### **1. Carregar Certificados:**
- **O que faz:** Retorna certificado simulado hardcoded
- **O que DEVERIA fazer:** Ler certificado real do token A3/CCID

### **2. Validar Certificado:**
- **O que faz:** Sempre retorna "válido" (simulação)
- **O que DEVERIA fazer:** Validar certificado real com a cadeia de certificação

### **3. Assinar Documento:**
- **O que faz:** Cria uma "assinatura" falsa
- **O que DEVERIA fazer:** Assinar com chave privada real do certificado

### **4. PIN:**
- **O que faz:** Aceita PIN "1234" ou "0000" (simulação)
- **O que DEVERIA fazer:** Validar PIN real do token A3

---

## 🔧 PARA IMPLEMENTAÇÃO REAL

### **Opção 1: Node.js com PKCS#11**

#### **Bibliotecas Necessárias:**
```bash
npm install node-pkcs11
npm install pkcs11js
```

#### **Código Real:**
```javascript
const pkcs11 = require('pkcs11js');
const pkcs11Lib = new pkcs11.PKCS11();

// Carregar biblioteca do driver do token
pkcs11Lib.load('/caminho/para/eToken.dll'); // Windows
// ou '/usr/lib/libeToken.so' no Linux

// Inicializar
pkcs11Lib.C_Initialize();

// Listar slots (leitores)
const slots = pkcs11Lib.C_GetSlotList(true);

// Abrir sessão
const session = pkcs11Lib.C_OpenSession(slots[0], flags);

// Login com PIN
pkcs11Lib.C_Login(session, userType, pin);

// Buscar certificados
const objects = pkcs11Lib.C_FindObjectsInit(session, template);
// ... etc
```

---

### **Opção 2: Lacuna PKI SDK (Mais Fácil)**

#### **Serviço Comercial:**
```
https://www.lacunasoftware.com/
```

#### **Vantagens:**
- ✅ Abstrai complexidade do PKCS#11
- ✅ Suporte técnico
- ✅ Documentação completa
- ✅ SDKs para Node.js

#### **Código com Lacuna:**
```javascript
const { PkiExpressClient } = require('pki-express');

const client = new PkiExpressClient();
// ... código muito mais simples
```

---

### **Opção 3: Integração com Desktop App**

#### **Fluxo:**
1. Criar aplicativo desktop (Electron ou similar)
2. App desktop acessa token A3 via PKCS#11
3. Web app comunica com desktop app via WebSocket
4. Desktop app faz a assinatura real
5. Retorna assinatura para web app

---

## 💡 POR QUE FOI FEITO SIMULADO?

### **Razões Técnicas:**

1. **Complexidade do PKCS#11:**
   - Requer drivers nativos do token
   - Diferente para cada fabricante (SafeNet, Gemalto, etc.)
   - Difícil de debugar

2. **Ambiente Web:**
   - Navegadores não acessam hardware diretamente
   - Requer app desktop ou extensão de navegador
   - Questões de segurança do browser

3. **Desenvolvimento:**
   - Permite testar a **UI** e **fluxo** sem hardware
   - Pode ser implementado real depois
   - Frontend já está pronto

---

## 🎯 PRÓXIMOS PASSOS PARA ASSINATURA REAL

### **Se quiser implementar assinatura digital REAL:**

#### **Passo 1: Decidir Abordagem**
- **A)** Desktop App + PKCS#11 (mais complexo, gratuito)
- **B)** Lacuna PKI SDK (mais fácil, pago)
- **C)** Manter visual (upload de imagem) + assinar PDF externamente

#### **Passo 2: Instalar Dependências**
```bash
# Opção A:
npm install pkcs11js node-pkcs11

# Opção B:
npm install pki-express
```

#### **Passo 3: Substituir Código Simulado**
Trocar o conteúdo de `routes/assinatura-digital.js` por código real

#### **Passo 4: Testar com Token Real**
- Conectar token A3 no computador
- Instalar drivers do fabricante
- Testar leitura do certificado
- Testar assinatura

---

## 📋 RECOMENDAÇÃO ATUAL

### **Para Uso Profissional AGORA:**

Use a **abordagem híbrida** que já está implementada:

1. ✅ **Assinatura Visual** - Upload de imagem no sistema
2. ✅ **PDF Gerado** - Download do PDF
3. ✅ **Assinatura Digital Externa** - Usar Adobe Reader ou similar

#### **Fluxo:**
```
1. Gerar PDF no sistema
2. Baixar PDF
3. Abrir no Adobe Reader
4. Assinar com certificado A3
   - Reader detecta token automaticamente
   - Solicita PIN
   - Aplica assinatura digital
5. Salvar PDF assinado
6. Enviar ao paciente
```

**Esta abordagem é 100% válida juridicamente!** ✅

---

## ⚠️ ATENÇÃO

### **Assinatura Atual do Sistema:**
- ❌ **NÃO é válida juridicamente**
- ❌ **Apenas para demonstração**
- ❌ **Certificado é fake/mock**
- ❌ **PIN não valida nada real**

### **Para Fins Legais:**
Use o método híbrido (visual + Adobe Reader) até implementar integração real com token A3.

---

**Sistema Palográfico - Assinatura Digital Simulada** ⚠️

**Para uso real, assine PDFs externamente com Adobe Reader + Token A3!** 🔐📄
