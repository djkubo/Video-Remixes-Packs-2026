import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroCommunitySectionProps = {
  whatsappGroupUrl: string;
  onPrimaryCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
};

export default function HeroCommunitySection({
  whatsappGroupUrl,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
}: HeroCommunitySectionProps) {
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
            <a href={whatsappGroupUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              INICIAR PRUEBA DE 7 DÍAS (100GB)
            </a>
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
      </div>
    </section>
  );
}
