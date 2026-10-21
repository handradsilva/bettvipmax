import { ArrowLeft, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";

const Sports = () => {
  return (
    <Layout>
      <SEOHead
        title="Apostas Esportivas | MAXVIPBET"
        description="Apostas esportivas no MAXVIPBET. Aposte em futebol, basquete, tênis e mais com as melhores odds. Deposite via PIX em maxvipbet.com!"
        keywords="maxvipbet apostas esportivas, maxvipbet esportes, max vip bet futebol, apostas online futebol, odds esportivas, maxvipbet esportes"
        path="/sports"
      />
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 space-y-6">
        <Trophy size={64} className="text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Apostas Esportivas - MAXVIPBET
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md">
          As apostas em jogos esportivos estarão disponíveis em breve! Estamos preparando as melhores odds para você no maxvipbet.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm neon-glow hover:brightness-110 transition-all"
        >
          <ArrowLeft size={18} />
          Voltar para o Cassino
        </Link>
      </div>
    </Layout>
  );
};

export default Sports;