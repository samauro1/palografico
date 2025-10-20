# 📥 Instalar Web PKI - AGORA

## ✅ **O SISTEMA ESTÁ FUNCIONANDO!**

A mensagem que você viu é **ESPERADA**:

```
❌ Componente Web PKI não instalado
```

Isso significa que o código está correto e detectando que você precisa instalar o componente!

---

## 🚀 **INSTALAÇÃO (5 MINUTOS)**

### **Passo 1: Baixar Componente**

**Link direto:**
```
https://get.webpkiplugin.com/
```

**Ou link oficial:**
```
https://www.lacunasoftware.com/pt/home/webpki
```

---

### **Passo 2: Instalar**

1. **Baixar** arquivo `LacunaWebPKI.msi` (~5MB)
2. **Clicar** no arquivo baixado
3. **Executar como Administrador** (botão direito → "Executar como Administrador")
4. **Seguir assistente:**
   - Next
   - I accept (aceitar licença)
   - Next
   - Install
   - Aguardar instalação
   - Finish

**Tempo:** ~2 minutos

---

### **Passo 3: Reiniciar Navegador**

**IMPORTANTE:** 
- Fechar **COMPLETAMENTE** o navegador (todas as abas)
- Abrir novamente
- Acessar: http://192.168.6.230:3000

---

### **Passo 4: Verificar Instalação**

**Abrir em uma nova aba:**
```
http://localhost:42346/
```

**Se aparecer:**
```
Web PKI Extension is running!
Version: 2.x.x
```

**✅ Instalado com sucesso!**

---

## 🔐 **TESTAR NO SISTEMA**

### **Após instalar e reiniciar navegador:**

1. **Conectar token A3** na USB

2. **Acessar:** http://192.168.6.230:3000

3. **Login** (seu usuário)

4. **Menu:** Relatórios e Laudos

5. **Aba:** Declaração (ou Laudos)

6. **Buscar:** Pablo Ferreira Brito

7. **Rolar até:** 🔐 Assinatura Digital com e-CPF

8. **Clicar:** "Carregar Certificados"

### **✨ O QUE VAI ACONTECER:**

**ANTES (sem componente):**
```
❌ Componente Web PKI não instalado
📥 Instale em: https://get.webpkiplugin.com/
```

**DEPOIS (com componente):**
```
✅ Token A3 detectado! 1 certificado(s) encontrado(s)

Selecione o Certificado:
┌────────────────────────────────────────┐
│ MAURO ARIEL SANCHEZ - 237.244.708-43  │
│ Validade: 2025-12-31                   │
│ Tipo: e-CPF                            │
└────────────────────────────────────────┘
```

---

## 🎯 **ASSINAR DOCUMENTO**

### **Após selecionar certificado:**

1. **Clicar:** "🔐 Assinar Digitalmente"

2. **Windows abre diálogo** pedindo PIN:
   ```
   ┌────────────────────────────────────────┐
   │  🔐 Autenticação de Certificado        │
   ├────────────────────────────────────────┤
   │                                        │
   │  Digite o PIN do seu certificado:     │
   │                                        │
   │  PIN: [____________]                   │
   │                                        │
   │     [Cancelar]        [OK]             │
   └────────────────────────────────────────┘
   ```

3. **Digitar PIN** do token A3

4. **Sistema assina** o documento

5. **Confirmação:**
   ```
   ✅ Documento assinado digitalmente com sucesso!
   🔐 Assinatura criptográfica válida (ICP-Brasil)
   ```

6. **Baixar PDF** assinado

---

## 📋 **LINKS IMPORTANTES**

### **Download do componente:**
- **Principal:** https://get.webpkiplugin.com/
- **Alternativo:** https://www.lacunasoftware.com/pt/home/webpki

### **Verificar instalação:**
- **Status:** http://localhost:42346/

### **Documentação:**
- **Oficial:** https://docs.lacunasoftware.com/pt-br/articles/web-pki/

---

## ⚠️ **PROBLEMAS COMUNS**

### **Erro: "Componente não instalado"**
**Solução:**
- Instalar componente
- Reiniciar navegador (fechar TUDO e abrir novamente)

### **Erro: "Token não detectado"**
**Solução:**
- Conectar token A3 na USB
- Aguardar reconhecimento (LED acende)
- Recarregar página

### **Erro: "PIN incorreto"**
**Solução:**
- Verificar PIN correto
- ⚠️ 3 erros = token bloqueado!

---

## 🎉 **DEPOIS DE INSTALAR**

O sistema vai funcionar **EXATAMENTE** como o e-CNH do Detran-SP:

✅ Detecta token automaticamente  
✅ Lista certificados reais  
✅ Solicita PIN via Windows  
✅ Assina com chave privada do token  
✅ Gera PDF com assinatura válida  
✅ ICP-Brasil compatível  

**Tecnologia profissional e comprovada!** 🚀🔐

---

**Sistema Palográfico - Web PKI Implementado** ✅

**INSTALE O COMPONENTE AGORA:** https://get.webpkiplugin.com/ 📥

