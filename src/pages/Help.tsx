import { Link } from "react-router-dom";

import { useLanguage } from "@/contexts/LanguageContext";
import logoWhite from "@/assets/logo-white.webp";

type FaqItem = {
  question: { es: string; en: string };
  answer: { es: string; en: string };
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: {
      es: "¿Qué ocurre cuando se termina el plan?",
      en: "What happens when the plan ends?",
    },
    answer: {
      es: "Tu plan se renueva automáticamente cada mes. Si se termina, puedes adquirirlo nuevamente desde la sección de planes.",
      en: "Your plan renews automatically each month. If it ends, you can purchase it again from the plans section.",
    },
  },
  {
    question: {
      es: "¿Cuántos planes hay?",
      en: "How many plans are available?",
    },
    answer: {
      es: "Actualmente ofrecemos acceso anual y mensual para que elijas la opción que mejor se adapte a ti.",
      en: "We currently offer annual and monthly access so you can choose the option that fits you best.",
    },
  },
  {
    question: {
      es: "¿Qué hago si pierdo el acceso a mi cuenta?",
      en: "What should I do if I lose account access?",
    },
    answer: {
      es: "Puedes recuperar tu acceso desde la opción de contraseña olvidada o contactar a soporte para asistencia.",
      en: "You can recover access using the forgot-password option or contact support for assistance.",
    },
  },
  {
    question: {
      es: "¿Tengo límite de tiempo para usar mis paquetes de gigas?",
      en: "Is there a time limit to use my GB packages?",
    },
    answer: {
      es: "Mientras tu membresía esté activa, puedes usar los GB adquiridos. Al cancelar, mantienes acceso hasta agotarlos.",
      en: "While your membership is active, you can use your purchased GB. After cancellation, you keep access until they run out.",
    },
  },
  {
    question: {
      es: "¿Cada cuándo actualizan contenido?",
      en: "How often is content updated?",
    },
    answer: {
      es: "Se realizan actualizaciones semanales y puedes acceder a ellas en cualquier momento.",
      en: "Updates are released weekly and you can access them at any time.",
    },
  },
  {
    question: {
      es: "¿Cómo puedo hacer descargas múltiples de archivos?",
      en: "How can I download multiple files at once?",
    },
    answer: {
      es: "Puedes descargar carpetas desde el sitio, pero para descargas masivas se recomienda FileZilla vía FTP.",
      en: "You can download folders from the site, but FileZilla over FTP is recommended for bulk downloads.",
    },
  },
  {
    question: {
      es: "¿Cuál es el límite para descargar en navegador?",
      en: "What is the browser download limit?",
    },
    answer: {
      es: "El límite depende de los GB de tu plan. Puedes consumirlos tanto en navegador como por FTP.",
      en: "The limit depends on your plan GB. You can use them in browser or over FTP.",
    },
  },
  {
    question: {
      es: "¿Qué pasa con mis paquetes de gigas fijos si adquiero suscripción?",
      en: "What happens to fixed GB packages if I purchase a subscription?",
    },
    answer: {
      es: "Puedes seguir consumiendo tus GB fijos hasta agotarlos y luego usar los GB de tu suscripción.",
      en: "You can keep using your fixed GB until exhausted, then continue with subscription GB.",
    },
  },
  {
    question: {
      es: "Contraté por accidente y busco un reembolso",
      en: "I subscribed by mistake and need a refund",
    },
    answer: {
      es: "Contacta al equipo de soporte explicando tu caso y te guiarán con el proceso.",
      en: "Contact support with your case details and they will guide you through the process.",
    },
  },
];

export default function Help() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <main className="brand-frame min-h-screen bg-[#070707]">
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

          <div className="rounded-2xl border border-[#5E5E5E]/60 bg-[#111111] p-6 shadow-xl md:p-8">
            <h1 className="font-bebas text-4xl font-black md:text-5xl">
              {isSpanish ? "Preguntas frecuentes" : "Frequently asked questions"}
            </h1>
            <p className="mt-3 text-zinc-400">
              {isSpanish
                ? "Guía rápida basada en el contenido vigente del sitio en producción."
                : "Quick guide based on the current production site content."}
            </p>

            <div className="mt-8 space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <details
                  key={item.question.es}
                  className="group rounded-xl border border-[#5E5E5E]/70 bg-[#070707]/60 p-4 open:border-primary/40"
                >
                  <summary className="cursor-pointer list-none font-semibold text-foreground">
                    {index + 1}. {isSpanish ? item.question.es : item.question.en}
                  </summary>
                  <p className="mt-3 text-sm text-zinc-400">
                    {isSpanish ? item.answer.es : item.answer.en}
                  </p>
                </details>
              ))}
            </div>

            <p className="mt-8 text-xs text-zinc-400">
              {isSpanish ? "Soporte directo:" : "Direct support:"}{" "}
              <a
                href="mailto:soporte@videoremixpack.com"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                soporte@videoremixpack.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
