import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

const Footer = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border/85 bg-background py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPack"
              className="h-14 w-auto object-contain"
            />
          </a>

          {/* Contact and social */}
          <div className="flex items-center gap-4">
            <a
              href="mailto:djkubo@live.com.mx"
              aria-label="Email support"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="/help"
              aria-label="WhatsApp support"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/gustavogarciavr?igsh=OGMwaWl2eWIxcnZt"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/gustavogarciavr"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="/plan"
              className="font-sans text-sm text-foreground/72 transition-colors duration-300 hover:text-primary hover:scale-105"
            >
              {t("footer.plans")}
            </a>
            <a
              href="/help"
              className="font-sans text-sm text-foreground/72 transition-colors duration-300 hover:text-primary hover:scale-105"
            >
              {t("footer.support")}
            </a>
            <a
              href="/terms_and_conditions"
              className="font-sans text-sm text-foreground/72 transition-colors duration-300 hover:text-primary hover:scale-105"
            >
              {t("footer.terms")}
            </a>
            <a
              href="/privacy_policy"
              className="font-sans text-sm text-foreground/72 transition-colors duration-300 hover:text-primary hover:scale-105"
            >
              {t("footer.privacy")}
            </a>
            <a
              href="https://videoremixespacks.com/trends"
              target="_blank"
              rel="noreferrer"
              className="font-sans text-sm text-foreground/72 transition-colors duration-300 hover:text-primary hover:scale-105"
            >
              {t("footer.main")}
            </a>
          </div>

          {/* Copyright */}
          <p className="font-sans text-sm text-foreground/60">
            © {new Date().getFullYear()} VideoRemixesPack. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
