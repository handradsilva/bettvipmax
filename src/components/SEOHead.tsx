import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
}

const DEFAULT_KEYWORDS = "maxvipbet, max vip bet, maxvipbet, max vip bet, apostas online, cassino online, apostas esportivas, slots, jogos de cassino, bônus apostas, cassino ao vivo, plinko, mines, aviator, crash games, fortune tiger, fortune dragon, gates of olympus, sweet bonanza";

const SEOHead = ({
  title = "MAXVIPBET | Apostas Online, Cassino e Esportes | maxvipbet",
  description = "MAXVIPBET (maxvipbet) - A melhor plataforma de apostas online do Brasil. Cassino ao vivo, apostas esportivas, slots e bônus exclusivos. Jogue agora em maxvipbet.com!",
  keywords = DEFAULT_KEYWORDS,
  path = "/",
}: SEOHeadProps) => {
  const baseUrl = "https://maxvipbet.com";
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
    setMeta("keywords", keywords);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", fullUrl, true);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;
  }, [title, description, keywords, fullUrl]);

  return null;
};

export default SEOHead;