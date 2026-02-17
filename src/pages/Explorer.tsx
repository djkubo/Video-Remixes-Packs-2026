import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Headphones, Zap } from "lucide-react";
import MusicExplorer from "@/components/MusicExplorer";
import PersistentBottomPlayer from "@/components/landing/PersistentBottomPlayer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.webp";

export default function Explorer() {
  const { language } = useLanguage();
  const location = useLocation();
  const isGenresRoute = location.pathname === "/genres";

  const copy = {
    title: isGenresRoute
      ? language === "es"
        ? "Géneros"
        : "Genres"
      : language === "es"
        ? "Descargas por carpetas"
        : "Folder downloads",
    subtitle: isGenresRoute
      ? language === "es"
        ? "Explora y filtra por género antes de suscribirte."
        : "Explore and filter by genre before subscribing."
      : language === "es"
        ? "Navega carpetas, escucha previews y valida la calidad del catálogo."
        : "Browse folders, listen to previews, and validate catalog quality.",
    badge: isGenresRoute ? "GÉNEROS" : language === "es" ? "EXPLORADOR" : "EXPLORER",
  };

  useEffect(() => {
    document.title =
      isGenresRoute
        ? language === "es"
          ? "Géneros | VideoRemixesPack"
          : "Genres | VideoRemixesPack"
        : language === "es"
          ? "Descargas por carpetas | VideoRemixesPack"
          : "Folder downloads | VideoRemixesPack";
  }, [isGenresRoute, language]);

  return (
    <main className="brand-frame min-h-screen bg-[#070707] pb-[calc(env(safe-area-inset-bottom)+6.5rem)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-14 md:pt-14">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center">
              <img
                src={logoWhite}
                alt="VideoRemixesPack"
                className="h-10 w-auto object-contain md:h-12"
              />
            </Link>

            <Button asChild className="btn-primary-glow h-11 gap-2 px-5 font-black">
              <a href="https://videoremixespacks.com/plan" rel="noopener noreferrer">
                <Zap className="h-4 w-4" />
                {language === "es" ? "Ver planes" : "View plans"}
              </a>
            </Button>
          </div>

          <div className="mt-10 glass-card p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5E5E5E] bg-[#111111] px-4 py-2 text-sm font-black text-[#AA0202]">
              <Headphones className="h-4 w-4" />
              {copy.badge}
            </div>
            <h1 className="mt-5 font-bebas text-5xl font-black leading-[0.92] md:text-6xl">
              {isGenresRoute ? (
                copy.title
              ) : (
                <>
                  {copy.title.split(" ")[0]}{" "}
                  <span className="text-[#AA0202]">{copy.title.replace(/^\\S+\\s?/, "")}</span>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-zinc-400 md:text-base">
              {copy.subtitle}
            </p>
          </div>
        </div>
      </section>

      <MusicExplorer />
      <PersistentBottomPlayer />
    </main>
  );
}
