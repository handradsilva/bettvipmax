# Notificação Pushcut a cada depósito confirmado

## Mudanças

1. **Adicionar segredo** `PUSHCUT_WEBHOOK_URL` = `https://api.pushcut.io/y4E0mGDl6y0B2KCvVdncD/notifications/Purschase`

2. **Editar `supabase/functions/bspay-webhook/index.ts`**: após atualizar a transação para `completed`, se `type === 'deposit'`, fazer POST para o webhook Pushcut com título, valor e referência. Envolvido em try/catch para não quebrar o fluxo se o Pushcut falhar.

## Resultado
Cada depósito PIX confirmado dispara automaticamente uma notificação Pushcut no seu celular.