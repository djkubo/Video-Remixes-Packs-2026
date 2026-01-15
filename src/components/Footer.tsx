import { Disc3 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background-carbon py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Disc3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">VideoRemixesPacks</span>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VideoRemixesPacks. Todos los derechos reservados.
          </p>

          {/* Links */}
          <div className="flex gap-6">
            <a
              href="https://videoremixespacks.com/plan"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Ver Planes
            </a>
            <a
              href="https://videoremixespacks.com"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Sitio Principal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
