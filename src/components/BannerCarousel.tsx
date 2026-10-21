import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const banners = [
  { src: "/images/banner1.webp", alt: "MAXVIPBET - Bônus de boas-vindas e promoções exclusivas" },
  { src: "/images/banner2.webp", alt: "MAXVIPBET - Cassino ao vivo e apostas esportivas" },
  { src: "/images/banner3.webp", alt: "MAXVIPBET - max vip bet - Crash games, slots e jogos populares" },
];

const BannerCarousel = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg sm:rounded-xl group max-w-full" role="banner" aria-label="Promoções MAXVIPBET">
      <div
        className="flex transition-transform duration-500 ease-out w-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <img
            key={i}
            src={banner.src}
            alt={banner.alt}
            title={banner.alt}
            className="w-full min-w-full flex-shrink-0 object-cover aspect-[2/1] sm:aspect-[21/9] md:aspect-[3/1]"
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>

      <button
        onClick={prev}
        aria-label="Banner anterior"
        className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/60 text-foreground flex items-center justify-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={next}
        aria-label="Próximo banner"
        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/60 text-foreground flex items-center justify-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={16} />
      </button>

      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Ir para banner ${i + 1}`}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
              i === current ? "bg-primary w-4 sm:w-6" : "bg-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
