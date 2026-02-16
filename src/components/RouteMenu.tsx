import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Zap } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logoWhite from "@/assets/logo-white.webp";

type NavLink = {
  to: string;
  ctaId: string;
  label: { es: string; en: string };
};

const NAV_LINKS: NavLink[] = [
  { to: "/plan", ctaId: "header_planes", label: { es: "Planes", en: "Plans" } },
  { to: "/explorer", ctaId: "header_demos", label: { es: "Demos", en: "Demos" } },
  { to: "/help", ctaId: "header_soporte", label: { es: "Soporte", en: "Support" } },
];

export default function RouteMenu() {
  const [open, setOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { trackEvent } = useAnalytics();
  const location = useLocation();

  if (location.pathname.startsWith("/admin")) return null;
  if (location.pathname === "/" || location.pathname === "/trends") return null;

  const isSpanish = language === "es";

  const handleNavClick = (ctaId: string) => {
    trackEvent("nav_click", { cta_id: ctaId, funnel_step: "navigation" });
  };

  const handleLanguageToggle = () => {
    const nextLanguage = isSpanish ? "en" : "es";
    trackEvent("language_toggle", {
      cta_id: "header_language_toggle",
      language_to: nextLanguage,
      funnel_step: "navigation",
    });
    toggleLanguage();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#5E5E5E]/90 bg-[#111111]/95 backdrop-blur-md shadow-[0_8px_16px_rgba(15,23,42,0.08)]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="inline-flex items-center" onClick={() => handleNavClick("header_logo")}>
          <img
            src={logoWhite}
            alt="VideoRemixesPack"
            className="h-9 w-auto object-contain md:h-10"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === "/plan" && location.pathname === "/membresia");

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => handleNavClick(item.ctaId)}
                className={cn(
                  "text-sm font-semibold transition-colors",
                  isActive ? "text-primary" : "text-[#EFEFEF]/72 hover:text-foreground"
                )}
              >
                {isSpanish ? item.label.es : item.label.en}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="h-10 rounded-lg border border-[#5E5E5E]/90 bg-background px-3 text-sm font-semibold text-[#EFEFEF] transition-colors hover:bg-muted"
            aria-label={isSpanish ? "Cambiar idioma a inglés" : "Switch language to Spanish"}
          >
            {isSpanish ? "EN" : "ES"}
          </button>
          <Button asChild className="btn-primary-glow h-10 px-4 font-bold">
            <Link to="/plan" onClick={() => handleNavClick("header_ver_planes")}>
              <Zap className="mr-2 h-4 w-4" />
              {isSpanish ? "Ver Planes" : "View Plans"}
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="h-9 rounded-md border border-[#5E5E5E] px-2.5 text-xs font-bold text-[#EFEFEF]"
            aria-label={isSpanish ? "Cambiar idioma a inglés" : "Switch language to Spanish"}
          >
            {isSpanish ? "EN" : "ES"}
          </button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#5E5E5E]/85 bg-[#111111]"
                aria-label={isSpanish ? "Abrir menú" : "Open menu"}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-[#5E5E5E]/80 bg-[#111111]">
              <SheetHeader>
                <SheetTitle>{isSpanish ? "Navegación" : "Navigation"}</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 space-y-2">
                {NAV_LINKS.map((item) => {
                  const isActive =
                    location.pathname === item.to ||
                    (item.to === "/plan" && location.pathname === "/membresia");
                  return (
                    <SheetClose key={item.to} asChild>
                      <Link
                        to={item.to}
                        onClick={() => handleNavClick(item.ctaId)}
                        className={cn(
                          "block rounded-lg border px-4 py-3 text-sm font-semibold",
                          isActive
                            ? "border-primary/60 bg-[#111111] text-primary"
                            : "border-[#5E5E5E]/85 text-[#EFEFEF] hover:bg-background"
                        )}
                      >
                        {isSpanish ? item.label.es : item.label.en}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>

              <div className="mt-5">
                <SheetClose asChild>
                  <Button asChild className="btn-primary-glow h-11 w-full font-bold">
                    <Link to="/plan" onClick={() => handleNavClick("header_mobile_ver_planes")}>
                      <Zap className="mr-2 h-4 w-4" />
                      {isSpanish ? "Ver Planes" : "View Plans"}
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
