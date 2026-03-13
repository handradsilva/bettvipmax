import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
}

const SEOHead = ({
  title = "BetVipMax | Apostas Online, Cassino e Esportes | betvipmax",
  description = "BetVipMax (betvipmax) - A melhor plataforma de apostas online do Brasil. Cassino ao vivo, apostas esportivas, slots e bônus exclusivos. Jogue agora em bettvipmax.com!",
  path = "/",
}: SEOHeadProps) => {
  const baseUrl = "https://www.bettvipmax.com";
  const fullUrl = `${baseUrl}${path}`;

  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("keywords", "betvipmax, vipbetmax, bet vip max, bettvipmax, apostas online, cassino online, apostas esportivas, slots, jogos de cassino, bônus apostas, cassino ao vivo, plinko, mines, aviator, crash games");
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", fullUrl, true);
    setMeta("twitter:title", title, true);
    setMeta("twitter:description", description, true);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;
  }, [title, description, fullUrl]);

  return null;
};

export default SEOHead;
