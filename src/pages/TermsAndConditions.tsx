import { Link } from "react-router-dom";

import SettingsToggle from "@/components/SettingsToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

type Section = {
  title: string;
  content: { es: string; en: string };
};

const SECTIONS: Section[] = [
  {
    title: "Terms of Purchase",
    content: {
      es: "Las suscripciones y productos se ofrecen según disponibilidad y condiciones vigentes. Al contratar, aceptas el uso profesional del material y las reglas de renovación/cancelación aplicables.",
      en: "Subscriptions and products are offered subject to availability and current conditions. By purchasing, you accept professional-use terms and applicable renewal/cancellation rules.",
    },
  },
  {
    title: "Intellectual Property",
    content: {
      es: "El contenido distribuido se proporciona para uso autorizado conforme a los términos de la plataforma. No se permite la redistribución no autorizada.",
      en: "Distributed content is provided for authorized use under platform terms. Unauthorized redistribution is not allowed.",
    },
  },
  {
    title: "Termination",
    content: {
      es: "El acceso puede suspenderse por incumplimiento de términos o uso indebido del servicio.",
      en: "Access may be suspended for terms violations or misuse of the service.",
    },
  },
  {
    title: "Personal Data",
    content: {
      es: "La información personal se gestiona de acuerdo con la política de privacidad oficial y los estándares de seguridad del proveedor.",
      en: "Personal information is handled according to the official privacy policy and provider security standards.",
    },
  },
  {
    title: "Contact Us",
    content: {
      es: "Para aclaraciones legales o soporte, utiliza los canales oficiales de contacto del sitio.",
      en: "For legal clarifications or support, use the site's official contact channels.",
    },
  },
  {
    title: "Other Legal Terms",
    content: {
      es: "Estos términos pueden actualizarse periódicamente. Revisa la versión oficial para validar cambios recientes.",
      en: "These terms may be updated periodically. Review the official version for recent changes.",
    },
  },
];

export default function TermsAndConditions() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isSpanish = language === "es";

  return (
    <main className="min-h-screen bg-background">
      <SettingsToggle />

      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 hero-gradient opacity-55" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-4xl px-4">
          <div className="mb-8 flex justify-center">
            <Link to="/">
              <img
                src={theme === "dark" ? logoWhite : logoDark}
                alt="VideoRemixesPack"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          <article className="rounded-2xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur-sm md:p-8">
            <h1 className="font-display text-3xl font-black leading-tight md:text-4xl">
              Video Remixes Packs' Website Terms and Conditions of Use
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Last Modified: March 8, 2021</p>

            <p className="mt-6 text-muted-foreground">
              {isSpanish
                ? "Resumen adaptado del documento legal vigente en producción. Para lectura completa y vinculante, consulta el documento oficial."
                : "Summary adapted from the current production legal document. For the full and binding version, consult the official document."}
            </p>

            <div className="mt-8 space-y-6">
              {SECTIONS.map((section) => (
                <section key={section.title} className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <h2 className="text-lg font-bold">{section.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isSpanish ? section.content.es : section.content.en}
                  </p>
                </section>
              ))}
            </div>

            <p className="mt-8 text-sm">
              <a
                href="https://videoremixespacks.com/terms_and_conditions"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {isSpanish ? "Ver términos completos en el sitio oficial" : "View full terms on the official site"}
              </a>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
