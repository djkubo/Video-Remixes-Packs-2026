import { Link } from "react-router-dom";

import SettingsToggle from "@/components/SettingsToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.webp";

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
  const isSpanish = language === "es";
  const lastUpdated = isSpanish ? "15 Feb 2026" : "Feb 15, 2026";

  return (
    <main className="brand-frame min-h-screen bg-[#070707]">
      <SettingsToggle />

      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto max-w-4xl px-4">
          <div className="mb-8 flex justify-center">
            <Link to="/">
              <img
                src={logoWhite}
                alt="VideoRemixesPack"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          <article className="rounded-2xl border border-[#5E5E5E]/60 bg-[#111111] p-6 shadow-xl md:p-8">
            <h1 className="font-bebas text-3xl font-black leading-tight md:text-4xl">
              {isSpanish ? "Términos y condiciones" : "Terms and conditions"}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {isSpanish ? "Última actualización:" : "Last updated:"} {lastUpdated}
            </p>

            <p className="mt-6 text-zinc-400">
              {isSpanish
                ? "Estos términos aplican al uso de VideoRemixesPack y a la compra de productos y/o suscripciones disponibles en el sitio."
                : "These terms apply to the use of VideoRemixesPack and the purchase of products and/or subscriptions available on the site."}
            </p>

            <div className="mt-8 space-y-6">
              {SECTIONS.map((section) => (
                <section key={section.title} className="rounded-xl border border-[#5E5E5E]/70 bg-[#070707]/60 p-4">
                  <h2 className="text-lg font-bold">{section.title}</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    {isSpanish ? section.content.es : section.content.en}
                  </p>
                </section>
              ))}
            </div>

            <p className="mt-8 text-sm text-zinc-400">
              {isSpanish ? "Soporte:" : "Support:"}{" "}
              <a className="font-semibold text-primary underline-offset-2 hover:underline" href="mailto:soporte@videoremixpack.com">
                soporte@videoremixpack.com
              </a>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
