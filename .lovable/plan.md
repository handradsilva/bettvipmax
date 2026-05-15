## Objetivo

Permitir que o campo de busca em **Admin → Usuários** filtre também pelo **nome completo** do lead, além de e-mail e CPF.

## Alterações

**`src/components/admin/AdminUsers.tsx`**
- No filtro `useMemo`, adicionar match contra `p.full_name` (case-insensitive, ignorando acentos opcionalmente).
- Atualizar o `placeholder` do input para: `"Buscar por nome, e-mail ou CPF..."`.

Lógica do filtro:
```ts
const nameMatch = (p.full_name || "").toLowerCase().includes(q);
return emailMatch || cpfMatch || nameMatch;
```

Nada mais é alterado — backend, colunas da tabela e demais filtros permanecem iguais.