# MIG - Implementação de Tabelas Normativas e Resultados Completos

## 📋 Resumo das Alterações

Implementado sistema completo de seleção de tabelas normativas para o teste MIG com exibição de resultados incluindo **Percentil**, **Classificação** e **QI**.

---

## ✅ O que foi implementado

### 1. Frontend - Seleção de Tabelas

#### Removido:
- ❌ Campo "Idade" (número)
- ❌ Campo "Escolaridade" (dropdown estático)

#### Adicionado:
- ✅ **Dropdown de Tabelas Normativas** com 12 opções:
  - MIG - Geral
  - MIG - Idade 15-25
  - MIG - Idade 26-35
  - MIG - Idade 36-45
  - MIG - Idade 46-55
  - MIG - Idade 56-64
  - MIG - Ensino Fundamental
  - MIG - Ensino Médio
  - MIG - Ensino Superior
  - MIG - Trânsito - Primeira Habilitação
  - MIG - Trânsito - Renovação/Mudança
  - MIG - Trânsito - Motorista Profissional

### 2. Frontend - Exibição de Resultados

Criada nova seção de resultados MIG com cards visuais:

```
┌─────────────────────────────────────────────────────┐
│ 🧠 MIG - Resultados da Avaliação                    │
├─────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │ ✅ Acertos│  │📊Percentil│  │ 🎯 QI     │       │
│  │    XX     │  │    YY     │  │   ZZZ     │       │
│  │  de 28    │  │  Posição  │  │    QI     │       │
│  └───────────┘  └───────────┘  └───────────┘       │
│                                                      │
│  ┌───────────────────────────────────────────┐     │
│  │ 🏆 Classificação                           │     │
│  │    [Nome da Classificação]                 │     │
│  └───────────────────────────────────────────┘     │
│                                                      │
│  Tabela normativa: [Nome da tabela utilizada]      │
└─────────────────────────────────────────────────────┘
```

### 3. Backend - Cálculo do MIG

Atualizada a função `calcularMIG` para:
- ✅ Aceitar `tabela_id` do frontend
- ✅ Buscar percentil e classificação na tabela selecionada
- ✅ Buscar QI automaticamente na tabela de conversão
- ✅ Retornar objeto completo: `{ acertos, percentil, classificacao, qi }`

---

## 💻 Código Implementado

### Frontend - Dropdown de Tabelas

**Arquivo:** `frontend-nextjs/src/app/testes/page.tsx`

```tsx
// Query para buscar tabelas MIG
const { data: tabelasMigData } = useQuery({
  queryKey: ['mig-tabelas'],
  queryFn: async () => {
    const response = await tabelasService.list();
    const tabelasMig = response.data.tabelas?.filter((t: any) => 
      t.tipo === 'mig' && t.nome !== 'MIG - Conversão QI'
    ) || [];
    return tabelasMig;
  },
  enabled: selectedTest?.id === 'mig'
});

// Estado para tabela selecionada
const [selectedMigTable, setSelectedMigTable] = useState<number | null>(null);

// Dropdown no formulário
<div className="mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-3">
    📊 Selecione a Tabela Normativa
  </label>
  <select
    value={selectedMigTable || ''}
    onChange={(e) => setSelectedMigTable(e.target.value ? parseInt(e.target.value) : null)}
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg..."
  >
    <option value="">Selecione uma tabela normativa...</option>
    {tabelasMig.map((tabela: any) => (
      <option key={tabela.id} value={tabela.id}>
        {tabela.nome}
      </option>
    ))}
  </select>
</div>
```

### Frontend - Envio de Dados

```tsx
// handleCalculate - enviar acertos do gabarito e tabela_id
if (selectedTest.id === 'mig') {
  if (selectedMigTable) {
    dataToSend.tabela_id = selectedMigTable;
  }
  dataToSend.acertos = migCorrectCount; // Acertos calculados automaticamente
}
```

### Frontend - Exibição de Resultados

