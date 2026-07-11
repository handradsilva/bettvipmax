## Problema

Os 6 leads aparecem como "✓ enviado" na tabela `whatsapp_campaigns` porque o Z-API aceitou o request, mas o WhatsApp da instância caiu à 01h10 e as mensagens nunca saíram de fato. Como o cron pula quem já está registrado como enviado, ele não vai reenviar sozinho.

## Solução

**Passo único, manual e pontual** (não muda nenhuma lógica do sistema):

1. Identificar os 6 e-mails afetados na tabela `whatsapp_campaigns`:
   - joaciextreme@gmail.com
   - ezequielvieira2712@gmail.com
   - yago29072001@gmail.com
   - adrieleckert22@gmail.com
   - luiz.talcantara@gmail.com
   - netoroosevelt91@gmail.com

2. **Apagar apenas o registro `sem_deposito_1h` desses 6 usuários** em `whatsapp_campaigns`. Isso os torna elegíveis de novo (o cron/manual verifica `already_messaged` por essa tabela).

3. **Também apagar os `short_links` gerados anteriormente para eles nessa campanha**, pra que o disparo crie links novos e limpos (evita link "queimado" que nunca foi clicado).

4. **Chamar a Edge Function `send-remarketing-whatsapp` em modo manual** (`{ "manual": true }`), que vai buscar os elegíveis e enviar imagem + texto para os 6 (mais qualquer outro que já esteja no critério de 4h sem depósito).

## Verificação

- Confirmar no retorno da função: `sent` deve ser ≥ 6.
- Checar `whatsapp_campaigns` para ver os 6 com novo `sent_at` de agora.
- Se o teu WhatsApp cair de novo no meio, o CallMeBot já te avisa.

## Nada muda no código

- Sem migração, sem edit de função, sem alteração de UI.
- Apenas 2 comandos SQL de limpeza + 1 chamada à edge function existente.
