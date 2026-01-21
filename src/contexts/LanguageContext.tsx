import { createContext, useContext, useState, ReactNode } from "react";

type Language = "es" | "en";

interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

// Centralized translations
export const translations: Translations = {
  // Hero Section
  "hero.badge": {
    es: "ACCESO 100% DIGITAL & INMEDIATO",
    en: "100% DIGITAL & INSTANT ACCESS",
  },
  "hero.title": {
    es: "El Hub Definitivo del",
    en: "The Ultimate Hub for the",
  },
  "hero.titleHighlight": {
    es: "DJ Latino",
    en: "Latin DJ",
  },
  "hero.subtitle": {
    es: "Deja de pagar 4 membresías. Centralizamos los mejores pools en un solo lugar.",
    en: "Stop paying for 4 memberships. We centralize the best pools in one place.",
  },
  "hero.subtitleBold": {
    es: "1TB de Descarga Masiva vía FTP.",
    en: "1TB Bulk Download via FTP.",
  },
  "hero.cta": {
    es: "Ver Planes y Precios",
    en: "See Plans & Pricing",
  },
  "hero.stat1": { es: "Archivos Clean", en: "Clean Files" },
  "hero.stat2": { es: "Géneros", en: "Genres" },
  "hero.stat3": { es: "Descarga Mensual", en: "Monthly Download" },

  // Aggregator Section
  "aggregator.badge": { es: "MODELO AGREGADOR", en: "AGGREGATOR MODEL" },
  "aggregator.title": { es: "NOSOTROS PAGAMOS LOS POOLS", en: "WE PAY FOR THE POOLS" },
  "aggregator.titleHighlight": { es: "POR TI.", en: "FOR YOU." },
  "aggregator.subtitle": {
    es: "No pagues 5 membresías. Paga solo una. Nosotros hacemos el trabajo sucio y te lo entregamos en bandeja de plata.",
    en: "Don't pay for 5 memberships. Pay just one. We do the dirty work and deliver it on a silver platter.",
  },
  "aggregator.feat1.title": { es: "Pagamos los Pools", en: "We Pay for Pools" },
  "aggregator.feat1.desc": {
    es: "Nosotros nos suscribimos a múltiples fuentes. Tú pagas solo una.",
    en: "We subscribe to multiple sources. You pay for just one.",
  },
  "aggregator.feat2.title": { es: "Filtramos la Basura", en: "We Filter the Junk" },
  "aggregator.feat2.desc": {
    es: "Solo los éxitos. Cero relleno. Cero versiones inútiles.",
    en: "Only the hits. Zero filler. Zero useless versions.",
  },
  "aggregator.feat3.title": { es: "Corregimos los Tags", en: "We Fix the Tags" },
  "aggregator.feat3.desc": {
    es: "Metadata perfecta: Artista, Título, BPM, Género.",
    en: "Perfect metadata: Artist, Title, BPM, Genre.",
  },
  "aggregator.feat4.title": { es: "Entrega Limpia", en: "Clean Delivery" },
  "aggregator.feat4.desc": {
    es: "Sin logos, sin marcas de agua. Archivos profesionales.",
    en: "No logos, no watermarks. Professional files.",
  },

  // DJ Todoterreno
  "dj.title": { es: "PARA EL DJ QUE", en: "FOR THE DJ WHO" },
  "dj.titleHighlight": { es: "TOCA DE TODO.", en: "PLAYS EVERYTHING." },
  "dj.question": {
    es: "¿Te piden",
    en: "Do they ask for",
  },
  "dj.covered": { es: "Lo tenemos cubierto.", en: "We've got you covered." },
  "dj.never": {
    es: 'Nunca más digas "no la tengo".',
    en: 'Never say "I don\'t have it" again.',
  },
  "dj.from": {
    es: "Desde Cumbia Lagunera hasta Reggaeton Old School.",
    en: "From Cumbia Lagunera to Old School Reggaeton.",
  },

  // Speed Section
  "speed.badge": { es: "SINCRONIZACIÓN MASIVA", en: "BULK SYNC" },
  "speed.title1": { es: "DESCARGA", en: "DOWNLOAD" },
  "speed.title2": { es: "1TB EN MINUTOS", en: "1TB IN MINUTES" },
  "speed.title3": { es: "CON FTP.", en: "WITH FTP." },
  "speed.subtitle": {
    es: "Conecta FileZilla o Air Explorer. Sincroniza tu librería completa mientras duermes.",
    en: "Connect FileZilla or Air Explorer. Sync your entire library while you sleep.",
  },
  "speed.ftpTitle": { es: "Conexión FTP Directa", en: "Direct FTP Connection" },
  "speed.ftpDesc": { es: "Arrastra, suelta y sincroniza. Así de fácil.", en: "Drag, drop, and sync. That simple." },
  "speed.feat1.title": { es: "Servidores Premium", en: "Premium Servers" },
  "speed.feat1.desc": { es: "Alta velocidad sin throttling", en: "High speed without throttling" },
  "speed.feat2.title": { es: "Air Explorer", en: "Air Explorer" },
  "speed.feat2.desc": { es: "Sincroniza con tu nube", en: "Sync with your cloud" },
  "speed.feat3.title": { es: "Sin Límites", en: "No Limits" },
  "speed.feat3.desc": { es: "Descarga masiva. Sin caps.", en: "Bulk download. No caps." },
  "speed.feat4.title": { es: "Mientras Duermes", en: "While You Sleep" },
  "speed.feat4.desc": { es: "Programa y despierta listo", en: "Schedule and wake up ready" },

  // Premium Features
  "premium.badge": { es: "Tecnología Premium", en: "Premium Technology" },
  "premium.title": { es: "Herramientas", en: "Professional" },
  "premium.titleHighlight": { es: "Profesionales", en: "Tools" },
  "premium.subtitle": { es: "Diseñadas para DJs que valoran su tiempo.", en: "Designed for DJs who value their time." },
  "premium.feat1.title": { es: "Descarga Masiva FTP", en: "FTP Bulk Download" },
  "premium.feat1.desc": {
    es: "Conecta Air Explorer o FileZilla. Baja todo de golpe mientras duermes.",
    en: "Connect Air Explorer or FileZilla. Download everything at once while you sleep.",
  },
  "premium.feat2.title": { es: "Organización Perfecta", en: "Perfect Organization" },
  "premium.feat2.desc": {
    es: "Todo etiquetado por género, BPM y año. Cero carpetas basura.",
    en: "Everything tagged by genre, BPM and year. Zero junk folders.",
  },
  "premium.feat3.title": { es: "Calidad Garantizada", en: "Guaranteed Quality" },
  "premium.feat3.desc": {
    es: "MP3 320kbps + Video 1080p. Si no sirve para tocar, no lo subimos.",
    en: "MP3 320kbps + Video 1080p. If it's not good for playing, we don't upload it.",
  },

  // Genres Section
  "genres.title": { es: "+60 GÉNEROS MUSICALES", en: "+60 MUSIC GENRES" },
  "genres.subtitle": {
    es: "De Cumbia Wepa a Afro House. Todo lo que necesitas en un solo lugar.",
    en: "From Cumbia Wepa to Afro House. Everything you need in one place.",
  },

  // Trust Section
  "trust.badge": { es: "Pagos 100% Seguros", en: "100% Secure Payments" },
  "trust.title": { es: "Miles de DJs", en: "Thousands of DJs" },
  "trust.titleHighlight": { es: "Confían en Nosotros", en: "Trust Us" },
  "trust.members": { es: "+1,500 miembros activos", en: "+1,500 active members" },
  "trust.group": { es: "DJs Satisfechos", en: "Satisfied DJs" },
  "trust.cancel": { es: "Cancela cuando quieras.", en: "Cancel anytime." },
  "trust.noContracts": { es: "Sin contratos ni letras chiquitas.", en: "No contracts or fine print." },

  // Pricing
  "pricing.badge": { es: "Precios Transparentes", en: "Transparent Pricing" },
  "pricing.title": { es: "ELIGE TU PLAN.", en: "CHOOSE YOUR PLAN." },
  "pricing.titleHighlight": { es: "EMPIEZA HOY.", en: "START TODAY." },
  "pricing.subtitle": {
    es: "Sin sorpresas. Sin cargos ocultos. Cancela cuando quieras.",
    en: "No surprises. No hidden fees. Cancel anytime.",
  },
  "pricing.monthly": { es: "MENSUAL PRO", en: "MONTHLY PRO" },
  "pricing.annual": { es: "ANUAL ELITE", en: "ANNUAL ELITE" },
  "pricing.monthlyPrice": { es: "USD / mes", en: "USD / month" },
  "pricing.annualPrice": { es: "USD / año", en: "USD / year" },
  "pricing.bestValue": { es: "🔥 MEJOR VALOR", en: "🔥 BEST VALUE" },
  "pricing.equivalent": { es: "Equivale a $16.25/mes", en: "Equivalent to $16.25/month" },
  "pricing.feat1": { es: "1TB Descargas mensuales", en: "1TB Monthly Downloads" },
  "pricing.feat2": { es: "Acceso FTP completo", en: "Full FTP Access" },
  "pricing.feat3": { es: "Updates Semanales", en: "Weekly Updates" },
  "pricing.feat4": { es: "2TB Descargas (Doble Velocidad)", en: "2TB Downloads (Double Speed)" },
  "pricing.feat5": { es: "Acceso FTP Prioritario", en: "Priority FTP Access" },
  "pricing.feat6": { es: "Soporte VIP por WhatsApp", en: "VIP WhatsApp Support" },
  "pricing.ctaMonthly": { es: "Elegir Plan Mensual", en: "Choose Monthly Plan" },
  "pricing.ctaAnnual": { es: "Quiero el Plan ELITE", en: "I Want ELITE Plan" },

  // Trust Bar
  "trustbar.title": { es: "NUESTRAS REGLAS DE ORO", en: "OUR GOLDEN RULES" },
  "trustbar.rule1.title": { es: "Organización Suprema", en: "Supreme Organization" },
  "trustbar.rule1.desc": { es: "Por género, BPM y año.", en: "By genre, BPM and year." },
  "trustbar.rule2.title": { es: "Calidad Profesional", en: "Professional Quality" },
  "trustbar.rule2.desc": { es: "MP3 320kbps + Video 1080p.", en: "MP3 320kbps + Video 1080p." },
  "trustbar.rule3.title": { es: "Archivos Clean", en: "Clean Files" },
  "trustbar.rule3.desc": { es: "Sin logos. Sin marcas.", en: "No logos. No watermarks." },

  // FAQ
  "faq.title": { es: "PREGUNTAS", en: "FREQUENTLY" },
  "faq.titleHighlight": { es: "FRECUENTES", en: "ASKED QUESTIONS" },

  // Final CTA
  "cta.title": { es: "¿LISTO PARA DEJAR DE BUSCAR", en: "READY TO STOP SEARCHING" },
  "cta.titleHighlight": { es: "EN 5 POOLS?", en: "ACROSS 5 POOLS?" },
  "cta.subtitle": { es: "Una sola suscripción. Todo el contenido que necesitas. Desde", en: "One subscription. All the content you need. From" },
  "cta.button": { es: "QUIERO MI ACCESO AHORA", en: "I WANT MY ACCESS NOW" },
  "cta.benefit1": { es: "Descarga masiva vía FTP (hasta 1TB/mes)", en: "Bulk download via FTP (up to 1TB/month)" },
  "cta.benefit2": { es: "Archivos Clean, listos para mezclar", en: "Clean files, ready to mix" },
  "cta.benefit3": { es: "Cancela cuando quieras, sin preguntas", en: "Cancel anytime, no questions asked" },
  "cta.benefit4": { es: "Updates semanales con lo más nuevo", en: "Weekly updates with the latest" },

  // Guarantee
  "guarantee.title": { es: "SIN CONTRATOS. SIN COMPROMISOS.", en: "NO CONTRACTS. NO COMMITMENTS." },
  "guarantee.desc": {
    es: "Cancela cuando quieras desde tu panel. Un clic y listo. Sin llamadas, sin emails, sin letras chiquitas.",
    en: "Cancel anytime from your dashboard. One click and done. No calls, no emails, no fine print.",
  },

  // Footer
  "footer.plans": { es: "Ver Planes", en: "See Plans" },
  "footer.main": { es: "Sitio Principal", en: "Main Site" },
  "footer.rights": { es: "Todos los derechos reservados.", en: "All rights reserved." },

  // Settings
  "settings.theme": { es: "Modo Claro", en: "Light Mode" },
  "settings.language": { es: "English", en: "Español" },

  // Mobile bar
  "mobile.ready": { es: "¿Listo para empezar?", en: "Ready to start?" },
  "mobile.cta": { es: "Ver Planes", en: "See Plans" },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vrp-language") as Language | null;
      return stored || "es";
    }
    return "es";
  });

  const toggleLanguage = () => {
    const newLang = language === "es" ? "en" : "es";
    setLanguage(newLang);
    localStorage.setItem("vrp-language", newLang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
