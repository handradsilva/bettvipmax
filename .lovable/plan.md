
# Remarketing automático de leads sem depósito

Vou montar um sistema que dispara uma mensagem de WhatsApp automática **1 hora após o cadastro** para todo lead que ainda não fez nenhum depósito, com um **link especial de bônus rastreável** (ex.: `bettvipmax.com/promo/VOLTA200`) que marca o depósito quando o lead voltar.

---

## Parte 1 — WhatsApp automático (1h após cadastro)

### O que preciso de você
Uma conta em uma API de WhatsApp. Recomendo duas opções (você escolhe qual usar):

- **Z-API** (br, simples, ~R$ 99/mês, ilimitado) — precisa do `INSTANCE_ID`, `TOKEN` e `CLIENT_TOKEN`.
- **Evolution API** (open source, self-hosted ou providers como EvolutionAPI Cloud) — precisa do `EVOLUTION_URL`, `INSTANCE_NAME` e `API_KEY`.

Assim que você escolher e me passar as credenciais, guardo como segredo no backend (você não vai colar em código).

### Como vai funcionar
1. **Campo `phone` obrigatório no cadastro** — hoje ele existe no `profiles` mas não é obrigatório. Vou torná-lo obrigatório no formulário de registro (`Auth.tsx`), com máscara BR e validação.
2. **Nova tabela `whatsapp_campaigns`** — registra cada envio (lead, template, status, resposta da API, timestamp) pra você não enviar duas vezes pro mesmo lead.
3. **Edge function `send-remarketing-whatsapp`** — roda a cada 10 minutos via `pg_cron` + `pg_net`. A cada rodada:
   - Busca profiles criados entre 1h e 25h atrás
   - Filtra os que **não têm nenhuma transação `deposit` com status `completed`**
   - Filtra os que **ainda não receberam** a campanha "sem_deposito_1h"
   - Envia WhatsApp com template + link rastreável único
   - Registra em `whatsapp_campaigns`
4. **Template da mensagem** (você pode editar depois no admin):
   > Oi {nome}! 🎰 Vi que você criou sua conta na BetVipMax mas ainda não jogou. Preparei um bônus **exclusivo de 200%** no seu primeiro depósito. Bora ganhar? 👉 https://bettvipmax.com/promo/VOLTA200

### Painel no admin (aba nova "Remarketing")
- Total de leads elegíveis (sem depósito, >1h)
- Total enviados hoje/geral
- Taxa de conversão: enviados → depositaram
- Botão "Disparar agora" (dispara manualmente sem esperar o cron)
- Editor do template da mensagem
- Log dos últimos 50 envios com status (sucesso/erro)

---

## Parte 2 — Link especial de bônus rastreável

### Fluxo
1. Rota nova `/promo/:codigo` (ex.: `/promo/VOLTA200`, `/promo/BLACKFRIDAY`, etc.)
2. Ao acessar:
   - Salva o código em `localStorage` como `promo_code`
   - Se não estiver logado → redireciona pra `/auth?mode=login` (ou register se ainda não tiver conta)
   - Se estiver logado → redireciona pra `/deposit` mostrando banner "Bônus 200% ativo 🎁"
3. Quando o lead depositar, a transação salva o `promo_code` usado.
4. No admin, você vê quantos depósitos vieram de cada código.

### Nova tabela `promo_codes`
Campos: `code`, `bonus_percent` (ex: 200), `active`, `expires_at`, `max_uses`, `used_count`.

### Alterações
- `transactions` ganha coluna `promo_code text`
- `generate-pix` edge function lê o `promo_code` do body e salva na transação
- Admin ganha aba "Códigos Promo" pra criar/pausar códigos e ver conversão de cada um

---

## Parte 3 — Sugestões manuais (sem código)

Vou adicionar no admin um botão **"Exportar leads sem depósito (CSV)"** com nome, telefone, email e data de cadastro. Você usa isso para:

- **Meta Ads (Instagram/Facebook) — Públicos Personalizados**: sobe o CSV como "custom audience" e roda anúncio de remarketing só pra quem cadastrou e não depositou. Depois cria um "lookalike" desses leads pra achar gente parecida.
- **Google Ads — Customer Match**: mesma ideia, sobe a lista e roda YouTube/Search.
- **Disparo manual em massa no WhatsApp**: usando ferramentas como Disparo Pro, WPP Connect, etc.
- **Ligação/SMS pessoal** pros leads de maior valor (se você tiver poucos, vale ligar).
- **Grupo/Canal no Telegram ou WhatsApp** com promoções diárias — coloca o convite no e-mail de boas-vindas e todo lead novo cai lá.

---

## Detalhes técnicos (para referência)

**Novas tabelas** (via migration):
- `whatsapp_campaigns` (id, user_id, campaign_key, status, provider_response, sent_at)
- `promo_codes` (code PK, bonus_percent, active, expires_at, max_uses, used_count, created_at)

**Alteração**:
- `transactions.promo_code text NULL`
- `profiles.phone` — validação no client (não posso tornar NOT NULL sem migrar leads antigos; vou apenas exigir no formulário novo)

**Edge functions novas**:
- `send-remarketing-whatsapp` (cron a cada 10min + endpoint manual)
- Ajuste em `generate-pix` para aceitar `promo_code`

**Cron**: `pg_cron` + `pg_net` chamando a edge function a cada 10 minutos.

**Segredos que vou pedir**: as credenciais da API de WhatsApp que você escolher (Z-API ou Evolution).

**Frontend**:
- `src/pages/Promo.tsx` — nova rota `/promo/:codigo`
- Banner de bônus no `Deposit.tsx` quando houver `promo_code` no localStorage
- `src/components/admin/AdminRemarketing.tsx` — nova aba
- `src/components/admin/AdminPromoCodes.tsx` — nova aba
- Botão "Exportar CSV" em `AdminUsers.tsx`

---

## Ordem de execução
1. Criar tabelas + coluna `promo_code` em `transactions`
2. Rota `/promo/:codigo` + banner no Deposit + ajuste em `generate-pix`
3. Aba "Códigos Promo" no admin
4. Aba "Remarketing" no admin (com editor de template e botão manual)
5. Edge function + cron do WhatsApp (depois que você me passar as credenciais)
6. Botão "Exportar CSV"

Você me confirma qual API de WhatsApp vai usar (Z-API ou Evolution) e eu já começo pela parte 1-4, e faço a parte 5 quando você tiver a conta pronta?
