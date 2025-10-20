# 📧📱 Guia: Envio de Declaração por E-mail e WhatsApp

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### **Novos Botões na Aba Declaração:**
- ✅ **📧 Enviar por E-mail** - Abre cliente de e-mail padrão
- ✅ **💬 Enviar por WhatsApp** - Abre WhatsApp Web com mensagem
- ✅ **📥 Baixar PDF** - Gera e baixa PDF da declaração
- ✅ **🖨️ Imprimir** - Imprime declaração diretamente

---

## 🔧 FUNCIONALIDADES IMPLEMENTADAS

### **1️⃣ ENVIAR POR E-MAIL**

#### **Como Funciona:**
1. Verifica se o paciente tem e-mail cadastrado
2. Gera o PDF da declaração automaticamente
3. Abre o cliente de e-mail padrão do sistema
4. Preenche automaticamente:
   - **Destinatário:** E-mail do paciente
   - **Assunto:** "Declaração de Comparecimento - [Nome do Paciente]"
   - **Corpo:** Mensagem formal com saudação

#### **Validações:**
- ✅ Verifica se há declaração carregada
- ✅ Verifica se o paciente possui e-mail cadastrado
- ✅ Mostra mensagem de erro se faltar informação

#### **Exemplo de E-mail:**
```
Para: pablofb1289@gmail.com
Assunto: Declaração de Comparecimento - PABLO FERREIRA BRITO

Prezado(a) PABLO FERREIRA BRITO,

Segue em anexo sua declaração de comparecimento.

Atenciosamente,
[Nome da Clínica]
```

---

### **2️⃣ ENVIAR POR WHATSAPP**

#### **Como Funciona:**
1. Verifica se o paciente tem telefone cadastrado
2. Limpa o número do telefone (remove caracteres especiais)
3. Abre o WhatsApp Web em nova aba
4. Preenche automaticamente uma mensagem formal

#### **Validações:**
- ✅ Verifica se há declaração carregada
- ✅ Verifica se o paciente possui telefone cadastrado
- ✅ Limpa o número (remove parênteses, espaços, hífens)
- ✅ Adiciona código do país (+55 para Brasil)

#### **Exemplo de Mensagem:**
```
Olá PABLO FERREIRA BRITO! 

Sua declaração de comparecimento está pronta.

📅 Data de comparecimento: 01/10/2025

Para baixar o documento, acesse o link que será enviado por e-mail ou solicite ao atendimento.

Atenciosamente,
[Nome da Clínica]
```

#### **Link Gerado:**
```
https://wa.me/5519930162640?text=[mensagem codificada]
```

---

## 🎨 INTERFACE DOS BOTÕES

### **Ordem dos Botões:**
1. **📧 Enviar por E-mail** (Roxo - `bg-purple-600`)
2. **💬 Enviar por WhatsApp** (Verde claro - `bg-green-500`)
3. **📥 Baixar PDF** (Azul - `bg-blue-600`)
4. **🖨️ Imprimir** (Cinza - `bg-gray-600`)

### **Posicionamento:**
- Alinhados à direita
- Espaçamento de 3 unidades entre botões
- Classe `no-print` para não aparecer na impressão
- Acima da seção de assinatura digital

---

## 🧪 TESTE DAS FUNCIONALIDADES

### **1. Teste de Envio por E-mail:**

#### **Passo 1: Acessar Sistema**
```
URL: http://192.168.6.230:3000/relatorios
```

#### **Passo 2: Buscar Declaração**
1. Aba: **📋 Declaração**
2. Buscar: `461.701.378-43` ou `PABLO FERREIRA BRITO`
3. Clicar: **Buscar Paciente**

#### **Passo 3: Enviar por E-mail**
1. Verificar se a declaração foi carregada
2. Clicar: **📧 Enviar por E-mail**
3. Aguardar: Geração automática do PDF
4. Cliente de e-mail abre automaticamente
5. Verificar: Destinatário, assunto e corpo preenchidos
6. Anexar: PDF da declaração (baixado automaticamente)
7. Enviar o e-mail

#### **Validações:**
- ✅ PDF gerado corretamente
- ✅ E-mail do paciente no destinatário
- ✅ Assunto correto
- ✅ Mensagem formal no corpo

---

### **2. Teste de Envio por WhatsApp:**

#### **Passo 1: Acessar Sistema**
```
URL: http://192.168.6.230:3000/relatorios
```

#### **Passo 2: Buscar Declaração**
1. Aba: **📋 Declaração**
2. Buscar: `461.701.378-43` ou `PABLO FERREIRA BRITO`
3. Clicar: **Buscar Paciente**

