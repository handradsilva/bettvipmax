import { useState, useMemo } from "react";
import { Users, DollarSign, QrCode, UserPlus, TrendingUp, Filter, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { format, parseISO, isToday, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, subDays } from "date-fns";
import type { AdminProfile, AdminTransaction, AdminReferral } from "@/hooks/useAdminData";
import AdminDateFilter from "./AdminDateFilter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
interface Props {
  profiles: AdminProfile[];
  transactions: AdminTransaction[];
  referrals: AdminReferral[];
  refetch: () => Promise<void> | void;
}




const AdminDashboard = ({ profiles, transactions, referrals, refetch }: Props) => {
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reconciling, setReconciling] = useState(false);

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const { data, error } = await supabase.functions.invoke("reconcile-deposits", {
        body: { hours: 72 },
      });
      if (error) throw error;
      toast.success(
        `Reconciliação: ${data.completed} confirmados, ${data.still_pending} ainda pendentes, ${data.failed} falhas (${data.checked} verificados)`
      );
      await refetch();
    } catch (e: any) {
      toast.error("Erro ao reconciliar: " + (e?.message ?? "desconhecido"));
    } finally {
      setReconciling(false);
    }
  };


  const filtered = useMemo(() => {
    const s = startOfDay(startDate);
    const e = endOfDay(endDate);

    const inRange = (isoDate: string) =>
      isWithinInterval(parseISO(isoDate), {
        start: s,
        end: e,
      });

    const tx = transactions.filter((t) => inRange(t.created_at));
    const pr = profiles.filter((p) => inRange(p.created_at));

    return { tx, pr };
  }, [transactions, profiles, startDate, endDate]);

  const deposits = filtered.tx.filter((t) => t.type === "deposit");
  const paidDeposits = deposits.filter((t) => t.status === "completed");
  const todayDeposits = deposits.filter((t) => isToday(parseISO(t.created_at)));
  const todayPaid = todayDeposits.filter((t) => t.status === "completed");
  const todayUsers = filtered.pr.filter((p) => isToday(parseISO(p.created_at)));

  const totalPixValue = paidDeposits.reduce((s, t) => s + t.amount, 0);
  const todayPixValue = todayPaid.reduce((s, t) => s + t.amount, 0);

  const metrics = [
    { label: "Total de Usuários", value: profiles.length, icon: Users, color: "text-primary" },
    { label: "Saldo PIX (Hoje)", value: `R$ ${todayPixValue.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
    { label: "PIX Gerados (Hoje)", value: `${todayDeposits.length} (${todayPaid.length} Pagos)`, icon: QrCode, color: "text-primary" },
    { label: "Cadastros Hoje", value: todayUsers.length, icon: UserPlus, color: "text-primary" },
    { label: "Total Depósitos", value: `R$ ${totalPixValue.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-primary" },
    { label: "PIX Gerados (Geral)", value: `${deposits.length} (${paidDeposits.length} Pagos)`, icon: QrCode, color: "text-primary" },
  ];

  const funnel = useMemo(() => {
    const totalUsers = filtered.pr.length;
    const registeredUsersInRange = new Set(filtered.pr.map((p) => p.user_id));

    const cohortCompletedDeposits = filtered.tx.filter(
      (t) =>
        t.type === "deposit" &&
        t.status === "completed" &&
        registeredUsersInRange.has(t.user_id)
    );

    const usersDeposited = new Set(
      cohortCompletedDeposits.filter((t) => t.amount !== 21.9).map((t) => t.user_id)
    ).size;

    const usersPaidFee = new Set(
      cohortCompletedDeposits.filter((t) => t.amount === 21.9).map((t) => t.user_id)
    ).size;

    const pctDeposited = totalUsers > 0 ? (usersDeposited / totalUsers) * 100 : 0;
    const pctPaidFee = totalUsers > 0 ? (usersPaidFee / totalUsers) * 100 : 0;

    return [
      { label: "Cadastros", count: totalUsers, pct: totalUsers > 0 ? 100 : 0, color: "bg-primary" },
      { label: "Depositaram", count: usersDeposited, pct: Math.min(pctDeposited, 100), color: "bg-chart-2" },
      { label: "Pagaram taxa (R$ 21,90)", count: usersPaidFee, pct: Math.min(pctPaidFee, 100), color: "bg-chart-4" },
    ];
  }, [filtered]);

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(endDate, 30) > startDate ? subDays(endDate, 30) : startDate,
      end: endDate,
    });
    return days.map((day) => {
      const dayStr = format(day, "dd/MM");
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayPaid = paidDeposits.filter((t) => {
        const d = parseISO(t.created_at);
        return isWithinInterval(d, { start: dayStart, end: dayEnd });
      });
      const dayRegs = profiles.filter((p) => {
        const d = parseISO(p.created_at);
        return isWithinInterval(d, { start: dayStart, end: dayEnd });
      });
      return { name: dayStr, pix: dayPaid.reduce((s, t) => s + t.amount, 0), users: dayRegs.length };
    });
  }, [paidDeposits, profiles, startDate, endDate]);

  return (
    <div className="space-y-6">
      <AdminDateFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <m.icon size={14} className={m.color} /> {m.label}
            </p>
            <p className="text-lg font-bold text-foreground mt-1">{m.value}</p>
          </div>
        ))}
      </div>


      <div className="p-4 rounded-2xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Filter size={14} className="text-primary" /> Funil de Conversão
        </h3>
        <div className="space-y-4">
          {funnel.map((step, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{step.label}</span>
                <span className="font-semibold text-foreground">{step.count} ({step.pct.toFixed(1)}%)</span>
              </div>
              <Progress value={step.pct} className="h-2.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">PIX Recebidos (R$)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="pix" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Registros de Usuários</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
