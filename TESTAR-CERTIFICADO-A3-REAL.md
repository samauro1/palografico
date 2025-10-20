# 🧪 Testar Certificado A3 Real - Guia Rápido

## ✅ O QUE FOI IMPLEMENTADO

O sistema agora está preparado para usar **certificados digitais REAIS** do token A3 físico!

---

## 🚀 TESTE RÁPIDO (3 PASSOS)

### **Passo 1: Conectar Token A3**
1. Inserir token na porta USB
2. Aguardar Windows reconhecer (LED deve acender)

### **Passo 2: Executar Teste**
```powershell
cd D:\zite\palografico
node test-token-a3.js
```

### **Passo 3: Ver Resultado**

#### **✅ SE DEU CERTO:**
```
✅ TOKEN A3 DETECTADO COM SUCESSO!

📋 1 certificado(s) encontrado(s):

╭─────────────────────────────────────────────────────────╮
│  Certificado 1                                           │
├─────────────────────────────────────────────────────────┤
│  Nome:      MAURO ARIEL SANCHEZ                          │
│  CPF:       237.244.708-43                               │
│  Tipo:      e-CPF                                        │
│  Validade:  2025-12-31                                   │
│  Emissor:   AC Certisign Multipla G5                     │
╰─────────────────────────────────────────────────────────╯

✅ SISTEMA PRONTO PARA ASSINAR DOCUMENTOS!
```

**👉 PRÓXIMO:** Ir para o sistema e assinar documentos!

---

#### **❌ SE DER ERRO:**

##### **Erro 1: Driver não encontrado**
```
❌ Biblioteca NÃO encontrada

📥 INSTALE O DRIVER DO SEU TOKEN
```

**Solução:**
1. Identificar marca do token (SafeNet, Gemalto, Watchdata)
2. Baixar driver do fabricante:
   - **SafeNet:** https://support.thalesgroup.com/
   - **Gemalto:** https://www.gemalto.com/
3. Instalar como Administrador
4. **Reiniciar o computador**
5. Executar teste novamente

---

##### **Erro 2: Token não conectado**
```
❌ Token A3 não detectado
```

**Solução:**
1. Conectar token na USB
2. Aguardar reconhecimento (5-10 segundos)
3. Verificar LED do token aceso
4. Trocar de porta USB se necessário
5. Executar teste novamente

---

##### **Erro 3: Nenhum certificado no token**
```
❌ Token detectado mas sem certificados
```

**Solução:**
- Token pode estar vazio
- Verificar com a AC (Autoridade Certificadora)
- Solicitar emissão/renovação de certificado

---

## 🔧 INSTALAÇÃO DO DRIVER (DETALHADO)

### **Identificar Fabricante:**

Veja a marca no token físico:
- **SafeNet** (eToken)
- **Gemalto** (IDPrime)
- **Watchdata**

---

### **SafeNet eToken:**

1. **Baixar:**
   - URL: https://support.thalesgroup.com/
   - Buscar: "SafeNet Authentication Client"
   - Download: `SAC_Windows_x64.exe` (última versão)

2. **Instalar:**
   ```powershell
   # Clicar com botão direito no arquivo
   # "Executar como Administrador"
   ```

3. **Arquivos instalados:**
   - `C:\Program Files\SafeNet\Authentication\SAC\x64\eTPKCS11.dll`
   - `C:\Windows\System32\eTPKCS11.dll`

4. **Reiniciar computador**

---

### **Gemalto IDPrime:**

1. **Baixar:**
   - URL: https://www.gemalto.com/
   - Buscar: "IDGo 800 Client"

2. **Instalar:**
   - Executar como Administrador

3. **Arquivos instalados:**
   - `C:\Program Files\Gemalto\Classic Client\BIN\gclib.dll`

4. **Reiniciar computador**

---

### **Watchdata:**

1. **Baixar:**
   - Site do fornecedor do certificado
   - Ou site do fabricante

2. **Instalar:**
   - Executar como Administrador

3. **Reiniciar computador**

---

## 🎯 USAR NO SISTEMA

### **1. Iniciar Servidores:**
```powershell
cd D:\zite\palografico
node start-dev.js
```

### **2. Acessar Sistema:**
```
http://192.168.6.230:3000
```

