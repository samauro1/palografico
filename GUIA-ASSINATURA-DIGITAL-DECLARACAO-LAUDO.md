# 🔐 Guia de Assinatura Digital - Declaração e Laudo

## 📋 Sistema de Assinatura Implementado

### **Solução Adotada: Híbrida em 2 Etapas**

---

## ✅ ETAPA 1: Assinatura Visual (Implementada)

### **Como Funciona:**
1. Acesse **Relatórios → Declaração** ou **Relatórios → Laudos**
2. Busque o paciente
3. Clique em **"Adicionar Assinatura"**
4. Selecione uma imagem da sua assinatura (PNG, JPG)
5. A assinatura aparece no documento
6. Clique em **"Imprimir Declaração"** ou **Ctrl+P**
7. Salve como PDF

### **Resultado:**
- ✅ PDF com assinatura visual
- ✅ Pronto para impressão
- ✅ Apresentação profissional

---

## 🔐 ETAPA 2: Assinatura Digital com Certificado A3

### **Por que Assinatura Digital?**
- 🔒 Validade jurídica
- ✅ Conformidade com ICP-Brasil
- 🛡️ Integridade do documento
- 📜 Rastreabilidade

---

## 🖊️ Como Assinar Digitalmente (Certificado A3)

### **Opção 1: Adobe Acrobat Reader (RECOMENDADO)**

#### **Pré-requisitos:**
- Adobe Acrobat Reader (gratuito)
- Certificado A3 instalado (token USB ou Smart Card)
- Leitor de cartão (se usar Smart Card)

#### **Passo a Passo:**

**1. Gere o PDF no sistema:**
   - Acesse a declaração/laudo
   - Adicione assinatura visual
   - Salve como PDF (Ctrl+P → Salvar como PDF)

**2. Abra no Adobe Reader:**
   - Abra o PDF salvo
   - Vá em: **Ferramentas → Certificados → Assinar digitalmente**

**3. Selecione a área de assinatura:**
   - Desenhe um retângulo onde quer a assinatura digital
   - (Pode ser sobre a assinatura visual já existente)

**4. Configure a assinatura:**
   - Selecione seu certificado A3
   - Configure a aparência:
     - Nome: Seu nome
     - Motivo: "Assinatura de Declaração/Laudo"
     - Local: "São Paulo, SP"

**5. Assine:**
   - Clique em **"Assinar"**
   - O leitor solicitará o PIN do certificado
   - Digite o PIN
   - Escolha onde salvar o PDF assinado

**6. Resultado:**
   - ✅ PDF com assinatura digital válida
   - ✅ Ícone de certificado aparece no documento
   - ✅ Validade jurídica garantida

---

### **Opção 2: Assinador.app (GOV.BR)**

#### **Vantagens:**
- ✅ 100% Gratuito
- ✅ Oficial do Governo
- ✅ Compatível com ICP-Brasil

#### **Passo a Passo:**

**1. Baixe o Assinador.app:**
   - Acesse: https://www.gov.br/governodigital/pt-br/assinatura-eletronica/assinador-gov-br
   - Baixe para Windows/Mac/Linux
   - Instale

**2. Gere o PDF:**
   - No sistema, gere a declaração/laudo
   - Salve como PDF

**3. Assine no Assinador.app:**
   - Abra o Assinador.app
   - Clique em **"Assinar documento"**
   - Selecione o PDF
   - Conecte seu certificado A3
   - Escolha o certificado
   - Digite o PIN
   - Salve o PDF assinado

**4. Resultado:**
   - ✅ PDF assinado com padrão GOV.BR
   - ✅ Validade jurídica garantida

---

### **Opção 3: Assinatura no Próprio Leitor**

Alguns leitores de Smart Card vêm com software de assinatura:

- **SafeNet Authentication Client**
- **Gemalto Token Admin**
- **eToken PKI Client**

Consulte o manual do seu leitor/token.

---

## 📤 Upload de PDFs Assinados (Opcional)

### **Funcionalidade em Desenvolvimento:**

Futuramente, o sistema permitirá:
1. Fazer upload do PDF assinado de volta ao sistema
2. Validar automaticamente a assinatura digital
3. Armazenar com registro de quem assinou e quando
4. Consultar documentos assinados no histórico

---

## ❓ Perguntas Frequentes

### **1. A assinatura visual tem validade jurídica?**
Não. A assinatura visual é apenas para apresentação. Para validade jurídica, use assinatura digital com certificado A3.

### **2. Preciso pagar pelo Adobe Reader?**
Não. O Adobe Acrobat **Reader** é gratuito e permite assinar com certificado A3.

### **3. O Assinador.app é seguro?**
Sim. É desenvolvido e mantido pelo Governo Federal.

### **4. Posso usar certificado A1?**
Sim. Certificados A1 também funcionam, mas têm menor segurança que A3.

### **5. Como verifico se o PDF está assinado?**
Abra no Adobe Reader. Se estiver assinado, aparecerá um ícone de certificado e a mensagem "Assinado e todas as assinaturas são válidas".

---

## 🔧 Suporte Técnico

### **Problemas Comuns:**

**"Não encontro meu certificado"**
- Verifique se o token/cartão está conectado
- Reinstale os drivers do leitor
- Teste em outro software (e-CAC, e-CPF)

**"PIN incorreto"**
- Seu token pode estar bloqueado após 3 tentativas erradas
- Contate a Autoridade Certificadora para desbloquear

**"Assinatura inválida"**
- Certificado pode estar vencido
- Renove seu certificado A3

---

## 📚 Links Úteis

- **Adobe Reader:** https://get.adobe.com/br/reader/
- **Assinador GOV.BR:** https://www.gov.br/governodigital/pt-br/assinatura-eletronica
- **ICP-Brasil:** https://www.gov.br/iti/pt-br/assuntos/icp-brasil
- **Lista de Autoridades Certificadoras:** https://www.gov.br/iti/pt-br/assuntos/icp-brasil/autoridades-certificadoras

---

## 📝 Observações Importantes

1. **Guarde seu PIN em local seguro** - Você precisará dele toda vez que assinar
2. **Backup do certificado** - Se usar A1, faça backup. A3 não permite cópia
3. **Validade** - Certificados A3 são válidos por 1-5 anos
4. **Renovação** - Renove antes de vencer para evitar problemas
5. **Segurança** - Nunca compartilhe seu certificado ou PIN

---

## ✅ Resumo

### **Fluxo Completo:**

```
1. Sistema Web → Gera declaração/laudo
2. Adiciona assinatura visual → Para apresentação
3. Salva como PDF → Documento base
4. Adobe Reader / Assinador.app → Assinatura digital
5. Certificado A3 → Validade jurídica
6. PDF Assinado → Documento final válido
```

### **Custo Total: R$ 0,00**

Todas as ferramentas são gratuitas. Você só precisa do certificado A3 que já possui.

---

**Sistema Palográfico - Assinatura Digital Profissional** 🔐✅

