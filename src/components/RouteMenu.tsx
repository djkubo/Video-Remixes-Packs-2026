import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Gift,
  Home,
  Menu,
  Music,
  Usb,
  Zap,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
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

import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

type NavLink = {
  to: string;
  label: { es: string; en: string };
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_LINKS: NavLink[] = [
  { to: "/", label: { es: "Inicio", en: "Home" }, icon: Home },
  { to: "/membresia", label: { es: "Membresía", en: "Membership" }, icon: Zap },
  { to: "/gratis", label: { es: "Grupo Gratis", en: "Free Group" }, icon: Gift },
  { to: "/usb128", label: { es: "USB 128GB", en: "USB 128GB" }, icon: Usb },
  { to: "/usb-500gb", label: { es: "USB 500GB", en: "USB 500GB" }, icon: Usb },
  { to: "/anual", label: { es: "Acceso Anual", en: "Annual Access" }, icon: CalendarDays },
  { to: "/djedits", label: { es: "DJ Edits", en: "DJ Edits" }, icon: Music },
];

export default function RouteMenu() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Avoid cluttering the admin UI with a public navigation menu.
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed left-4 top-4 z-40">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 dark:bg-card/80 backdrop-blur-xl border border-border shadow-lg transition-all hover:bg-card hover:border-primary/50 hover:shadow-xl dark:hover:shadow-glow"
            aria-label={language === "es" ? "Menú" : "Menu"}
            type="button"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-[320px] bg-background/95 backdrop-blur-xl border-border/60"
        >
          <SheetHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={theme === "dark" ? logoWhite : logoDark}
                alt="VideoRemixesPacks"
                className="h-9 w-auto object-contain"
              />
            </div>
            <SheetTitle className="font-display">
              {language === "es" ? "Páginas" : "Pages"}
            </SheetTitle>
          </SheetHeader>

          <nav className="mt-6 space-y-2">
            {NAV_LINKS.map((l) => {
              const isActive = location.pathname === l.to;
              const Icon = l.icon;
              return (
                <SheetClose key={l.to} asChild>
                  <Link
                    to={l.to}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/60 bg-secondary/30 text-foreground hover:bg-secondary/50 hover:border-primary/20",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                      )}
                    />
                    <span className="font-sans font-medium">
                      {language === "es" ? l.label.es : l.label.en}
                    </span>
                  </Link>
                </SheetClose>
              );
            })}
          </nav>

          <div className="mt-6">
            <SheetClose asChild>
              <Button asChild className="btn-primary-glow w-full h-12 font-bold">
                <Link to="/membresia">
                  {language === "es" ? "Ver Planes y Precios" : "View Plans & Pricing"}
                </Link>
              </Button>
            </SheetClose>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            {language === "es"
              ? "Tip: Puedes abrir cualquier página escribiendo la ruta en la barra del navegador."
              : "Tip: You can open any page by typing the route in your browser address bar."}
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}
