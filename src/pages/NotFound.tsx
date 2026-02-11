import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn("404 route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 hero-gradient opacity-40" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card/80 p-8 text-center shadow-2xl backdrop-blur-sm">
        <p className="font-bebas text-sm uppercase tracking-[0.25em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">
          {language === "es" ? "Página no encontrada" : "Page not found"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {language === "es"
            ? "La página que intentaste abrir no existe o fue movida."
            : "The page you tried to open doesn't exist or was moved."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild size="lg" className="h-12 gap-2 font-bold">
            <Link to="/">
              <Home className="h-4 w-4" />
              {language === "es" ? "Volver al inicio" : "Back to home"}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 gap-2">
            <Link to="/plan">
              <Search className="h-4 w-4" />
              {language === "es" ? "Ver planes y precios" : "View plans & pricing"}
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {language === "es" ? "Ruta:" : "Route:"}{" "}
          <span className="font-mono">{location.pathname}</span>
        </p>
      </div>
    </main>
  );
};

export default NotFound;
