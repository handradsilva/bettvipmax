import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Wallet, ArrowDownCircle, ArrowUpCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { AdminProfile, AdminTransaction } from "@/hooks/useAdminData";

interface Props {
  user: AdminProfile | null;
  profiles: AdminProfile[];
  transactions: AdminTransaction[];
  open: boolean;
  onClose: () => void;
}

const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const statusBadge = (status: string) => {
  if (status === "completed") return { icon: CheckCircle2, label: "Concluído", color: "text-emerald-500" };
  if (status === "pending") return { icon: Clock, label: "Pendente", color: "text-amber-500" };
  return { icon: XCircle, label: status, color: "text-destructive" };
};

const UserDetailModal = ({ user, profiles, transactions, open, onClose }: Props) => {
  if (!user) return null;

  const userTxs = useMemo(
    () => transactions.filter((t) => t.user_id === user.user_id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [transactions, user]
  );

  const deposits = userTxs.filter((t) => t.type === "deposit");
  const withdrawals = userTxs.filter((t) => t.type === "withdrawal");

  const totalDeposited = deposits.filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawn = withdrawals.filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.amount), 0);
  const hasDeposited = deposits.some((t) => t.status === "completed");
  const firstDeposit = deposits.find((t) => t.status === "completed");

  const referrer = user.referred_by ? profiles.find((p) => p.referral_code === user.referred_by) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <User size={18} className="text-primary" />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parseISO(user.created_at) >= new Date(2026, 4, 14) && (
                <Field label="Nome Completo" value={user.full_name || "—"} />
              )}
              <Field label="E-mail" value={user.email} />
              <Field label="Telefone" value={user.phone || "—"} />
              <Field label="CPF" value={user.cpf || "—"} />
              <Field label="Chave PIX" value={user.pix_key || "—"} />
              <Field label="Código de Referência" value={user.referral_code || "—"} />
              <Field label="Indicado por" value={referrer ? referrer.email : "—"} />
              <Field label="Status Afiliado" value={user.affiliate_approved ? "Aprovado" : "Não aprovado"} />
              <Field label="Data de Cadastro" value={format(parseISO(user.created_at), "dd/MM/yyyy HH:mm")} />
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SummaryCard
                title="Saldo Atual"
                value={formatBRL(totalDeposited)}
                icon={Wallet}
                accent="text-primary"
              />
              <SummaryCard
                title="Total Depositado"
                value={formatBRL(totalDeposited)}
                icon={ArrowDownCircle}
                accent="text-emerald-500"
                subtitle={`${deposits.filter((t) => t.status === "completed").length} depósito(s)`}
              />
              <SummaryCard
                title="Total Retirado"
                value={formatBRL(totalWithdrawn)}
                icon={ArrowUpCircle}
                accent="text-amber-500"
                subtitle={`${withdrawals.filter((t) => t.status === "completed").length} saque(s)`}
              />
            </div>

            <div className="p-4 rounded-xl bg-secondary border border-border">
              <p className="text-xs text-muted-foreground mb-1">Depositou?</p>
              {hasDeposited && firstDeposit ? (
                <p className="text-sm text-foreground">
                  <span className="text-emerald-500 font-semibold">Sim</span> — primeiro depósito de{" "}
                  <span className="font-semibold">{formatBRL(Number(firstDeposit.amount))}</span> em{" "}
                  {format(parseISO(firstDeposit.created_at), "dd/MM/yyyy HH:mm")}
                </p>
              ) : (
                <p className="text-sm text-destructive font-semibold">Não</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Histórico de Transações</h4>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Data</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Tipo</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Valor</th>
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {userTxs.map((t) => {
                        const s = statusBadge(t.status);
                        return (
                          <tr key={t.id} className="hover:bg-secondary/50">
                            <td className="px-3 py-2 text-muted-foreground">
                              {format(parseISO(t.created_at), "dd/MM/yyyy HH:mm")}
                            </td>
                            <td className="px-3 py-2 text-foreground">
                              {t.type === "deposit" ? "Depósito" : "Saque"}
                            </td>
                            <td className="px-3 py-2 text-foreground font-semibold">
                              {formatBRL(Number(t.amount))}
                            </td>
                            <td className={`px-3 py-2 font-medium ${s.color}`}>
                              <span className="inline-flex items-center gap-1">
                                <s.icon size={12} /> {s.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {userTxs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                            Nenhuma transação
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-secondary border border-border">
    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
    <p className="text-sm text-foreground font-medium break-all">{value}</p>
  </div>
);

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  accent,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  accent: string;
  subtitle?: string;
}) => (
  <div className="p-4 rounded-xl bg-secondary border border-border">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className={accent} />
      <p className="text-xs text-muted-foreground">{title}</p>
    </div>
    <p className={`text-lg font-bold ${accent}`}>{value}</p>
    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

export default UserDetailModal;