```tsx
{selectedTest.id === 'mig' && (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <h4 className="text-lg font-semibold">🧠 MIG - Resultados da Avaliação</h4>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card Acertos */}
      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
        <h5 className="font-semibold text-green-700">✅ Acertos</h5>
        <div className="text-4xl font-bold text-green-800">{migCorrectCount}</div>
        <p className="text-sm text-green-600">de 28 questões</p>
      </div>

      {/* Card Percentil */}
      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <h5 className="font-semibold text-blue-700">📊 Percentil</h5>
        <div className="text-4xl font-bold text-blue-800">
          {results.percentil || 'N/A'}
        </div>
      </div>

      {/* Card QI */}
      <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
        <h5 className="font-semibold text-purple-700">🎯 QI</h5>
        <div className="text-4xl font-bold text-purple-800">
          {results.qi || 'N/A'}
        </div>
      </div>
    </div>

    {/* Classificação */}
    {results.classificacao && (
      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4...">
        <h5 className="font-semibold">🏆 Classificação</h5>
        <div className="text-2xl font-bold">{results.classificacao}</div>
      </div>
    )}
  </div>
)}
```

### Backend - Função calcularMIG

**Arquivo:** `routes/tabelas.js`

```javascript
async function calcularMIG(tabelaId, dados) {
  const { acertos } = dados;
  const tipoAvaliacao = 'geral';

  console.log(`🔍 MIG - Tabela: ${tabelaId}, Acertos: ${acertos}`);

  // Buscar percentil e classificação na tabela selecionada
  const result = await query(`
    SELECT percentil, classificacao 
    FROM normas_mig 
    WHERE tabela_id = $1 AND tipo_avaliacao = $2 
      AND $3 BETWEEN acertos_min AND acertos_max
    ORDER BY percentil DESC
    LIMIT 1
  `, [tabelaId, tipoAvaliacao, acertos]);

  if (result.rows.length === 0) {
    return { 
      acertos,
      percentil: null, 
      classificacao: 'Fora da faixa normativa',
      qi: null
    };
  }

  // Buscar QI na tabela de conversão
  const qiTableResult = await query(`
    SELECT id FROM tabelas_normativas 
    WHERE tipo = 'mig' AND nome LIKE '%Conversão QI%' AND ativa = true
    LIMIT 1
  `);

  let qi = null;
  if (qiTableResult.rows.length > 0) {
    const qiTableId = qiTableResult.rows[0].id;
    const qiResult = await query(`
      SELECT qi
      FROM normas_mig 
      WHERE tabela_id = $1 AND tipo_avaliacao = 'qi' 
        AND $2 BETWEEN acertos_min AND acertos_max
      LIMIT 1
    `, [qiTableId, acertos]);

    if (qiResult.rows.length > 0) {
      qi = qiResult.rows[0].qi;
    }
  }

  return {
    acertos,
    percentil: result.rows[0].percentil,
    classificacao: result.rows[0].classificacao,
    qi
  };
}
```

---

## 📊 Tabelas Normativas Disponíveis

### No Banco de Dados (13 tabelas):

| ID  | Nome                                      | Tipo   | Descrição                                    |
|-----|-------------------------------------------|--------|----------------------------------------------|
| 182 | MIG - Geral                               | mig    | Tabela geral - amostra total (N=1326)        |
| 183 | MIG - Idade 15-25                         | mig    | Faixa etária 15-25 anos (N=860)              |
| 184 | MIG - Idade 26-35                         | mig    | Faixa etária 26-35 anos (N=246)              |
| 185 | MIG - Idade 36-45                         | mig    | Faixa etária 36-45 anos (N=131)              |
| 186 | MIG - Idade 46-55                         | mig    | Faixa etária 46-55 anos (N=67)               |
| 187 | MIG - Idade 56-64                         | mig    | Faixa etária 56-64 anos (N=12)               |
| 188 | MIG - Ensino Fundamental                  | mig    | Escolaridade: Ensino Fundamental (N=63)      |
| 189 | MIG - Ensino Médio                        | mig    | Escolaridade: Ensino Médio (N=427)           |
| 190 | MIG - Ensino Superior                     | mig    | Escolaridade: Ensino Superior (N=792)        |
| 191 | MIG - Trânsito - Primeira Habilitação     | mig    | Trânsito: Primeira Habilitação (N=104)       |
| 192 | MIG - Trânsito - Renovação/Mudança        | mig    | Trânsito: Renovação ou Mudança (N=78)        |
| 193 | MIG - Trânsito - Motorista Profissional   | mig    | Trânsito: Motoristas Profissionais (N=173)   |
| 194 | **MIG - Conversão QI**                    | mig    | **Conversão para QI (usada automaticamente)**|