#### **Passo 3: Enviar por WhatsApp**
1. Verificar se a declaração foi carregada
2. Clicar: **💬 Enviar por WhatsApp**
3. WhatsApp Web abre em nova aba
4. Verificar: Número do paciente no campo "Para"
5. Verificar: Mensagem formatada no campo de texto
6. Editar mensagem se necessário
7. Enviar a mensagem

#### **Validações:**
- ✅ Número do telefone correto (+55...)
- ✅ Mensagem formatada com quebras de linha
- ✅ Nome do paciente na mensagem
- ✅ Data de comparecimento correta
- ✅ Nome da clínica na assinatura

---

## 📋 CENÁRIOS DE ERRO

### **Erro 1: Paciente sem E-mail**
```
❌ Paciente não possui e-mail cadastrado
```
**Solução:** Cadastrar e-mail no perfil do paciente

### **Erro 2: Paciente sem Telefone**
```
❌ Paciente não possui telefone cadastrado
```
**Solução:** Cadastrar telefone no perfil do paciente

### **Erro 3: Nenhuma Declaração Carregada**
```
❌ Nenhuma declaração para enviar
```
**Solução:** Buscar e carregar uma declaração primeiro

### **Erro 4: Erro ao Gerar PDF**
```
❌ Erro ao gerar PDF da declaração
```
**Solução:** Verificar se a declaração está corretamente formatada

---

## 🔍 DETALHES TÉCNICOS

### **Envio por E-mail:**

#### **Função:**
```javascript
const handleEnviarEmailDeclaracao = async () => {
  // Validações
  if (!dadosDeclaracao) { ... }
  if (!email) { ... }
  
  // Gerar PDF
  await handleGerarPDFDeclaracao();
  
  // Preparar link mailto
  const mailtoLink = `mailto:${email}?subject=${assunto}&body=${corpo}`;
  window.open(mailtoLink);
}
```

#### **Formato mailto:**
```
mailto:email@example.com?subject=Assunto&body=Corpo%20da%20mensagem
```

---

### **Envio por WhatsApp:**

#### **Função:**
```javascript
const handleEnviarWhatsAppDeclaracao = () => {
  // Validações
  if (!dadosDeclaracao) { ... }
  if (!telefone) { ... }
  
  // Limpar telefone
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  // Preparar mensagem
  const mensagem = `Olá ${nome}! ...`;
  
  // Abrir WhatsApp Web
  const whatsappLink = `https://wa.me/55${telefoneLimpo}?text=${mensagem}`;
  window.open(whatsappLink, '_blank');
}
```

#### **Formato WhatsApp API:**
```
https://wa.me/[código_país][número]?text=[mensagem_codificada]
```

#### **Limpeza de Telefone:**
```javascript
// Entrada: (19) 93016-2640
// Saída: 19930162640
// Link: https://wa.me/5519930162640
```

---

## 💡 MELHORIAS FUTURAS

### **E-mail:**
- ✅ **Envio direto do servidor** - Sem depender do cliente de e-mail
- ✅ **Template HTML** - E-mails mais bonitos e profissionais
- ✅ **Anexo automático** - PDF anexado automaticamente
- ✅ **Confirmação de envio** - Feedback de sucesso/erro
- ✅ **Log de envios** - Histórico de e-mails enviados

### **WhatsApp:**
- ✅ **API oficial do WhatsApp Business** - Envio programado
- ✅ **Templates aprovados** - Mensagens pré-aprovadas pelo WhatsApp
- ✅ **Anexo de PDF** - Enviar PDF diretamente pelo WhatsApp
- ✅ **Status de leitura** - Saber se a mensagem foi lida
- ✅ **Log de envios** - Histórico de mensagens enviadas

### **Interface:**
- ✅ **Modal de confirmação** - Confirmar antes de enviar
- ✅ **Prévia da mensagem** - Editar mensagem antes de enviar
- ✅ **Múltiplos destinatários** - Enviar para vários contatos
- ✅ **Agendamento** - Programar envio para data/hora específica

---

## 🎯 BENEFÍCIOS

### **Agilidade:**
- ✅ **Envio rápido** - Poucos cliques para enviar
- ✅ **Automação** - Mensagens pré-formatadas
- ✅ **Integração** - Usa apps que o usuário já tem

### **Profissionalismo:**
- ✅ **Mensagens padronizadas** - Sempre formal e correta
- ✅ **Identificação** - Nome da clínica na assinatura
- ✅ **Dados corretos** - Puxa informações do sistema

### **Usabilidade:**
- ✅ **Interface intuitiva** - Botões claros e bem posicionados
- ✅ **Feedback visual** - Toasts informativos
- ✅ **Validações** - Mensagens de erro claras

---

**Sistema Palográfico - Envio de Declaração Implementado** 📧📱✅

**Envie declarações por e-mail e WhatsApp com facilidade!** 🚀
