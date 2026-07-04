## O que já existe hoje

No painel **Remarketing → Configurações do WhatsApp automático** tem o checkbox:

> ☑️ **Envio automático ativado (roda a cada 10 min via cron)**

Esse checkbox **já funciona como pausar/despausar**:
- ☑️ marcado + **Salvar configurações** → cron dispara normalmente
- ☐ desmarcado + **Salvar configurações** → cron para de enviar (fica "pausado"), mas mantém a data de ativação e toda a configuração intacta

O problema é que isso não está óbvio — parece só uma config, não um botão de pausar.

## O que vou mudar

Deixar o controle de pausar/retomar **explícito e visual**, sem mexer em nenhuma lógica do backend (o cron continua olhando o mesmo campo `whatsapp_enabled`).

1. **Card de status no topo do bloco de configurações**, mostrando claramente:
   - 🟢 **Ativo** — "Disparos automáticos rodando a cada 10 min" + botão **⏸ Pausar disparos**
   - 🟠 **Pausado** — "Nenhum lead está recebendo mensagens" + botão **▶ Retomar disparos**

2. Os botões **Pausar / Retomar** salvam a mudança **imediatamente** (um clique só — não precisa clicar em "Salvar configurações" depois).

3. Manter o checkbox atual escondido/removido do formulário (para não confundir com duas formas de fazer a mesma coisa).

4. Deixar claro na tela que **pausar não apaga nada**: a data de ativação, template e leads elegíveis continuam salvos — ao retomar, o próximo cron (até 10 min depois) volta a enviar de onde parou.

## Detalhes técnicos

- Arquivo único: `src/components/admin/AdminRemarketing.tsx`
- Nova função `togglePause()` que chama o mesmo RPC `admin_update_remarketing_settings` já existente, alternando só o `_enabled`
- Nenhuma migration, nenhuma edge function, nenhum secret novo
