import { Link } from "react-router-dom";

import SettingsToggle from "@/components/SettingsToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

type Section = {
  title: { es: string; en: string };
  content: { es: string; en: string };
};

const SECTIONS: Section[] = [
  {
    title: { es: "Información personal recopilada", en: "Personal information collected" },
    content: {
      es: "Se recopilan datos proporcionados por el usuario, como nombre, correo, teléfono, dirección e información técnica básica para operar el servicio.",
      en: "User-provided data is collected, such as name, email, phone, address, and basic technical information to operate the service.",
    },
  },
  {
    title: { es: "Información transaccional", en: "Transactional information" },
    content: {
      es: "Los datos de pago sensibles se procesan mediante proveedores externos (por ejemplo PayPal/Stripe). El sitio evita almacenar tarjetas en sus propios servidores.",
      en: "Sensitive payment data is processed through third-party providers (e.g., PayPal/Stripe). The site avoids storing card data on its own servers.",
    },
  },
  {
    title: { es: "Cookies y analítica", en: "Cookies and analytics" },
    content: {
      es: "Se utilizan cookies y herramientas de analítica para mejorar experiencia, rendimiento y personalización de contenido.",
      en: "Cookies and analytics tools are used to improve experience, performance, and content personalization.",
    },
  },
  {
    title: { es: "Uso de la información en pedidos", en: "Use of information in orders" },
    content: {
      es: "La información de contacto y operación se usa para procesar pedidos, soporte y comunicaciones asociadas al servicio.",
      en: "Contact and operational data is used to process orders, support requests, and service communications.",
    },
  },
  {
    title: { es: "Compartición con terceros", en: "Sharing with third parties" },
    content: {
      es: "Solo se comparte información con proveedores necesarios para operación, pagos, soporte y cumplimiento legal.",
      en: "Information is shared only with providers necessary for operations, payments, support, and legal compliance.",
    },
  },
];

export default function PrivacyPolicy() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isSpanish = language === "es";

  return (
    <main className="brand-frame min-h-screen bg-background">
      <SettingsToggle />

      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

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

          <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-xl md:p-8">
            <h1 className="font-display text-4xl font-black md:text-5xl">PRIVACY POLICY</h1>

            <p className="mt-6 text-muted-foreground">
              {isSpanish
                ? "Resumen basado en la política de privacidad activa en producción. Para la versión completa y vigente, consulta el documento oficial."
                : "Summary based on the active production privacy policy. For the complete and current version, consult the official document."}
            </p>

            <div className="mt-8 space-y-6">
              {SECTIONS.map((section) => (
                <section key={section.title.es} className="rounded-xl border border-border/70 bg-background/60 p-4">
                  <h2 className="text-lg font-bold">
                    {isSpanish ? section.title.es : section.title.en}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isSpanish ? section.content.es : section.content.en}
                  </p>
                </section>
              ))}
            </div>

            <p className="mt-8 text-sm">
              <a
                href="https://videoremixespacks.com/privacy_policy"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {isSpanish ? "Ver política completa en el sitio oficial" : "View full policy on the official site"}
              </a>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
