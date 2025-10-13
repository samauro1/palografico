# Configuração e Uso do MEMORE

## Problema Resolvido

O teste MEMORE não estava retornando classificação e percentil. Isso foi corrigido com a implementação completa das tabelas normativas oficiais.

## Solução Implementada

### 1. Tabelas Normativas Criadas

Foram implementadas **10 tabelas normativas oficiais** do MEMORE:

#### Tabela Geral (ID: 120)
- Amostra total (n=1.444)
- Média: 11, DP: 6,26
- Uso: Para avaliações gerais

#### Tabela Trânsito (ID: 116)  
- Contexto de avaliação para trânsito
- Média: 10,42, DP: 6,07
- Uso: Avaliações psicológicas para CNH

#### Tabelas por Escolaridade (Tabela 8)
- **Fundamental** (ID: 121) - Média: 5,60, DP: 5,75, n=60
- **Médio** (ID: 122) - Média: 10,95, DP: 6,37, n=501
- **Superior** (ID: 123) - Média: 11,38, DP: 6,07, n=883

#### Tabelas por Faixa Etária (Tabela 9)
- **14-24 anos** (ID: 124) - Média: 12,11, DP: 5,71, n=822
- **25-34 anos** (ID: 125) - Média: 11,85, DP: 6,59, n=314
- **35-44 anos** (ID: 126) - Média: 7,60, DP: 5,85, n=188
- **45-54 anos** (ID: 127) - Média: 6,12, DP: 5,30, n=93
- **55-64 anos** (ID: 128) - Média: 6,12, DP: 5,73, n=17

### 2. Como Usar

#### Primeira Vez - Popular as Tabelas

```bash
# Executar o script de seed oficial (APENAS UMA VEZ)
node scripts/seed-memore-official.js
```

Este comando irá:
- Criar todas as 10 tabelas normativas
- Popular com 33 normas cada (de EB -8 até +24)
- Total de ~330 normas criadas

#### Testar o Cálculo

```bash
# Testar se está funcionando corretamente
node scripts/test-memore-calculation.js
```

### 3. Fórmula de Cálculo

O escore bruto (EB) do MEMORE é calculado como:

```
EB = VP + VN - FN - FP
```

Onde:
- **VP** (Verdadeiros Positivos): Imagens antigas reconhecidas corretamente
- **VN** (Verdadeiros Negativos): Imagens novas identificadas corretamente
- **FN** (Falsos Negativos): Imagens antigas não reconhecidas (erros)
- **FP** (Falsos Positivos): Imagens novas identificadas como antigas (erros)

### 4. Classificações Baseadas no Percentil

| Percentil | Classificação     |
|-----------|-------------------|
| ≥ 95      | Superior          |
| 80-94     | Médio superior    |
| 30-79     | Médio             |
| 10-29     | Médio inferior    |
| < 10      | Inferior          |

### 5. Exemplos de Resultados

**Exemplo 1: Desempenho Médio**
- VP=18, VN=6, FN=6, FP=6
- EB = 18 + 6 - 6 - 6 = **12**
- Percentil: **60**
- Classificação: **Médio**

**Exemplo 2: Desempenho Superior**
- VP=20, VN=10, FN=5, FP=5
- EB = 20 + 10 - 5 - 5 = **20**
- Percentil: **90**
- Classificação: **Médio superior**

**Exemplo 3: Desempenho Inferior**
- VP=12, VN=0, FN=6, FP=6
- EB = 12 + 0 - 6 - 6 = **0**
- Percentil: **5**
- Classificação: **Inferior**

### 6. Uso na Interface Web

Ao calcular o MEMORE na página de testes:

1. Selecione a tabela normativa adequada:
   - **Geral**: Para avaliações gerais
   - **Trânsito**: Para avaliações de CNH
   - **Por Escolaridade**: Se relevante para o contexto
   - **Por Idade**: Se quiser resultados específicos por faixa etária

2. Preencha os valores:
   - VP (0-24)
   - VN (0-24)
   - FN (0-24)
   - FP (0-24)

3. O sistema calculará automaticamente:
   - Escore Bruto (EB)
   - Percentil
   - Classificação

### 7. Verificar Tabelas no Banco

```bash
# Listar todas as tabelas MEMORE
node -e "const { query } = require('./config/database'); query('SELECT id, nome FROM tabelas_normativas WHERE tipo = \\'memore\\' ORDER BY id').then(r => console.table(r.rows)).finally(() => process.exit())"

# Contar normas por tabela
node -e "const { query } = require('./config/database'); query('SELECT tabela_id, COUNT(*) as total FROM normas_memore GROUP BY tabela_id ORDER BY tabela_id').then(r => console.table(r.rows)).finally(() => process.exit())"
```

## Troubleshooting

### Se o cálculo não retornar percentil/classificação:

1. Verifique se as tabelas foram populadas:
   ```bash
   node scripts/seed-memore-official.js
   ```

2. Teste o cálculo:
   ```bash
   node scripts/test-memore-calculation.js
   ```

3. Verifique os logs do servidor para ver qual tabela está sendo usada

### Se precisar recriar as tabelas:

O script `seed-memore-official.js` pode ser executado novamente. Ele irá:
- Limpar normas antigas das tabelas existentes
- Repovoar com as normas oficiais corretas

## Referências

As tabelas normativas foram implementadas baseadas nos dados oficiais do Manual do MEMORE:
- Tabela 7: Trânsito (Escolaridade)
- Tabela 8: Escolaridade (Fundamental, Médio, Superior)
- Tabela 9: Faixa Etária (5 grupos)
- Tabela 10: Geral (Amostra total)

