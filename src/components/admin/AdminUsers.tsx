import { useState, useMemo } from "react";
import { format, parseISO, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { Search, ArrowDownCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AdminProfile, AdminTransaction } from "@/hooks/useAdminData";
import AdminDateFilter from "./AdminDateFilter";
import UserDetailModal from "./UserDetailModal";

interface Props {
  profiles: AdminProfile[];
  transactions?: AdminTransaction[];
}

const AdminUsers = ({ profiles, transactions = [] }: Props) => {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selected, setSelected] = useState<AdminProfile | null>(null);

  const depositMap = useMemo(() => {
    const map = new Map<string, { count: number; total: number; first?: AdminTransaction }>();
    for (const t of transactions) {
      if (t.type !== "deposit" || t.status !== "completed") continue;
      const cur = map.get(t.user_id) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(t.amount);
      if (!cur.first || t.created_at < cur.first.created_at) cur.first = t;
      map.set(t.user_id, cur);
    }
    return map;
  }, [transactions]);

  const filtered = useMemo(() => {
    const s = startOfDay(startDate);
    const e = endOfDay(endDate);
    return profiles
      .filter((p) => {
        const d = parseISO(p.created_at);
        return isAfter(d, s) && isBefore(d, e);
      })
      .filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase().trim();
        const qDigits = q.replace(/\D/g, "");
        const cpfDigits = (p.cpf || "").replace(/\D/g, "");
        const emailMatch = p.email.toLowerCase().includes(q);
        const cpfMatch = qDigits.length > 0 && cpfDigits.includes(qDigits);
        return emailMatch || cpfMatch;
      });
  }, [profiles, search, startDate, endDate]);

  return (
    <div className="space-y-4">
      <AdminDateFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por e-mail ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-secondary"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">E-mail</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Telefone</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Data Registro</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Depositou</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Total Dep.</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Indicado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const referrer = p.referred_by ? profiles.find((pr) => pr.referral_code === p.referred_by) : null;
                const dep = depositMap.get(p.user_id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-foreground font-medium">{p.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(parseISO(p.created_at), "dd/MM/yyyy HH:mm")}</td>
                    <td className="px-4 py-3">
                      {dep ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                          <ArrowDownCircle size={12} /> Sim
                          {dep.first && (
                            <span className="text-muted-foreground font-normal ml-1">
                              ({format(parseISO(dep.first.created_at), "dd/MM")})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {dep ? `R$ ${dep.total.toFixed(2).replace(".", ",")}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{referrer ? referrer.email : "—"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} usuários encontrados — clique em uma linha para ver detalhes</p>

      <UserDetailModal
        user={selected}
        profiles={profiles}
        transactions={transactions}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default AdminUsers;
