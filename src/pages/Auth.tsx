import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";

const formatCPF = (value: string) => {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const isValidCPF = (value: string) => {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]);
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const ref = searchParams.get("ref") || "";
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const emailDomain = email.trim().toLowerCase().split("@")[1] || "";
        const allowedDomains = ["gmail.com", "outlook.com", "hotmail.com", "live.com", "outlook.com.br"];
        if (!allowedDomains.includes(emailDomain)) {
          toast({ title: "E-mail não permitido", description: "Apenas e-mails @gmail.com ou @outlook.com são aceitos no cadastro.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (!isValidCPF(cpf)) {
          toast({ title: "CPF inválido", description: "Digite um CPF real válido para concluir o cadastro.", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, phone, cpf, ref, fullName);
        if (error) {
          toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Conta criada com sucesso!", duration: 1000 });
          navigate("/deposit");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Login realizado!", duration: 1000 });
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead
        title={isRegister ? "Cadastro | MAXVIPBET" : "Login | MAXVIPBET"}
        description={isRegister
          ? "Crie sua conta no MAXVIPBET. Cadastre-se grátis e ganhe bônus no primeiro depósito. Jogue slots, crash games e cassino ao vivo em maxvipbet.com!"
          : "Faça login no MAXVIPBET. Acesse sua conta para jogar cassino online, slots e apostas esportivas em maxvipbet.com!"
        }
        keywords="maxvipbet cadastro, maxvipbet login, criar conta maxvipbet registro, max vip bet entrar, maxvipbet cadastro"
        path="/auth"
      />
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border">
          <div className="text-center mb-6">
            <img src="/images/logo.webp" alt="MAXVIPBET cassino online" className="h-10 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">
              {isRegister ? "Criar conta no MAXVIPBET" : "Entrar no MAXVIPBET"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRegister ? "Preencha os dados para criar sua conta" : "Entre com suas credenciais para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base"
                required
                minLength={6}
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Chave PIX para saques (CPF)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm neon-glow hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Aguarde..." : isRegister ? "Cadastrar" : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isRegister ? (
              <>
                Já tem conta?{" "}
                <Link to="/auth?mode=login" className="text-primary hover:underline font-medium">
                  Entrar
                </Link>
              </>
            ) : (
              <>
                Não tem conta?{" "}
                <Link to="/auth?mode=register" className="text-primary hover:underline font-medium">
                  Cadastre-se
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;