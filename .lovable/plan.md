## Objetivo
Remover 4 usuários de teste e 2 depósitos falsos de R$ 1.010,00 do banco de dados.

## Ações

1. **Excluir depósitos falsos** (`transactions`)
   - Deletar os 2 depósitos `completed` de R$ 1.010,00 dos usuários `kyros-enum-1783928228@...` e `kyros-webhook-1783926725@...` da madrugada de 13/07/2026.

2. **Excluir os 4 usuários de teste**
   - Emails alvo:
     - kyros-enum-1783928228@test-kyros.invalid
     - kyros-webhook-1783926725@test-kyros.invalid
     - kyros-ref-19307@test-kyros.invalid
     - kyros-test-8015@test-kyros.invalid
   - Limpar dados relacionados: `transactions`, `referrals`, `promo_clicks`, `whatsapp_campaigns`, `user_roles`, `profiles`.
   - Deletar o registro em `auth.users` (cascata elimina o restante que dependa dele).

## Observações
- Ação irreversível — os registros somem permanentemente do painel Admin (Usuários, Depósitos, Dashboard).
- Saldos derivados desses depósitos também serão removidos junto com os perfis.
