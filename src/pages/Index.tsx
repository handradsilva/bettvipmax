import { Star, Flame, Gamepad2, Video, Zap, Dice5 } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import WinningsTicker from "@/components/WinningsTicker";
import GameSection from "@/components/GameSection";
import ProviderSection from "@/components/ProviderSection";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { games } from "@/data/games";

const Index = () => {
  const recommended = games.filter((g) => g.category.includes("recomendados"));
  const mostPlayed = games.filter((g) => g.category.includes("mais-jogados"));
  const pgsoft = games.filter((g) => g.category.includes("pgsoft"));
  const pragmaticLive = games.filter((g) => g.category.includes("pragmatic-ao-vivo"));
  const pragmaticPlay = games.filter((g) => g.category.includes("pragmatic-play"));
  const ezugi = games.filter((g) => g.category.includes("ezugi"));
  const crash = games.filter((g) => g.category.includes("crash-games"));

  return (
    <Layout>
      <SEOHead
        title="BetVipMax | Apostas Online, Cassino e Esportes | betvipmax"
        description="BetVipMax (betvipmax / vipbetmax) - A melhor plataforma de apostas online do Brasil. Cassino ao vivo, apostas esportivas, slots e bônus exclusivos. Jogue agora!"
        path="/"
      />
      <div className="space-y-6">
        {/* Hidden SEO content for crawlers */}
        <h1 className="sr-only">BetVipMax - betvipmax - Cassino Online e Apostas Esportivas</h1>
        <p className="sr-only">
          Bem-vindo ao BetVipMax (betvipmax, vipbetmax, bet vip max). A melhor plataforma de apostas online e cassino do Brasil.
          Jogue slots, crash games, cassino ao vivo e apostas esportivas com os melhores bônus. Acesse bettvipmax.com agora!
        </p>

        <BannerCarousel />
        <WinningsTicker />

        <GameSection title="Recomendados" games={recommended} icon={<Star size={20} className="text-primary" />} />
        <GameSection title="Mais Jogados" games={mostPlayed} icon={<Flame size={20} className="text-primary" />} />
        <GameSection title="PGSoft" games={pgsoft} icon={<Gamepad2 size={20} className="text-primary" />} />
        <GameSection title="Pragmatic Ao Vivo" games={pragmaticLive} icon={<Video size={20} className="text-primary" />} />
        <GameSection title="Pragmatic Play" games={pragmaticPlay} icon={<Zap size={20} className="text-primary" />} />
        <GameSection title="Ezugi" games={ezugi} icon={<Dice5 size={20} className="text-primary" />} />
        <GameSection title="Crash Games" games={crash} icon={<Flame size={20} className="text-primary" />} />

        <ProviderSection />

        {/* SEO-rich content section */}
        <section className="mt-8 space-y-4 text-muted-foreground text-xs sm:text-sm leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-foreground">Sobre o BetVipMax (betvipmax)</h2>
          <p>
            O <strong>BetVipMax</strong> (também conhecido como <strong>betvipmax</strong>, <strong>vipbetmax</strong> ou <strong>bet vip max</strong>) é a plataforma líder em apostas online e cassino no Brasil. 
            Oferecemos uma experiência completa com <strong>cassino ao vivo</strong>, <strong>slots</strong>, <strong>crash games</strong> como Aviator, Mines e Plinko, além de <strong>apostas esportivas</strong> em futebol, basquete, tênis e muito mais.
          </p>
          <p>
            No <strong>betvipmax</strong> você encontra os melhores provedores de jogos do mundo, incluindo <strong>Pragmatic Play</strong>, <strong>PGSoft</strong>, <strong>Evolution</strong>, <strong>Ezugi</strong> e <strong>Playtech</strong>. 
            Deposite e saque rapidamente via <strong>PIX</strong> com total segurança. Cadastre-se agora em <strong>bettvipmax.com</strong> e aproveite nossos bônus exclusivos!
          </p>
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Por que escolher o BetVipMax?</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Centenas de jogos de cassino online dos melhores provedores</li>
            <li>Cassino ao vivo com dealers reais 24 horas</li>
            <li>Apostas esportivas com as melhores odds do mercado</li>
            <li>Depósitos e saques instantâneos via PIX</li>
            <li>Programa de afiliados com comissões atrativas</li>
            <li>Suporte 24/7 e plataforma 100% segura com SSL</li>
          </ul>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
