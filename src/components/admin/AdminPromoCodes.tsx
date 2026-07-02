import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Tag } from "lucide-react";

interface PromoCode {
  code: string;
  bonus_percent: number;
  active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  description: string | null;
  created_at: string;
}

const AdminPromoCodes = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [code, setCode] = useState("");
  const [bonus, setBonus] = useState("100");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar códigos");
    else setCodes((data as PromoCode[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const c = code.toUpperCase().trim();
    if (!c || !/^[A-Z0-9]{3,32}$/.test(c)) {
      toast.error("Código deve ter 3-32 letras/números");
      return;
    }
    setLoading(true);
    const { error } = await (supabase as any)
      .from("promo_codes")
      .insert({
        code: c,
        bonus_percent: Number(bonus) || 100,
        description: description || null,
      });
    setLoading(false);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Código criado!");
      setCode("");
      setDescription("");
      load();
    }
  };

  const toggleActive = async (c: PromoCode) => {
    const { error } = await (supabase as any)
      .from("promo_codes")
      .update({ active: !c.active })
      .eq("code", c.code);
    if (error) toast.error("Erro");
    else load();
  };

  const remove = async (c: string) => {
    if (!confirm(`Apagar código ${c}?`)) return;
    const { error } = await (supabase as any).from("promo_codes").delete().eq("code", c);
    if (error) toast.error("Erro");
    else load();
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Plus size={14} className="text-primary" /> Novo código promocional
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Input
            placeholder="VOLTA200"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="uppercase"
          />
          <Input
            placeholder="Bônus %"
            type="number"
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
          />
          <Input
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="sm:col-span-1"
          />
          <Button onClick={handleCreate} disabled={loading}>
            Criar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Link gerado: <span className="text-primary">https://bettvipmax.com/promo/{code || "SEUCODIGO"}</span>
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Código</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Bônus %</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Usos</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Ativo</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Descrição</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {codes.map((c) => (
              <tr key={c.code} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-bold text-foreground flex items-center gap-1.5">
                  <Tag size={12} className="text-primary" />
                  {c.code}
                </td>
                <td className="px-4 py-3 text-foreground">{c.bonus_percent}%</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.used_count}
                  {c.max_uses ? ` / ${c.max_uses}` : ""}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.active ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.active ? "ATIVO" : "PAUSADO"}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{c.description || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(c.code)}
                    className="text-destructive hover:text-destructive/70"
                    aria-label="Apagar"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum código criado ainda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPromoCodes;
