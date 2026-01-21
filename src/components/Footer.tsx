import { Disc3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/30 bg-background-carbon py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Disc3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">VideoRemixesPacks</span>
          </div>

          {/* Links */}
          <div className="flex gap-8">
            <a
              href="https://videoremixespacks.com/plan"
              className="font-sans text-sm text-muted-foreground transition-colors hover:text-primary hover:scale-105 duration-300"
            >
              {t("footer.plans")}
            </a>
            <a
              href="https://videoremixespacks.com"
              className="font-sans text-sm text-muted-foreground transition-colors hover:text-primary hover:scale-105 duration-300"
            >
              {t("footer.main")}
            </a>
          </div>

          {/* Copyright */}
          <p className="font-sans text-sm text-muted-foreground/60">
            © {new Date().getFullYear()} VideoRemixesPacks. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
