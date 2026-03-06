

## Adicionar validação de valor mínimo no backend

### O que acontece hoje
- **Frontend** (`Deposit.tsx`): valida `amount < 20` e bloqueia — funciona OK
- **Backend** (`generate-pix/index.ts`): só valida `amount <= 0` — aceita qualquer valor positivo

### Risco
Alguém com conhecimento técnico pode chamar a função diretamente (sem usar o site) e gerar um PIX de R$ 1,00, por exemplo.

### Correção
Uma única linha no arquivo `supabase/functions/generate-pix/index.ts`:

Trocar:
```typescript
if (!amount || amount <= 0)
```
Por:
```typescript
if (!amount || amount < 20)
```

E atualizar a mensagem de erro para "Valor mínimo de R$ 20,00".

