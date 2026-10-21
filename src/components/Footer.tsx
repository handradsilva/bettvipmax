import { ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-card border-t border-border mt-10" itemScope itemType="https://schema.org/WPFooter">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/" title="MAXVIPBET - maxvipbet - Página Inicial">
            <img src="/images/logo.webp" alt="MAXVIPBET - maxvipbet logo" className="h-8 sm:h-10" />
          </Link>
        </div>

        {/* SEO keyword-rich description */}
        <p className="text-center text-xs text-muted-foreground mb-6 max-w-2xl mx-auto">
          <strong>MAXVIPBET</strong> (maxvipbet / max vip bet) — Sua plataforma de apostas online, cassino ao vivo e esportes. Acesse <strong>maxvipbet.com</strong>.
        </p>

        {/* Internal links for SEO */}
        <nav aria-label="Links do rodapé">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 sm:gap-4 mb-6 text-xs sm:text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Cassino Online</Link>
            <Link to="/sports" className="hover:text-primary transition-colors">Apostas Esportivas</Link>
            <Link to="/auth?mode=register" className="hover:text-primary transition-colors">Cadastre-se</Link>
            <Link to="/deposit" className="hover:text-primary transition-colors">Depositar via PIX</Link>
            <Link to="/affiliate" className="hover:text-primary transition-colors">Seja um Afiliado</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 sm:gap-4 mb-6 text-xs sm:text-sm text-muted-foreground">
            {["Termos de uso", "Termos de apostas", "Política AML", "Política de privacidade", "Jogo responsável"].map((link) => (
              <a key={link} href="#" className="hover:text-primary transition-colors">
                {link}
              </a>
            ))}
          </div>
        </nav>

        {/* Payment method */}
        <div className="flex justify-center mb-6">
          <div className="px-4 py-2 rounded-lg bg-secondary border border-border text-sm font-bold text-foreground">
            PIX
          </div>
        </div>

        {/* Social icons */}
        <div className="flex justify-center gap-3 sm:gap-4 mb-6">
          {[
            { name: "Instagram MAXVIPBET", icon: "📸", url: "#" },
            { name: "YouTube MAXVIPBET", icon: "▶️", url: "#" },
            { name: "Telegram MAXVIPBET", icon: "✈️", url: "#" },
          ].map(({ name, icon, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center text-base sm:text-lg hover:bg-primary hover:text-primary-foreground transition-all"
              title={name}
              aria-label={name}
            >
              {icon}
            </a>
          ))}
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 text-[10px] sm:text-xs text-muted-foreground">
          <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-secondary border border-border">BeGambleAware</span>
          <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-secondary border border-border">Gordon Moody</span>
          <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-secondary border border-border">🔒 SSL Seguro</span>
          <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-secondary border border-border">18+</span>
        </div>

        {/* Language selector */}
        <div className="flex justify-center mb-6">
          <select className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="pt">🇧🇷 Português</option>
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
        </div>

        {/* Copyright */}
        <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
          © 2024 MAXVIPBET (maxvipbet). Todos os direitos reservados. | Jogue com responsabilidade. | maxvipbet.com
        </p>

        {/* Back to top */}
        <div className="flex justify-center mt-6">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <ArrowUp size={14} />
            Voltar ao topo
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
