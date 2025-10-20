# 🧠 MEMORE - Guia Rápido de Uso

## ✅ Status dos Servidores

Os servidores foram reiniciados e estão funcionando:

- **Backend**: http://localhost:3001 ✅
- **Frontend**: http://localhost:3000 ✅
- **Página de Testes**: http://localhost:3000/testes ✅

## 📝 Como Usar o MEMORE

### Passo 1: Acessar a Página
Abra o navegador em: **http://localhost:3000/testes**

### Passo 2: Selecionar o Teste
Clique no card **"Memore - Memória"** 🧠

### Passo 3: Escolher a Tabela Normativa ⚠️ IMPORTANTE
No dropdown **"Tabela Normativa"** (destaque azul), selecione:

- **MEMORE - Trânsito - Escolaridade**: Para avaliações de CNH
- **MEMORE - Geral**: Para avaliações gerais (uso geral)
- **MEMORE - Escolaridade - Fundamental/Médio/Superior**: Se souber a escolaridade específica
- **MEMORE - Idade - [faixa]**: Se souber a idade específica do paciente

### Passo 4: Marcar o Crivo de Correção
- Marque os itens que o paciente **MARCOU** no teste
- O sistema calcula automaticamente:
  - **VP** (Verdadeiros Positivos)
  - **VN** (Verdadeiros Negativos)
  - **FN** (Falsos Negativos)
  - **FP** (Falsos Positivos)
  - **EB** (Escore Bruto = VP + VN - FN - FP)

### Passo 5: Calcular Resultado
Clique no botão **"Calcular Resultado"**

### Passo 6: Ver Resultados
O sistema exibirá:
- ✅ **Resultado Final (EB)**
- ✅ **Percentil**
- ✅ **Classificação** (Inferior, Médio, Médio superior, Superior)

## ⚠️ Observações Importantes

### Sobre a Tabela Normativa
**É OBRIGATÓRIO selecionar uma tabela antes de calcular!**

Se não selecionar, o sistema usará a primeira tabela disponível (Trânsito), que pode não ser apropriada para o seu caso.

### Quando Usar Cada Tabela

| Tabela | Quando Usar |
|--------|-------------|
| **Trânsito** | Avaliação psicológica para CNH |
| **Geral** | Quando não há dados específicos de idade ou escolaridade |
| **Escolaridade - Fundamental** | Paciente com Ensino Fundamental |
| **Escolaridade - Médio** | Paciente com Ensino Médio |
| **Escolaridade - Superior** | Paciente com Ensino Superior |
| **Idade - 14 a 24** | Paciente entre 14 e 24 anos |
| **Idade - 25 a 34** | Paciente entre 25 e 34 anos |
| **Idade - 35 a 44** | Paciente entre 35 e 44 anos |
| **Idade - 45 a 54** | Paciente entre 45 e 54 anos |
| **Idade - 55 a 64** | Paciente entre 55 e 64 anos |

### Classificações Possíveis

Baseado no manual oficial:

- **Superior**: Percentil ≥ 95
- **Médio superior**: Percentil ≥ 80 e < 95
- **Médio**: Percentil ≥ 10 e < 80
- **Inferior**: Percentil < 10

Para **contexto de trânsito** (CNH):
- **Inferior**: Temporariamente restritivo ou não recomendado
- **Médio ou superior**: Apto

## 🔧 Resolução de Problemas

### Erro 500 ao acessar /testes
**Solução**: Reinicie os servidores
```powershell
# Em uma janela PowerShell (backend)
node server.js

# Em outra janela PowerShell (frontend)
cd frontend-nextjs
npm run dev
```

### Percentil aparece como "null"
**Causas possíveis**:
1. ❌ Tabela normativa não foi selecionada
2. ❌ Valor de EB está fora da faixa normativa

**Solução**: Certifique-se de selecionar a tabela normativa apropriada antes de calcular.

### "Fora da faixa normativa"
Isso significa que o resultado (EB) está abaixo ou acima dos valores cobertos pela tabela normativa selecionada. Isso é raro, mas pode acontecer em casos extremos.

## 📊 Exemplo de Uso

**Cenário**: Avaliação de CNH de um candidato

1. Acesse http://localhost:3000/testes
2. Selecione **"Memore - Memória"**
3. Escolha **"MEMORE - Trânsito - Escolaridade"**
4. Marque o crivo conforme o teste do candidato
5. Clique em **"Calcular Resultado"**
6. Resultado exemplo:
   - EB: 16
   - Percentil: 75
   - Classificação: **Médio** → ✅ **APTO**

## 🎯 Status Atual

- ✅ Backend funcionando (porta 3001)
- ✅ Frontend funcionando (porta 3000)
- ✅ Página de testes acessível
- ✅ Seletor de tabelas implementado
- ✅ Cálculo de percentil e classificação funcionando
- ✅ 10 tabelas normativas disponíveis

**Tudo pronto para uso!** 🎉

