import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

const Footer = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border/30 bg-background-carbon py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPacks"
              className="h-14 w-auto object-contain"
            />
          </a>

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
