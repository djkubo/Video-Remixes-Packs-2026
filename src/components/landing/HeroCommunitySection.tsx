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
    <section className="relative overflow-hidden bg-zinc-950 px-4 pb-10 pt-12 md:pb-14 md:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(37,211,102,0.22),transparent_46%),radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.08),transparent_40%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mx-auto inline-flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-sm font-semibold text-white">
          ⭐ Únete a +7,000 DJs latinos
        </p>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
          La música que tu público pide, organizada por género y lista para mezclar.
        </h1>

        <p className="mt-4 text-lg text-zinc-400">
          3,000+ canciones nuevas. Calidad MP3 320kbps. Descarga, arrastra a Serato y triunfa.
        </p>

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-center">
          <Button
            asChild
            className="min-h-[56px] w-full bg-[#25D366] px-6 font-bold text-black shadow-lg hover:bg-[#1EBE5D] md:w-auto"
            onClick={onPrimaryCtaClick}
          >
            <a href={whatsappGroupUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              QUIERO UNIRME AL GRUPO (GRATIS)
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="min-h-[56px] w-full border-zinc-700 bg-transparent px-6 font-semibold text-white hover:bg-zinc-900 md:w-auto"
            onClick={onSecondaryCtaClick}
          >
            <a href="#demos">VER DEMOS Y PRECIOS</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
