

## Card de Funil de Conversão no Admin Dashboard

### Contexto
Atualmente todas as transações de depósito (normais e taxa de R$ 19,90) são armazenadas com `type = "deposit"`. A distinção pode ser feita pelo valor: transações com `amount === 19.90` são taxas de liberação.

### O que será criado
Um novo card no dashboard admin mostrando um funil de conversão com 3 etapas:

1. **Cadastros** — total de usuários registrados (100%)
2. **Depositaram** — usuários que têm pelo menos 1 depósito pago (`status === "completed"`) com valor diferente de 19.90
3. **Pagaram taxa de liberação** — usuários que têm pelo menos 1 depósito pago com valor exatamente 19.90

Cada etapa mostra o número absoluto e a porcentagem em relação ao total de cadastros. Barras de progresso visuais ilustram a proporção.

### Alterações

**Arquivo:** `src/components/admin/AdminDashboard.tsx`

- Adicionar um `useMemo` que calcula:
  - `totalUsers` = quantidade de profiles
  - `usersWhoDeposited` = IDs únicos de transações `completed` com `amount !== 19.90`
  - `usersWhoPaidFee` = IDs únicos de transações `completed` com `amount === 19.90`
  - Percentuais de cada grupo sobre o total

- Renderizar um novo card após os metrics existentes, com:
  - Título "Funil de Conversão"
  - 3 linhas com label, contagem, porcentagem e barra de progresso (`Progress` component)
  - Cores diferenciadas para cada etapa

Nenhuma alteração de banco de dados é necessária — os dados já existem nas transações.

