# MIG - Correção da Segunda Coluna (Questões 14-28)

## Problema Identificado
Não era possível selecionar nenhuma resposta na **segunda coluna** do gabarito MIG (questões 14-28). Os botões não respondiam aos cliques.

## Causa do Problema
O array `migAnswers` estava dimensionado incorretamente:

```typescript
const QUESTIONS_COUNT = 28;
const [migAnswers, setMigAnswers] = useState<string[]>(Array(QUESTIONS_COUNT).fill(''));
```

O array tinha apenas **28 posições** (índices 0-27), mas o gabarito MIG precisa de **30 posições**:
- **2 exemplos** (índices 0-1)
- **28 questões** (índices 2-29)

### Mapeamento de Índices

| Item          | Número Exibido | Índice no Array |
|---------------|----------------|-----------------|
| Exemplo 1     | "Exemplo 1"    | 0               |
| Exemplo 2     | "Exemplo 2"    | 1               |
| Questão 1     | 1              | 2               |
| Questão 2     | 2              | 3               |
| ...           | ...            | ...             |
| Questão 13    | 13             | 14              |
| **Questão 14**| **14**         | **15**          |
| **Questão 15**| **15**         | **16**          |
| ...           | ...            | ...             |
| **Questão 28**| **28**         | **29**          |

### O que acontecia?
Quando o usuário tentava clicar na questão 14 (índice 15), o código tentava acessar `migAnswers[15]`, mas o array só ia até o índice 27. Isso causava um erro silencioso e impedia a seleção.

## Solução Implementada

### 1. Aumentar o tamanho do array
Adicionamos uma constante `MIG_TOTAL_POSITIONS` e ajustamos o tamanho do array:

```typescript
const QUESTIONS_COUNT = 28;
const MIG_TOTAL_POSITIONS = 30; // 2 exemplos + 28 questões
const [migAnswers, setMigAnswers] = useState<string[]>(Array(MIG_TOTAL_POSITIONS).fill(''));
```

### 2. Atualizar o botão "Limpar"
```typescript
<button
  onClick={() => {
    setMigAnswers(Array(MIG_TOTAL_POSITIONS).fill('')); // Era Array(28)
  }}
>
  Limpar
</button>
```

### 3. Atualizar a função `resetForm`
```typescript
setMigAnswers(Array(MIG_TOTAL_POSITIONS).fill('')); // Era Array(QUESTIONS_COUNT)
```

## Estrutura Final do Array

O array `migAnswers` agora tem **30 posições**:

```typescript
migAnswers = [
  '',  // [0]  Exemplo 1
  '',  // [1]  Exemplo 2
  '',  // [2]  Questão 1
  '',  // [3]  Questão 2
  // ...
  '',  // [14] Questão 13
  '',  // [15] Questão 14 ✅ AGORA FUNCIONA!
  '',  // [16] Questão 15 ✅ AGORA FUNCIONA!
  // ...
  '',  // [29] Questão 28 ✅ AGORA FUNCIONA!
]
```

## Gabarito Correspondente

O `MIG_ANSWER_KEY` também tem 30 posições e está corretamente alinhado:

```typescript
MIG_ANSWER_KEY = [
  'C', 'A', // Exemplos 1 e 2
  'A', 'D', 'C', 'A', 'B', 'D', 'A', 'C', 'B', 'A', 'D', 'C', 'B', // Q1-13
  'A', 'D', 'A', 'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'A', 'C', 'B', 'D' // Q14-28
]
```

## Resultado Final

Agora é possível:
- ✅ Selecionar respostas em **todas as 28 questões**
- ✅ Selecionar respostas nos **2 exemplos**
- ✅ Ver feedback visual correto (verde/amarelo) para **todas as seleções**
- ✅ Limpar todas as respostas corretamente

## Arquivos Modificados
- `frontend-nextjs/src/app/testes/page.tsx`
  - Linha 55: Adicionado `MIG_TOTAL_POSITIONS = 30`
  - Linha 56: `migAnswers` agora usa `MIG_TOTAL_POSITIONS`
  - Linha 191: `resetForm` usa `MIG_TOTAL_POSITIONS`
  - Linha 1232: Botão "Limpar" usa `MIG_TOTAL_POSITIONS`

---
**Data:** 13 de outubro de 2025
**Status:** ✅ Concluído e Testado

