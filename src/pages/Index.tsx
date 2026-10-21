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
        title="MAXVIPBET | Apostas Online, Cassino e Esportes | maxvipbet"
        description="MAXVIPBET (maxvipbet) - A melhor plataforma de apostas online do Brasil. Cassino ao vivo, apostas esportivas, slots e bônus exclusivos. Jogue agora!"
        path="/"
      />
      <div className="space-y-6">
        {/* Hidden SEO content for crawlers */}
        <h1 className="sr-only">MAXVIPBET - maxvipbet - Cassino Online e Apostas Esportivas</h1>
        <p className="sr-only">
          Bem-vindo ao MAXVIPBET (maxvipbet, max vip bet). A melhor plataforma de apostas online e cassino do Brasil.
          Jogue slots, crash games, cassino ao vivo e apostas esportivas com os melhores bônus. Acesse maxvipbet.com agora!
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
          <h2 className="text-base sm:text-lg font-bold text-foreground">Sobre o MAXVIPBET (maxvipbet)</h2>
          <p>
            O <strong>MAXVIPBET</strong> (também conhecido como <strong>maxvipbet</strong>, <strong>maxvipbet</strong>, <strong>max vip bet</strong> ou <strong>max vip bet</strong>) é a plataforma líder em apostas online e cassino no Brasil. 
            Oferecemos uma experiência completa com <strong>cassino ao vivo</strong>, <strong>slots</strong>, <strong>crash games</strong> como Aviator, Mines e Plinko, além de <strong>apostas esportivas</strong> em futebol, basquete, tênis e muito mais.
            Acesse agora <strong>maxvipbet.com</strong> e comece a jogar!
          </p>
          <p>
            No <strong>maxvipbet</strong> você encontra os melhores provedores de jogos do mundo, incluindo <strong>Pragmatic Play</strong>, <strong>PGSoft</strong>, <strong>Evolution</strong>, <strong>Ezugi</strong> e <strong>Playtech</strong>. 
            Jogos populares como <strong>Fortune Tiger</strong>, <strong>Fortune Dragon</strong>, <strong>Fortune Ox</strong>, <strong>Gates of Olympus</strong>, <strong>Sweet Bonanza</strong> e <strong>Aviator</strong> estão disponíveis 24 horas.
            Deposite e saque rapidamente via <strong>PIX</strong> com total segurança. Cadastre-se agora em <strong>maxvipbet.com</strong> e aproveite nossos bônus exclusivos!
          </p>

          <h3 className="text-sm sm:text-base font-semibold text-foreground">Por que escolher o MAXVIPBET (maxvipbet)?</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Centenas de jogos de cassino online dos melhores provedores</li>
            <li>Cassino ao vivo com dealers reais 24 horas</li>
            <li>Apostas esportivas com as melhores odds do mercado</li>
            <li>Depósitos e saques instantâneos via PIX</li>
            <li>Programa de afiliados com comissões atrativas</li>
            <li>Suporte 24/7 e plataforma 100% segura com SSL</li>
            <li>Bônus de boas-vindas no primeiro depósito</li>
            <li>Crash games populares: Aviator, Mines, Plinko, Spaceman</li>
          </ul>

          <h3 className="text-sm sm:text-base font-semibold text-foreground">Jogos populares no MAXVIPBET</h3>
          <p>
            No <strong>maxvipbet</strong> (maxvipbet.com) você pode jogar os jogos mais populares do Brasil: <strong>Fortune Tiger</strong>, <strong>Fortune Dragon</strong>, <strong>Fortune Ox</strong>, <strong>Fortune Mouse</strong>, <strong>Fortune Rabbit</strong>, 
            <strong> Gates of Olympus</strong>, <strong>Sweet Bonanza</strong>, <strong>Sugar Rush</strong>, <strong>Big Bass Bonanza</strong>, <strong>Aviator</strong>, <strong>Mines</strong>, <strong>Plinko</strong>, <strong>Spaceman</strong>, 
            <strong> Roleta Brasileira</strong>, <strong>Blackjack</strong>, <strong>Dragon Tiger</strong> e muitos outros. Todos disponíveis 24h em <strong>maxvipbet.com</strong>.
          </p>

          <h3 className="text-sm sm:text-base font-semibold text-foreground">Perguntas Frequentes sobre o MAXVIPBET</h3>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-foreground">O que é MAXVIPBET (maxvipbet)?</p>
              <p>O MAXVIPBET (maxvipbet, max vip bet) é a melhor plataforma de apostas online e cassino do Brasil, com jogos ao vivo, slots, crash games e apostas esportivas. Acesse maxvipbet.com.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Como depositar no MAXVIPBET?</p>
              <p>No maxvipbet você deposita instantaneamente via PIX. Acesse a área de depósito, informe o valor (mínimo R$ 20) e escaneie o QR Code PIX.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">O MAXVIPBET é seguro?</p>
              <p>Sim! O maxvipbet utiliza criptografia SSL, segue políticas de jogo responsável e oferece suporte 24/7.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Quais jogos tem no MAXVIPBET?</p>
              <p>Centenas de jogos incluindo Fortune Tiger, Gates of Olympus, Sweet Bonanza, Aviator, Mines, Plinko, roleta ao vivo, blackjack e muito mais.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Como funciona o programa de afiliados?</p>
              <p>Compartilhe seu link exclusivo do maxvipbet, seus amigos se cadastram e você ganha comissão por cada depósito realizado.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Como sacar no MAXVIPBET?</p>
              <p>Acesse a área de saque no maxvipbet, informe sua chave PIX e o valor. Saque mínimo R$ 20 com pagamento instantâneo.</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
