import { Zap, Users, Disc3, Music } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

type HeroCommunitySectionProps = {
  whatsappGroupUrl: string;
  onPrimaryCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
};

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1800;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HeroCommunitySection({
  whatsappGroupUrl,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
}: HeroCommunitySectionProps) {
  const isInternal = whatsappGroupUrl.startsWith("/");

  return (
    <section className="relative overflow-hidden bg-[#070707] px-4 pb-10 pt-12 md:pb-14 md:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(170,2,2,0.24),transparent_46%),radial-gradient(circle_at_10%_0%,rgba(239,239,239,0.06),transparent_40%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mx-auto inline-flex items-center justify-center rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1.5 font-bebas text-sm font-semibold uppercase tracking-wide text-[#AA0202]">
          ⭐ EL HUB DEFINITIVO DEL DJ LATINO
        </p>

        <h1 className="mt-4 font-bebas text-5xl uppercase tracking-tight text-[#EFEFEF] md:text-7xl">
          TU BIBLIOTECA DE DJ LISTA EN MINUTOS, NO EN DÍAS.
        </h1>

        <p className="mt-4 font-sans text-lg leading-relaxed text-muted-foreground">
          Descarga masiva vía FTP. Centralizamos los éxitos de todos los pools, filtramos la basura y te entregamos +150,000 archivos limpios. Audio, Video y Karaoke.
        </p>

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-center">
          <Button
            asChild
            className="min-h-[56px] w-full bg-[#AA0202] px-6 font-bebas text-2xl uppercase tracking-wide text-[#EFEFEF] shadow-lg hover:bg-[#8A0101] md:w-auto"
            onClick={onPrimaryCtaClick}
          >
            {isInternal ? (
              <Link to={whatsappGroupUrl}>
                <Zap className="h-5 w-5" />
                INICIAR PRUEBA DE 7 DÍAS (100GB)
              </Link>
            ) : (
              <a href={whatsappGroupUrl} target="_blank" rel="noopener noreferrer">
                <Zap className="h-5 w-5" />
                INICIAR PRUEBA DE 7 DÍAS (100GB)
              </a>
            )}
          </Button>

          <Button
            asChild
            variant="outline"
            className="min-h-[56px] w-full border-[#5E5E5E] bg-transparent px-6 font-bebas text-xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#111111] md:w-auto"
            onClick={onSecondaryCtaClick}
          >
            <a href="#demos">VER DEMOS Y PRECIOS</a>
          </Button>
        </div>

        {/* Social proof stats bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-[#AA0202]" />
            <span className="font-bebas text-xl text-[#EFEFEF]">
              <AnimatedCounter target={4800} suffix="+" />
            </span>
            <span className="font-sans text-xs uppercase tracking-wide">DJs activos</span>
          </div>
          <div className="hidden h-4 w-px bg-[#5E5E5E] md:block" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Disc3 className="h-4 w-4 text-[#AA0202]" />
            <span className="font-bebas text-xl text-[#EFEFEF]">
              <AnimatedCounter target={150000} suffix="+" />
            </span>
            <span className="font-sans text-xs uppercase tracking-wide">archivos</span>
          </div>
          <div className="hidden h-4 w-px bg-[#5E5E5E] md:block" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Music className="h-4 w-4 text-[#AA0202]" />
            <span className="font-bebas text-xl text-[#EFEFEF]">
              <AnimatedCounter target={30} suffix="+" />
            </span>
            <span className="font-sans text-xs uppercase tracking-wide">géneros</span>
          </div>
        </div>
      </div>
    </section>
  );
}