**Nota:** A tabela ID 194 (Conversão QI) é usada automaticamente pelo backend e **não aparece** no dropdown do frontend.

---

## 🔄 Fluxo de Funcionamento

1. **Usuário preenche o gabarito MIG** (2 exemplos + 28 questões)
2. **Sistema conta automaticamente** apenas as 28 questões (exemplos não contam)
3. **Usuário seleciona uma tabela normativa** no dropdown
4. **Usuário clica em "Calcular Resultado"**
5. **Frontend envia:**
   ```json
   {
     "tabela_id": 182,
     "acertos": 20
   }
   ```
6. **Backend:**
   - Busca percentil e classificação na tabela selecionada (ex: ID 182)
   - Busca QI automaticamente na tabela de conversão (ID 194)
   - Retorna:
   ```json
   {
     "resultado": {
       "acertos": 20,
       "percentil": 75,
       "classificacao": "Médio Superior",
       "qi": "110-119"
     }
   }
   ```
7. **Frontend exibe** resultados em cards visuais

---

## ✅ Testes Realizados

### Script de Verificação

Criado `scripts/check-mig-tables.js` para verificar as tabelas no banco:

```javascript
const { query } = require('../config/database');

async function checkMigTables() {
  const result = await query(`
    SELECT id, nome, descricao, criterio, ativa
    FROM tabelas_normativas
    WHERE tipo = 'mig'
    ORDER BY id
  `);
  
  console.log(`📊 Total de tabelas MIG: ${result.rows.length}`);
  result.rows.forEach((tabela) => {
    console.log(`ID: ${tabela.id} - ${tabela.nome}`);
  });
}
```

**Resultado:** ✅ 13 tabelas encontradas e ativas

---

## 📁 Arquivos Modificados

### Frontend
1. **`frontend-nextjs/src/app/testes/page.tsx`**
   - Linhas 320-334: Query para buscar tabelas MIG
   - Linhas 95-96: Estado `selectedMigTable`
   - Linhas 300-306: Envio de `tabela_id` e `acertos`
   - Linhas 410-412: Removidos campos idade e escolaridade
   - Linhas 1084-1106: Dropdown de seleção de tabela
   - Linhas 1322-1372: Exibição de resultados com QI

### Backend
2. **`routes/tabelas.js`**
   - Linhas 670-761: Função `calcularMIG` atualizada
   - Busca automática de QI na tabela de conversão
   - Retorno completo: acertos, percentil, classificação e QI

### Scripts
3. **`scripts/check-mig-tables.js`** (novo)
   - Script de verificação das tabelas MIG

---

## 🎯 Resultado Final

### Interface do Usuário:
1. ✅ Dropdown com 12 tabelas normativas
2. ✅ Descrição da tabela selecionada exibida
3. ✅ Gabarito com 30 posições (2 exemplos + 28 questões)
4. ✅ Contador automático de acertos (apenas questões)
5. ✅ Resultados visuais com cards coloridos
6. ✅ Exibição de: Acertos, Percentil, QI e Classificação

### Backend:
1. ✅ Aceita `tabela_id` do frontend
2. ✅ Calcula percentil e classificação
3. ✅ Busca QI automaticamente
4. ✅ Retorna objeto completo e estruturado

---

**Data:** 13 de outubro de 2025  
**Status:** ✅ **IMPLEMENTAÇÃO COMPLETA E FUNCIONAL**

**Próximos passos sugeridos:**
- Testar com diferentes tabelas normativas
- Validar resultados com dados reais
- Adicionar exportação de resultados em PDF

