# 🔐 Guia: Instalação e Configuração para Certificado A3 Real

## ✅ IMPLEMENTAÇÃO REAL DO CERTIFICADO A3

Agora o sistema está preparado para usar certificados digitais **REAIS** do token A3!

---

## 📋 REQUISITOS

### **1. Hardware:**
- ✅ **Token A3** (SafeNet, Gemalto, Watchdata, etc.)
- ✅ **Leitor USB** (CCID compatível)
- ✅ **Porta USB disponível**

### **2. Software:**
- ✅ **Driver do fabricante** do token
- ✅ **Node.js** (já instalado)
- ✅ **Biblioteca pkcs11js** (já instalada)

---

## 🔧 INSTALAÇÃO DO DRIVER

### **Passo 1: Identificar o Fabricante do Token**

Veja a marca gravada no token:
- **SafeNet** (eToken)
- **Gemalto** (IDPrime)
- **Watchdata**
- **Outros**

---

### **Passo 2: Baixar e Instalar o Driver**

#### **SafeNet eToken:**
```
URL: https://support.thalesgroup.com/
Procurar: "SafeNet Authentication Client"
Versão: Mais recente para Windows
```

**Instalação:**
1. Baixar `SAC_Windows_x64.exe`
2. Executar como Administrador
3. Seguir assistente de instalação
4. Reiniciar o computador

**Arquivos instalados:**
- `C:\Program Files\SafeNet\Authentication\SAC\x64\eTPKCS11.dll`
- `C:\Windows\System32\eTPKCS11.dll`

---

#### **Gemalto IDPrime:**
```
URL: https://www.gemalto.com/
Procurar: "IDGo 800 Client"
```

**Instalação:**
1. Baixar instalador
2. Executar como Administrador
3. Seguir assistente
4. Reiniciar

**Arquivos instalados:**
- `C:\Program Files\Gemalto\Classic Client\BIN\gclib.dll`
- `C:\Windows\System32\gclib.dll`

---

#### **Watchdata:**
```
URL: Site do fabricante ou fornecedor do certificado
```

**Arquivos instalados:**
- `C:\Windows\System32\watchdata\Watchdata Brazil CSP v1.0\WDPKCS.dll`

---

### **Passo 3: Verificar Instalação**

#### **No Gerenciador de Dispositivos:**
1. Conectar token A3 na USB
2. Abrir: `devmgmt.msc` (Gerenciador de Dispositivos)
3. Procurar: "Leitores de Cartão Inteligente"
4. Deve aparecer algo como:
   - "SafeNet eToken"
   - "Gemalto USB SmartCard Reader"
   - "Watchdata USB Key"

#### **Verificar DLL:**
```powershell
# Verificar se a DLL existe
Test-Path "C:\Windows\System32\eTPKCS11.dll"
# ou
Test-Path "C:\Program Files\SafeNet\Authentication\SAC\x64\eTPKCS11.dll"
```

---

## 🔍 TESTAR DETECÇÃO DO TOKEN

### **Criar Script de Teste:**

Arquivo: `test-token-a3.js`

```javascript
const certificadoA3Service = require('./utils/certificadoA3Service');

async function testar() {
  try {
    console.log('🧪 TESTANDO DETECÇÃO DO TOKEN A3\n');
    
    // 1. Detectar biblioteca
    const lib = certificadoA3Service.detectarBibliotecaPKCS11();
    if (lib) {
      console.log(`✅ Biblioteca encontrada: ${lib}\n`);
    } else {
      console.log('❌ Biblioteca não encontrada\n');
      console.log('📥 INSTALE O DRIVER:');
      console.log('   SafeNet: https://support.thalesgroup.com/');
      console.log('   Gemalto: https://www.gemalto.com/');
      return;
    }
    
    // 2. Listar certificados
    console.log('📂 Conectando ao token...\n');
    const resultado = await certificadoA3Service.listarCertificados();
    
    if (resultado.success) {
      console.log(`\n✅ ${resultado.certificados.length} certificado(s) encontrado(s):\n`);
      
      resultado.certificados.forEach((cert, idx) => {
        console.log(`${idx + 1}. ${cert.nome}`);
        console.log(`   CPF: ${cert.cpf}`);
        console.log(`   Tipo: ${cert.tipo}`);
        console.log(`   Validade: ${cert.validade}`);
        console.log(`   Emissor: ${cert.emissor}`);
        console.log('');
      });
      
      console.log('✅ TOKEN A3 FUNCIONANDO CORRETAMENTE!');
    } else {
      console.log('❌ Nenhum certificado encontrado');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.log('\n📝 POSSÍVEIS CAUSAS:');
    console.log('   1. Driver não instalado');
    console.log('   2. Token não conectado');
    console.log('   3. Token sem certificado');
    console.log('   4. Permissões insuficientes');
  }
}

testar();
```

### **Executar Teste:**
```powershell
node test-token-a3.js
```

### **Resultados Esperados:**

#### **✅ Sucesso:**
```
✅ Biblioteca encontrada: C:\Windows\System32\eTPKCS11.dll
📂 Conectando ao token...
✅ 1 certificado(s) encontrado(s):

1. MAURO ARIEL SANCHEZ:12345678900
   CPF: 237.244.708-43
   Tipo: e-CPF
   Validade: 2025-12-31
   Emissor: AC Certisign Multipla G5

✅ TOKEN A3 FUNCIONANDO CORRETAMENTE!
```

