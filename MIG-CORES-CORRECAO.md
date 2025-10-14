# MIG - Correção de Cores do Gabarito

## Problema Identificado
Quando o usuário selecionava uma alternativa no gabarito MIG, o botão ficava **cinza** ao invés de mostrar:
- ✅ **Verde** se a resposta estiver correta
- ⚠️ **Laranja/Amarelo** se a resposta estiver incorreta

## Causa do Problema
O gabarito correto do MIG (`migAnswerKey`) estava sendo inicializado como um array vazio:
```typescript
const [migAnswerKey, setMigAnswerKey] = useState<string[]>(Array(QUESTIONS_COUNT).fill(''));
```

Isso fazia com que a função `getChoiceClass` retornasse cinza para todas as seleções, pois não havia gabarito para comparar.

## Solução Implementada

### 1. Gabarito Oficial Definido
Adicionamos o gabarito oficial do MIG como uma constante fixa usando `useMemo`:

```typescript
// Gabarito oficial do MIG (inclui 2 exemplos + 28 questões = 30 posições)
const MIG_ANSWER_KEY = useMemo(() => [
  'C', 'A', // Exemplos 1 e 2
  'A', 'D', 'C', 'A', 'B', 'D', 'A', 'C', 'B', 'A', 'D', 'C', 'B', // Questões 1-13
  'A', 'D', 'A', 'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'A', 'C', 'B', 'D' // Questões 14-28
], []);
```

### 2. Atualização da Função de Cores
Atualizamos `getChoiceClass` para usar `MIG_ANSWER_KEY`:

```typescript
const getChoiceClass = (idx: number, option: string) => {
  const user = migAnswers[idx];
  const key = MIG_ANSWER_KEY[idx]; // Agora usa o gabarito fixo
  const isSelected = user === option;
  if (!isSelected) return 'bg-white text-gray-600 border-gray-300 hover:border-gray-400';
  if (!key) return 'bg-gray-200 text-gray-800 border-gray-400';
  return user === key
    ? 'bg-green-500 text-white border-green-600 shadow-md'      // ✅ Verde se correto
    : 'bg-yellow-400 text-gray-800 border-yellow-500 shadow-md'; // ⚠️ Amarelo se incorreto
};
```

### 3. Atualização do Contador de Acertos
O contador também foi atualizado para usar o gabarito fixo:

```typescript
const migCorrectCount = useMemo(() => {
  return migAnswers.reduce((count, answer, idx) => {
    const key = MIG_ANSWER_KEY[idx];
    return count + (answer && key && answer === key ? 1 : 0);
  }, 0);
}, [migAnswers, MIG_ANSWER_KEY]);
```

### 4. Remoção de Estado Desnecessário
Removemos o estado `migAnswerKey` e suas referências:
- Removido `useState` para `migAnswerKey`
- Removido `setMigAnswerKey` do botão "Limpar"
- Removido `setMigAnswerKey` da função `resetForm`

## Gabarito MIG Completo (30 posições)

| Índice | Item      | Resposta Correta |
|--------|-----------|------------------|
| 0      | Exemplo 1 | C                |
| 1      | Exemplo 2 | A                |
| 2-29   | Q 1-28    | A,D,C,A,B,D,A,C,B,A,D,C,B,A,D,A,C,B,A,D,C,B,A,D,A,C,B,D |

## Resultado Final

Agora quando o usuário seleciona uma alternativa no gabarito MIG:
- ✅ **Fica VERDE** se for a resposta correta
- ⚠️ **Fica AMARELO** se for incorreta
- ⚪ **Fica BRANCO** se não estiver selecionada
- Com **sombra (shadow-md)** quando selecionada para dar destaque visual

## Arquivos Modificados
- `frontend-nextjs/src/app/testes/page.tsx`
  - Adicionado `MIG_ANSWER_KEY` (linhas 57-65)
  - Atualizado `migCorrectCount` (linha 145)
  - Atualizado `getChoiceClass` (linha 152)
  - Removido `setMigAnswerKey` (linhas 191, 1231)

---
**Data:** 13 de outubro de 2025
**Status:** ✅ Concluído

