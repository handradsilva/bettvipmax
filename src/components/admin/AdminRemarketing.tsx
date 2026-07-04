import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Download, RefreshCw } from "lucide-react";
import { parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import AdminDateFilter from "./AdminDateFilter";

interface Lead {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  already_messaged: boolean;
}

interface Settings {
  whatsapp_enabled: boolean;
  whatsapp_template: string;
  delay_hours: number;
  provider: string;
  activation_date: string | null;
}

interface Funnel {
  total_no_deposit: number;
  messaged: number;
  clicked: number;
  clicked_and_deposited: number;
}

const AdminRemarketing = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [settings, setSettings] = useState<Settings>({
    whatsapp_enabled: false,
    whatsapp_template: "",
    delay_hours: 1,
    provider: "zapi",
    activation_date: null,
  });

  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const filteredLeads = useMemo(() => {
    const s = startOfDay(startDate);
    const e = endOfDay(endDate);
    return leads.filter((l) =>
      isWithinInterval(parseISO(l.created_at), { start: s, end: e })
    );
  }, [leads, startDate, endDate]);

  const load = async () => {
    setLoading(true);
    const [leadsRes, settingsRes, funnelRes] = await Promise.all([
      (supabase as any).rpc("admin_get_leads_without_deposit", { _min_hours: 1 }),
      (supabase as any).from("remarketing_settings").select("*").eq("id", 1).maybeSingle(),
      (supabase as any).rpc("admin_get_remarketing_funnel"),
    ]);
    setLoading(false);
    if (leadsRes.error) toast.error("Erro leads: " + leadsRes.error.message);
    else setLeads((leadsRes.data as Lead[]) || []);
    if (settingsRes.data) setSettings(settingsRes.data as Settings);
    if (funnelRes.data && funnelRes.data[0]) {
      const f = funnelRes.data[0];
      setFunnel({
        total_no_deposit: Number(f.total_no_deposit) || 0,
        messaged: Number(f.messaged) || 0,
        clicked: Number(f.clicked) || 0,
        clicked_and_deposited: Number(f.clicked_and_deposited) || 0,
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await (supabase as any).rpc("admin_update_remarketing_settings", {
      _enabled: settings.whatsapp_enabled,
      _template: settings.whatsapp_template,
      _delay_hours: settings.delay_hours,
      _provider: settings.provider,
      _activation_date: settings.activation_date,
    });
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Configurações salvas");
  };

  const activateNow = async () => {
    const now = new Date().toISOString();
    setSettings((s) => ({ ...s, activation_date: now }));
    const { error } = await (supabase as any).rpc("admin_update_remarketing_settings", {
      _enabled: settings.whatsapp_enabled,
      _template: settings.whatsapp_template,
      _delay_hours: settings.delay_hours,
      _provider: settings.provider,
      _activation_date: now,
    });
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Ativado! Só leads a partir de agora receberão.");
      load();
    }
  };
  const togglePause = async () => {
    const newEnabled = !settings.whatsapp_enabled;
    setSaving(true);
    const { error } = await (supabase as any).rpc("admin_update_remarketing_settings", {
      _enabled: newEnabled,
      _template: settings.whatsapp_template,
      _delay_hours: settings.delay_hours,
      _provider: settings.provider,
      _activation_date: settings.activation_date,
    });
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else {
      setSettings((s) => ({ ...s, whatsapp_enabled: newEnabled }));
      toast.success(newEnabled ? "Disparos retomados" : "Disparos pausados");
    }
  };



  const triggerNow = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-remarketing-whatsapp", {
        body: { manual: true },
      });
      if (error) throw error;
      toast.success(
        `Envios: ${data?.sent ?? 0} sucesso, ${data?.failed ?? 0} falhas, ${data?.skipped ?? 0} pulados`
      );
      load();
    } catch (e: any) {
      toast.error("Erro: " + (e?.message ?? "desconhecido"));
    } finally {
      setSending(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["email", "nome", "telefone", "cadastro", "ja_enviado"],
      ...filteredLeads.map((l) => [
        l.email,
        l.full_name || "",
        l.phone || "",
        l.created_at,
        l.already_messaged ? "sim" : "nao",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-sem-deposito-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const eligible = filteredLeads.filter((l) => !l.already_messaged && l.phone);
  const noPhone = filteredLeads.filter((l) => !l.phone).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminDateFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
        <p className="text-[11px] text-muted-foreground">
          Filtro aplicado aos leads e métricas abaixo. Funil considera desde a ativação.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Leads sem depósito" value={filteredLeads.length} />
        <MetricCard label="Prontos para envio" value={eligible.length} highlight />
        <MetricCard label="Já receberam WhatsApp" value={filteredLeads.filter((l) => l.already_messaged).length} />
        <MetricCard label="Sem telefone" value={noPhone} />
      </div>

      {funnel && <FunnelChart funnel={funnel} />}



      <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageCircle size={14} className="text-primary" /> Configurações do WhatsApp automático
        </h3>

        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            settings.whatsapp_enabled
              ? "bg-emerald-500/10 border-emerald-500/40"
              : "bg-amber-500/10 border-amber-500/40"
          }`}
        >
          <div className="space-y-0.5">
            <p className="text-sm font-semibold flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  settings.whatsapp_enabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {settings.whatsapp_enabled ? (
                <span className="text-emerald-500">Ativo — disparos rodando a cada 10 min</span>
              ) : (
                <span className="text-amber-500">Pausado — nenhum lead está recebendo</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Pausar não apaga nada: template, ativação e leads continuam salvos. Ao retomar, o próximo cron (em até 10 min) volta a enviar.
            </p>
          </div>
          <Button
            size="sm"
            variant={settings.whatsapp_enabled ? "outline" : "default"}
            onClick={togglePause}
            disabled={saving}
          >
            {settings.whatsapp_enabled ? "⏸ Pausar disparos" : "▶ Retomar disparos"}
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Disparar após (horas do cadastro)</label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              value={settings.delay_hours}
              onChange={(e) => setSettings({ ...settings, delay_hours: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Provedor</label>
            <select
              value={settings.provider}
              onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
              className="w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm"
            >
              <option value="zapi">Z-API</option>
              <option value="evolution">Evolution API</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">
            Template da mensagem (variáveis: <code>{"{nome}"}</code>, <code>{"{email}"}</code>, <code>{"{link}"}</code> — link rastreado)
          </label>
          <Textarea
            rows={5}
            value={settings.whatsapp_template}
            onChange={(e) => setSettings({ ...settings, whatsapp_template: e.target.value })}
          />
        </div>

        <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Data de ativação:</strong>{" "}
            {settings.activation_date
              ? new Date(settings.activation_date).toLocaleString("pt-BR")
              : "❌ não ativado (nenhum lead receberá até você ativar)"}
          </p>
          <p className="text-xs text-muted-foreground">
            Após ativar, apenas leads cadastrados a partir da data acima receberão o WhatsApp automático.
            Leads antigos são ignorados.
          </p>
          <Button size="sm" variant="outline" onClick={activateNow}>
            {settings.activation_date ? "Redefinir ativação para agora" : "Ativar agora (começar disparos)"}
          </Button>
        </div>


        <div className="flex flex-wrap gap-2">
          <Button onClick={saveSettings} disabled={saving} size="sm">
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
          <Button onClick={triggerNow} disabled={sending} size="sm" variant="secondary" className="gap-2">
            <Send size={14} className={sending ? "animate-pulse" : ""} />
            {sending ? "Enviando..." : "Disparar agora"}
          </Button>
          <Button onClick={load} size="sm" variant="ghost" className="gap-2">
            <RefreshCw size={14} /> Atualizar
          </Button>
          <Button onClick={exportCsv} size="sm" variant="ghost" className="gap-2">
            <Download size={14} /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-3 bg-secondary text-xs text-muted-foreground">
          Leads elegíveis (cadastrados há mais de 1h e sem depósito confirmado)
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs">
            <thead className="bg-secondary sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Email</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Telefone</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Cadastro</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.slice(0, 200).map((l) => (
                <tr key={l.user_id} className="hover:bg-secondary/30">
                  <td className="px-3 py-2 text-foreground">{l.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.full_name || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.phone || "❌ sem"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2">
                    {l.already_messaged ? (
                      <span className="text-emerald-500">✓ enviado</span>
                    ) : l.phone ? (
                      <span className="text-primary">pronto</span>
                    ) : (
                      <span className="text-destructive">sem telefone</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum lead no período selecionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredLeads.length > 200 && (
          <p className="text-xs text-muted-foreground p-3 text-center">
            Mostrando 200 de {filteredLeads.length}. Exporte o CSV para ver todos.
          </p>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div
    className={`p-4 rounded-2xl border ${
      highlight ? "bg-primary/10 border-primary/40" : "bg-card border-border"
    }`}
  >
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-xl font-bold mt-1 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
  </div>
);

const FunnelChart = ({ funnel }: { funnel: Funnel }) => {
  const total = Math.max(funnel.total_no_deposit, 1);
  const pct = (n: number) => Math.round((n / total) * 100);
  const steps = [
    {
      label: "Leads sem depósito (base)",
      value: funnel.total_no_deposit,
      pct: 100,
      color: "bg-muted-foreground/40",
      sub: "Total desde a ativação",
    },
    {
      label: "Receberam WhatsApp (1h+)",
      value: funnel.messaged,
      pct: pct(funnel.messaged),
      color: "bg-emerald-500",
      sub: `${pct(funnel.messaged)}% dos leads sem depósito`,
    },
    {
      label: "Clicaram no link",
      value: funnel.clicked,
      pct: pct(funnel.clicked),
      color: "bg-primary",
      sub:
        funnel.messaged > 0
          ? `${Math.round((funnel.clicked / funnel.messaged) * 100)}% de CTR sobre enviados`
          : "—",
    },
    {
      label: "Depositaram após clicar",
      value: funnel.clicked_and_deposited,
      pct: pct(funnel.clicked_and_deposited),
      color: "bg-amber-500",
      sub:
        funnel.clicked > 0
          ? `${Math.round((funnel.clicked_and_deposited / funnel.clicked) * 100)}% conversão pós-clique`
          : "—",
    },
  ];

  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
      <h3 className="text-sm font-semibold text-foreground">📊 Funil de remarketing</h3>
      <div className="space-y-3">
        {steps.map((s) => (
          <div key={s.label} className="space-y-1">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-foreground font-medium">{s.label}</span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{s.value.toLocaleString("pt-BR")}</strong> · {s.pct}%
              </span>
            </div>
            <div className="h-6 rounded-md bg-secondary overflow-hidden">
              <div
                className={`h-full ${s.color} transition-all flex items-center justify-end pr-2`}
                style={{ width: `${Math.max(s.pct, 2)}%` }}
              >
                <span className="text-[10px] font-semibold text-background">{s.pct}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


export default AdminRemarketing;