### **3. Ir para Relatórios:**
- Menu: **Relatórios e Laudos**
- Aba: **Declaração** ou **Laudos**

### **4. Buscar Documento:**
- Informar CPF ou Laudo
- Clicar "Buscar"

### **5. Rolar até Assinatura Digital:**
```
🔐 Assinatura Digital com e-CPF
```

### **6. Carregar Certificados:**
- Clicar: **"Carregar Certificados"**
- Sistema detecta token automaticamente
- Lista certificados REAIS

### **7. Selecionar Certificado:**
- Escolher no dropdown
- Ver informações (nome, CPF, validade)

### **8. Validar Certificado (Opcional):**
- Clicar: **"Validar Certificado"**
- Sistema valida sem pedir PIN

### **9. Assinar Digitalmente:**
1. Clicar: **"🔐 Assinar Digitalmente"**
2. Sistema abre modal pedindo PIN
3. Digitar PIN do token (4-8 dígitos)
4. Clicar "Confirmar"
5. Aguardar processamento
6. Ver confirmação: "✅ Documento Assinado"

### **10. Baixar PDF Assinado:**
- Clicar: **"Baixar PDF"**
- PDF incluirá informações da assinatura digital

---

## ⚠️ SEGURANÇA DO PIN

### **ATENÇÃO:**
- ⚠️ **3 tentativas erradas = TOKEN BLOQUEADO**
- 🔐 Se bloquear: Precisa usar código **PUK** para desbloquear
- 📞 PUK: Fornecido pela AC (Autoridade Certificadora)

### **Dicas:**
- Tenha certeza do PIN antes de digitar
- Não compartilhe o PIN
- Se esqueceu: Entre em contato com a AC ANTES de tentar

---

## 📊 DIFERENÇAS: SIMULADO vs REAL

| Recurso | ANTES (Simulado) | AGORA (Real) |
|---------|------------------|--------------|
| **Certificado** | Hardcoded no código | Lê do token físico |
| **PIN** | Fake (1234/0000) | PIN real do token |
| **Assinatura** | Hash simples | Criptografia RSA |
| **Chave Privada** | Não usa | Usa do token |
| **Validade Legal** | ❌ Não | ✅ Sim (ICP-Brasil) |

---

## 🔍 LOGS DO BACKEND

### **O que esperar no console do backend:**

```
🔍 Listando certificados REAIS do token A3...
🔍 Procurando biblioteca PKCS#11 instalada...
✅ Biblioteca encontrada: C:\Windows\System32\eTPKCS11.dll
📂 Carregando biblioteca PKCS#11...
🔌 Inicializando...
🔍 Listando slots (leitores)...
✅ 1 leitor(es) encontrado(s)

🔍 Verificando slot 0...
   Descrição: SafeNet eToken 5110
   Token: MAURO SANCHEZ
   1 certificado(s) encontrado(s)
   ✅ Certificado: MAURO ARIEL SANCHEZ:12345678900
      CPF: 237.244.708-43
      Validade: 2025-12-31
```

---

## ✅ CHECKLIST COMPLETO

### **Antes de Assinar:**
- [ ] Token A3 conectado na USB
- [ ] LED do token aceso
- [ ] Driver instalado
- [ ] Teste executado com sucesso (`node test-token-a3.js`)
- [ ] Certificado listado corretamente
- [ ] PIN memorizado
- [ ] Servidores rodando

### **Durante Assinatura:**
- [ ] Documento buscado
- [ ] Certificados carregados
- [ ] Certificado selecionado
- [ ] PIN digitado corretamente
- [ ] Assinatura confirmada

### **Após Assinatura:**
- [ ] Mensagem de sucesso aparece
- [ ] Informações da assinatura exibidas
- [ ] PDF gerado com assinatura
- [ ] Documento pode ser baixado

---

## 📞 SUPORTE

### **Problemas Técnicos:**
- Consultar: `GUIA-INSTALACAO-CERTIFICADO-A3-REAL.md`

### **Problemas com Token:**
- Contatar a AC (Autoridade Certificadora)
- Serasa, Certisign, Soluti, etc.

### **Token Bloqueado:**
- Solicitar PUK à AC
- Processo pode levar 24-48h

---

**Sistema Palográfico - Certificado A3 Real** 🔐✅

**Pronto para assinar documentos com validade legal!** 📄🎉