#### **❌ Erro - Driver não instalado:**
```
❌ Biblioteca não encontrada

📥 INSTALE O DRIVER:
   SafeNet: https://support.thalesgroup.com/
```

#### **❌ Erro - Token não conectado:**
```
❌ ERRO: Token A3 não detectado. Conecte o token na porta USB.
```

---

## 🚀 COMO USAR NO SISTEMA

### **Passo 1: Conectar Token A3**
1. Inserir token na porta USB
2. Aguardar Windows reconhecer (pode pedir driver)
3. LED do token deve acender

### **Passo 2: Acessar Sistema**
```
http://192.168.6.230:3000/relatorios
```

### **Passo 3: Aba Declaração ou Laudo**
1. Buscar documento
2. Rolar até "Assinatura Digital com e-CPF"

### **Passo 4: Carregar Certificados**
1. Clicar: **"Carregar Certificados"**
2. Sistema detecta token automaticamente
3. Lista certificados REAIS do token

### **Passo 5: Selecionar Certificado**
1. Escolher certificado no dropdown
2. Ver informações (nome, CPF, validade)

### **Passo 6: Assinar Digitalmente**
1. Clicar: **"🔐 Assinar Digitalmente"**
2. Sistema pede PIN
3. Digitar PIN do token (4-8 dígitos)
4. Aguardar assinatura
5. Ver confirmação: "✅ Documento Assinado"

---

## ⚠️ POSSÍVEIS ERROS

### **Erro 1: Driver não encontrado**
```
❌ Driver do token A3 não encontrado. 
   Instale o driver do fabricante.
```

**Solução:**
- Instalar driver correto do fabricante
- Reiniciar computador
- Tentar novamente

---

### **Erro 2: Token não detectado**
```
❌ Token A3 não detectado. 
   Conecte o token na porta USB.
```

**Solução:**
- Conectar token na USB
- Aguardar reconhecimento
- Verificar LED do token
- Trocar de porta USB se necessário

---

### **Erro 3: PIN incorreto**
```
❌ PIN incorreto. 
   Verifique o PIN do seu token A3.
```

**Solução:**
- Verificar PIN correto (fornecido pela AC)
- Atenção: 3 tentativas erradas **BLOQUEIA** o token
- Se bloquear, precisa usar PUK para desbloquear

---

### **Erro 4: Certificado não encontrado**
```
❌ Nenhum certificado encontrado no token.
```

**Solução:**
- Verificar se o token contém certificado
- Token pode estar vazio
- Solicitar emissão de certificado na AC

---

## 🔐 SEGURANÇA DO PIN

### **⚠️ IMPORTANTE:**

1. **Tentativas Limitadas:**
   - Geralmente 3 tentativas
   - Após 3 erros: **TOKEN BLOQUEADO**
   - Desbloqueio: Usar código PUK

2. **Proteção do PIN:**
   - Não compartilhar
   - Não anotar em local inseguro
   - Memorizar

3. **Bloqueio:**
   - Se bloquear: Entrar em contato com a AC (Autoridade Certificadora)
   - PUK: Código de desbloqueio (fornecido pela AC)

---

## 📊 BIBLIOTECAS PKCS#11 SUPORTADAS

### **Caminhos Verificados pelo Sistema:**

```javascript
// SafeNet
'C:\\Windows\\System32\\eTPKCS11.dll'
'C:\\Program Files\\SafeNet\\Authentication\\SAC\\x64\\eTPKCS11.dll'

// Gemalto
'C:\\Windows\\System32\\gclib.dll'
'C:\\Program Files\\Gemalto\\Classic Client\\BIN\\gclib.dll'

// Watchdata
'C:\\Windows\\System32\\watchdata\\...\\WDPKCS.dll'

// Outros
'C:\\Windows\\System32\\aetpkss1.dll'
'C:\\Windows\\System32\\ngp11v211.dll'
```

Se o seu token usar outro caminho, adicione em:
`utils/certificadoA3Service.js` (linhas 15-26)

---

## 🎯 DIFERENÇAS: SIMULADO vs REAL

### **ANTES (Simulado):**
- ❌ Certificado hardcoded no código
- ❌ PIN fake (1234 ou 0000)
- ❌ Assinatura não criptográfica
- ❌ Não usa token físico

### **AGORA (Real):**
- ✅ **Lê certificado do token A3 físico**
- ✅ **Valida PIN real do token**
- ✅ **Assinatura criptográfica válida**
- ✅ **Usa chave privada do token**
- ✅ **ICP-Brasil compatível**

---

## 💡 PRÓXIMOS PASSOS

### **1. Instalar Driver:**
- Baixar do site do fabricante
- Instalar como Administrador
- Reiniciar computador

### **2. Conectar Token:**
- Inserir na porta USB
- Verificar reconhecimento

### **3. Testar Detecção:**
```powershell
node test-token-a3.js
```

### **4. Usar no Sistema:**
- Acessar relatórios
- Carregar certificados
- Assinar documentos

---

**Sistema Palográfico - Certificado A3 Real Implementado** 🔐✅

**Agora usa certificados REAIS do token físico!** 🎉📋
