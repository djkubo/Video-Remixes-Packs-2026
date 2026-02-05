import { createContext, useContext, useState, ReactNode } from "react";

type Language = "es" | "en";

interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

// Centralized translations - Professional English copy
export const translations: Translations = {
  // Hero Section
  "hero.badge": {
    es: "ACCESO 100% DIGITAL & INMEDIATO",
    en: "100% DIGITAL • INSTANT ACCESS",
  },
  "hero.title": {
    es: "El Hub Definitivo del",
    en: "The Ultimate",
  },
  "hero.titleHighlight": {
    es: "DJ Latino",
    en: "Latin DJ Hub",
  },
  "hero.subtitle": {
    es: "Deja de pagar 4 membresías. Centralizamos los mejores pools en un solo lugar.",
    en: "Stop paying for 4 separate memberships. We aggregate the best pools into one destination.",
  },
  "hero.subtitleBold": {
    es: "1TB de Descarga Masiva vía FTP.",
    en: "1TB Bulk Downloads via FTP.",
  },
  "hero.cta": {
    es: "Ver Planes y Precios",
    en: "View Plans & Pricing",
  },
  "hero.stat1": { es: "Archivos Clean", en: "Clean Files" },
  "hero.stat2": { es: "Géneros", en: "Genres" },
  "hero.stat3": { es: "Descarga Mensual", en: "Monthly Download" },

  // Aggregator Section
  "aggregator.badge": { es: "MODELO AGREGADOR", en: "AGGREGATOR MODEL" },
  "aggregator.title": { es: "NOSOTROS PAGAMOS LOS POOLS", en: "WE PAY FOR THE POOLS" },
  "aggregator.titleHighlight": { es: "POR TI.", en: "SO YOU DON'T HAVE TO." },
  "aggregator.subtitle": {
    es: "No pagues 5 membresías. Paga solo una. Nosotros hacemos el trabajo sucio y te lo entregamos en bandeja de plata.",
    en: "Why pay for 5 memberships when you can pay for one? We do the heavy lifting and deliver everything ready to use.",
  },
  "aggregator.feat1.title": { es: "Pagamos los Pools", en: "We Pay for the Pools" },
  "aggregator.feat1.desc": {
    es: "Nosotros nos suscribimos a múltiples fuentes. Tú pagas solo una.",
    en: "We subscribe to multiple sources. You only pay once.",
  },
  "aggregator.feat2.title": { es: "Filtramos la Basura", en: "We Filter Out the Junk" },
  "aggregator.feat2.desc": {
    es: "Solo los éxitos. Cero relleno. Cero versiones inútiles.",
    en: "Only the hits. No filler. No useless remixes.",
  },
  "aggregator.feat3.title": { es: "Corregimos los Tags", en: "We Fix the Metadata" },
  "aggregator.feat3.desc": {
    es: "Metadata perfecta: Artista, Título, BPM, Género.",
    en: "Perfect tags: Artist, Title, BPM, Genre.",
  },
  "aggregator.feat4.title": { es: "Entrega Limpia", en: "Clean Delivery" },
  "aggregator.feat4.desc": {
    es: "Sin logos, sin marcas de agua. Archivos profesionales.",
    en: "No pool logos, no watermarks. Professional files.",
  },

  // DJ Todoterreno
  "dj.title": { es: "PARA EL DJ QUE", en: "FOR THE DJ WHO" },
  "dj.titleHighlight": { es: "TOCA DE TODO.", en: "PLAYS EVERYTHING." },
  "dj.question": {
    es: "¿Te piden",
    en: "Crowd requests",
  },
  "dj.covered": { es: "Lo tenemos cubierto.", en: "We've got you covered." },
  "dj.never": {
    es: 'Nunca más digas "no la tengo".',
    en: 'Never say "I don\'t have that track" again.',
  },
  "dj.from": {
    es: "Desde Cumbia Lagunera hasta Reggaeton Old School.",
    en: "From Regional Mexican to Old School Reggaeton and everything in between.",
  },

  // Speed Section
  "speed.badge": { es: "SINCRONIZACIÓN MASIVA", en: "BULK SYNC" },
  "speed.title1": { es: "DESCARGA", en: "DOWNLOAD" },
  "speed.title2": { es: "1TB EN MINUTOS", en: "1TB IN MINUTES" },
  "speed.title3": { es: "CON FTP.", en: "VIA FTP." },
  "speed.subtitle": {
    es: "Conecta FileZilla o Air Explorer. Sincroniza tu librería completa mientras duermes.",
    en: "Connect FileZilla or Air Explorer. Sync your entire library overnight.",
  },
  "speed.ftpTitle": { es: "Conexión FTP Directa", en: "Direct FTP Connection" },
  "speed.ftpDesc": { es: "Arrastra, suelta y sincroniza. Así de fácil.", en: "Drag, drop, and sync. It's that simple." },
  "speed.feat1.title": { es: "Servidores Premium", en: "Premium Servers" },
  "speed.feat1.desc": { es: "Alta velocidad sin throttling", en: "High-speed, no throttling" },
  "speed.feat2.title": { es: "Air Explorer", en: "Air Explorer Ready" },
  "speed.feat2.desc": { es: "Sincroniza con tu nube", en: "Sync directly to your cloud" },
  "speed.feat3.title": { es: "Sin Límites", en: "Unlimited Downloads" },
  "speed.feat3.desc": { es: "Descarga masiva. Sin caps.", en: "Bulk download. No caps." },
  "speed.feat4.title": { es: "Mientras Duermes", en: "Overnight Sync" },
  "speed.feat4.desc": { es: "Programa y despierta listo", en: "Schedule it and wake up ready" },

  // Premium Features
  "premium.badge": { es: "Tecnología Premium", en: "Premium Technology" },
  "premium.title": { es: "Herramientas", en: "Professional" },
  "premium.titleHighlight": { es: "Profesionales", en: "Tools" },
  "premium.subtitle": { es: "Diseñadas para DJs que valoran su tiempo.", en: "Built for DJs who value their time." },
  "premium.feat1.title": { es: "Descarga Masiva FTP", en: "FTP Bulk Download" },
  "premium.feat1.desc": {
    es: "Conecta Air Explorer o FileZilla. Baja todo de golpe mientras duermes.",
    en: "Connect Air Explorer or FileZilla. Download everything overnight while you sleep.",
  },
  "premium.feat2.title": { es: "Organización Perfecta", en: "Perfect Organization" },
  "premium.feat2.desc": {
    es: "Todo etiquetado por género, BPM y año. Cero carpetas basura.",
    en: "Everything tagged by genre, BPM, and year. No messy folders.",
  },
  "premium.feat3.title": { es: "Calidad Garantizada", en: "Guaranteed Quality" },
  "premium.feat3.desc": {
    es: "MP3 320kbps + Video 1080p. Si no sirve para tocar, no lo subimos.",
    en: "MP3 320kbps + 1080p Video. If it's not gig-ready, we don't upload it.",
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
  "trust.group": { es: "DJs Satisfechos", en: "Happy DJs" },
  "trust.cancel": { es: "Cancela cuando quieras.", en: "Cancel anytime." },
  "trust.noContracts": { es: "Sin contratos ni letras chiquitas.", en: "No contracts. No hidden fees." },

  // Testimonials - TrustSecuritySection (WhatsApp style)
  "testimonial1.message": {
    es: "Bro, me salvaste el evento, la calidad está increíble. 🔥",
    en: "Man, you saved my gig! The quality is incredible. 🔥",
  },
  "testimonial1.name": { es: "DJ Carlos", en: "DJ Carlos" },
  "testimonial2.message": {
    es: "Al fin un pool que tiene cumbias y wepas bien organizados. 🙌",
    en: "Finally a pool with proper Latin music organization. 🙌",
  },
  "testimonial2.name": { es: "DJ Memo", en: "DJ Memo" },
  "testimonial3.message": {
    es: "Descargué 200GB en una noche con Air Explorer. Esto es otro nivel. 💪",
    en: "Downloaded 200GB overnight with Air Explorer. This is next level. 💪",
  },
  "testimonial3.name": { es: "DJ Andrés", en: "DJ Andrés" },

  // Testimonials - TestimonialsSection (Cards)
  "testimonialCard.title": { es: "LO QUE DICEN LOS DJS", en: "WHAT DJS ARE SAYING" },
  "testimonialCard.subtitle": {
    es: "Profesionales que ya transformaron su flujo de trabajo",
    en: "Professionals who transformed their workflow",
  },
  "testimonialCard1.text": {
    es: "Bro, la organización por BPM me salvó la vida en la boda de ayer. Calidad impecable.",
    en: "The BPM organization saved me at yesterday's wedding. Flawless quality.",
  },
  "testimonialCard1.name": { es: "DJ Alex Mix", en: "DJ Alex Mix" },
  "testimonialCard1.location": { es: "Miami", en: "Miami" },
  "testimonialCard2.text": {
    es: "He probado 5 pools y este es el único que descargas 1TB real sin errores. Air Explorer vuela.",
    en: "I've tried 5 pools and this is the only one where I can download 1TB without errors. Air Explorer flies.",
  },
  "testimonialCard2.name": { es: "Carlos DJ", en: "Carlos DJ" },
  "testimonialCard2.location": { es: "CDMX", en: "Mexico City" },
  "testimonialCard3.text": {
    es: "Los videos intro/outro vienen limpios sin logos. Mis pantallas se ven pro. 10/10.",
    en: "The intro/outro videos come clean without logos. My screens look pro. 10/10.",
  },
  "testimonialCard3.name": { es: "DJ Tona", en: "DJ Tona" },
  "testimonialCard3.location": { es: "Residente", en: "Resident DJ" },

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
  "pricing.equivalent": { es: "Equivale a", en: "Only" },
  "pricing.perMonth": { es: "/mes", en: "/month" },
  "pricing.feat1": { es: "1TB Descargas mensuales", en: "1TB Monthly Downloads" },
  "pricing.feat2": { es: "Acceso FTP completo", en: "Full FTP Access" },
  "pricing.feat3": { es: "Updates Semanales", en: "Weekly Updates" },
  "pricing.feat4": { es: "2TB Descargas (Doble Velocidad)", en: "2TB Downloads (Double Speed)" },
  "pricing.feat5": { es: "Acceso FTP Prioritario", en: "Priority FTP Access" },
  "pricing.feat6": { es: "Soporte VIP por WhatsApp", en: "VIP WhatsApp Support" },
  "pricing.ctaMonthly": { es: "Elegir Plan Mensual", en: "Choose Monthly Plan" },
  "pricing.ctaAnnual": { es: "Quiero el Plan ELITE", en: "Get ELITE Plan" },
  "pricing.currencyNote": {
    es: "Precios mostrados en",
    en: "Prices shown in",
  },
  "pricing.currencyNoteSuffix": {
    es: "El cargo final será en USD.",
    en: "Final charge will be in USD.",
  },

  // Trust Bar
  "trustbar.title": { es: "NUESTRAS REGLAS DE ORO", en: "OUR GOLDEN RULES" },
  "trustbar.rule1.title": { es: "Organización Suprema", en: "Supreme Organization" },
  "trustbar.rule1.desc": { es: "Por género, BPM y año.", en: "By genre, BPM, and year." },
  "trustbar.rule2.title": { es: "Calidad Profesional", en: "Professional Quality" },
  "trustbar.rule2.desc": { es: "MP3 320kbps + Video 1080p.", en: "MP3 320kbps + 1080p Video." },
  "trustbar.rule3.title": { es: "Archivos Clean", en: "Clean Files" },
  "trustbar.rule3.desc": { es: "Sin logos. Sin marcas.", en: "No logos. No watermarks." },

  // FAQ
  "faq.title": { es: "PREGUNTAS", en: "FREQUENTLY ASKED" },
  "faq.titleHighlight": { es: "FRECUENTES", en: "QUESTIONS" },
  "faq.subtitle": {
    es: "Todo lo que necesitas saber antes de empezar",
    en: "Everything you need to know before getting started",
  },
  "faq1.question": {
    es: "¿Qué diferencia a VideoRemixesPacks de otros pools?",
    en: "What makes VideoRemixesPacks different from other pools?",
  },
  "faq1.answer": {
    es: "Somos un agregador. Nosotros pagamos las membresías de múltiples pools, filtramos el contenido, corregimos los tags y te lo entregamos limpio en un solo lugar. Tú pagas una sola suscripción y accedes a todo.",
    en: "We're an aggregator. We pay for multiple pool memberships, filter the content, fix the metadata, and deliver it clean in one place. You pay one subscription and get access to everything.",
  },
  "faq2.question": {
    es: "¿Cómo funciona la descarga masiva?",
    en: "How does bulk downloading work?",
  },
  "faq2.answer": {
    es: "Te damos acceso FTP directo. Conectas FileZilla o Air Explorer, seleccionas las carpetas que quieres y descargas todo de golpe. Puedes sincronizar hasta 1TB mensual mientras duermes.",
    en: "We give you direct FTP access. Connect FileZilla or Air Explorer, select the folders you want, and download everything at once. You can sync up to 1TB monthly while you sleep.",
  },
  "faq3.question": {
    es: "¿La música tiene sellos o voces de otros pools?",
    en: "Do the files have pool logos or voice tags?",
  },
  "faq3.answer": {
    es: "No. Todo es Clean/Intro-Outro listo para mezclar. Sin logos de otros pools, sin marcas de agua. Archivos profesionales listos para tu set.",
    en: "No. Everything is Clean/Intro-Outro ready to mix. No pool logos, no watermarks. Professional files ready for your set.",
  },
  "faq4.question": {
    es: "¿Funciona con Serato/VirtualDJ/Rekordbox?",
    en: "Does it work with Serato/VirtualDJ/Rekordbox?",
  },
  "faq4.answer": {
    es: "Sí, son archivos MP3 320kbps y MP4 1080p universales. Compatibles con cualquier software de DJ: Serato, VirtualDJ, Rekordbox, Traktor.",
    en: "Yes, these are standard MP3 320kbps and MP4 1080p files. Compatible with any DJ software: Serato, VirtualDJ, Rekordbox, Traktor.",
  },
  "faq5.question": {
    es: "¿Puedo cancelar cuando quiera?",
    en: "Can I cancel anytime?",
  },
  "faq5.answer": {
    es: "Sí. Sin contratos forzosos, sin letras chiquitas. Cancelas desde tu panel con un clic y listo. No hay permanencia mínima.",
    en: "Yes. No forced contracts, no fine print. Cancel from your dashboard with one click. No minimum commitment.",
  },

  // Final CTA
  "cta.title": { es: "¿LISTO PARA DEJAR DE BUSCAR", en: "READY TO STOP HUNTING" },
  "cta.titleHighlight": { es: "EN 5 POOLS?", en: "ACROSS 5 POOLS?" },
  "cta.subtitle": { es: "Una sola suscripción. Todo el contenido que necesitas. Desde", en: "One subscription. All the content you need. Starting at" },
  "cta.subtitleSimple": { es: "Una sola suscripción. Todo el contenido que necesitas.", en: "One subscription. All the content you need." },
  "cta.button": { es: "Ver Planes", en: "View Plans" },
  "cta.benefit1": { es: "Descarga masiva vía FTP (hasta 1TB/mes)", en: "Bulk download via FTP (up to 1TB/month)" },
  "cta.benefit2": { es: "Archivos Clean, listos para mezclar", en: "Clean files, ready to mix" },
  "cta.benefit3": { es: "Cancela cuando quieras, sin preguntas", en: "Cancel anytime, no questions asked" },
  "cta.benefit4": { es: "Updates semanales con lo más nuevo", en: "Weekly updates with the latest tracks" },
  "cta.support": { es: "SOPORTE INCLUIDO", en: "SUPPORT INCLUDED" },
  "cta.perMonth": { es: "/mes", en: "/mo" },

  // Guarantee
  "guarantee.title": { es: "SIN CONTRATOS. SIN COMPROMISOS.", en: "NO CONTRACTS. NO COMMITMENTS." },
  "guarantee.desc": {
    es: "Cancela cuando quieras desde tu panel. Un clic y listo. Sin llamadas, sin emails, sin letras chiquitas.",
    en: "Cancel anytime from your dashboard. One click and you're done. No calls, no emails, no fine print.",
  },

  // Footer
  "footer.plans": { es: "Ver Planes", en: "View Plans" },
  "footer.main": { es: "Sitio Principal", en: "Main Site" },
  "footer.rights": { es: "Todos los derechos reservados.", en: "All rights reserved." },

  // Settings
  "settings.theme": { es: "Modo Claro", en: "Light Mode" },
  "settings.language": { es: "English", en: "Español" },

  // Mobile bar
  "mobile.ready": { es: "¿Listo para empezar?", en: "Ready to get started?" },
  "mobile.cta": { es: "Ver Planes", en: "View Plans" },

  // Music Explorer
  "explorer.title": { es: "TRANSPARENCIA TOTAL:", en: "FULL TRANSPARENCY:" },
  "explorer.titleHighlight": { es: "Mira lo que hay dentro antes de pagar", en: "See What's Inside Before You Pay" },
  "explorer.subtitle": {
    es: "Busca cualquier artista, escucha el preview y comprueba la calidad antes de suscribirte.",
    en: "Search any artist, preview the quality, and verify before subscribing.",
  },
  "explorer.search": { es: "Buscar artista, título o género...", en: "Search artist, title, or genre..." },
  "explorer.noResults": { es: "No se encontraron resultados para", en: "No results found for" },
  "explorer.showing": { es: "Mostrando", en: "Showing" },
  "explorer.of": { es: "de", en: "of" },
  "explorer.tracks": { es: "archivos disponibles", en: "available files" },
  "explorer.modalTitle": { es: "Archivo Exclusivo para Miembros PRO", en: "PRO Members Only" },
  "explorer.modalDesc": {
    es: "Activa tu cuenta hoy para descargar este archivo y 1TB más a máxima velocidad.",
    en: "Activate your account today to download this file and 1TB more at full speed.",
  },
  "explorer.modalCta": { es: "Activar Cuenta Ahora", en: "Activate Account Now" },
  "explorer.modalClose": { es: "Seguir explorando gratis", en: "Continue browsing free" },

  // Admin Dashboard
  "admin.dashboard.title": { es: "Dashboard de Analítica", en: "Analytics Dashboard" },
  "admin.dashboard.subtitle": { es: "Métricas de tráfico y conversiones", en: "Traffic and conversion metrics" },
  "admin.dashboard.last7days": { es: "Últimos 7 días", en: "Last 7 days" },
  "admin.dashboard.last14days": { es: "Últimos 14 días", en: "Last 14 days" },
  "admin.dashboard.last30days": { es: "Últimos 30 días", en: "Last 30 days" },
  "admin.dashboard.last90days": { es: "Últimos 90 días", en: "Last 90 days" },
  "admin.dashboard.tabOverview": { es: "Resumen", en: "Overview" },
  "admin.dashboard.tabSources": { es: "Fuentes", en: "Sources" },
  "admin.dashboard.tabLeads": { es: "Leads", en: "Leads" },
  "admin.dashboard.tabEvents": { es: "Eventos", en: "Events" },
  "admin.dashboard.uniqueVisitors": { es: "Visitantes Únicos", en: "Unique Visitors" },
  "admin.dashboard.pageViews": { es: "Páginas Vistas", en: "Page Views" },
  "admin.dashboard.ctaClicks": { es: "Clics en CTAs", en: "CTA Clicks" },
  "admin.dashboard.conversionRate": { es: "Tasa de Conversión", en: "Conversion Rate" },
  "admin.dashboard.trafficTrend": { es: "Tendencia de Tráfico", en: "Traffic Trend" },
  "admin.dashboard.eventsByType": { es: "Eventos por Tipo", en: "Events by Type" },
  "admin.dashboard.visitorsByCountry": { es: "Visitantes por País", en: "Visitors by Country" },
  "admin.dashboard.engagementMetrics": { es: "Métricas de Engagement", en: "Engagement Metrics" },
  "admin.dashboard.avgScroll": { es: "Scroll Promedio", en: "Average Scroll" },
  "admin.dashboard.avgTime": { es: "Tiempo Promedio", en: "Average Time" },
  "admin.dashboard.totalSessions": { es: "sesiones totales", en: "total sessions" },
  "admin.dashboard.capturedLeads": { es: "Leads Capturados", en: "Captured Leads" },
  "admin.dashboard.trafficSources": { es: "Fuentes de Tráfico", en: "Traffic Sources" },
  "admin.dashboard.mediums": { es: "Medios", en: "Mediums" },
  "admin.dashboard.campaigns": { es: "Campañas", en: "Campaigns" },
  "admin.dashboard.noSourceData": { es: "Sin datos de fuentes", en: "No source data" },
  "admin.dashboard.noCampaigns": { es: "Sin campañas activas. Usa utm_campaign en tus enlaces.", en: "No active campaigns. Use utm_campaign in your links." },
  "admin.dashboard.utmGuideTitle": { es: "Cómo usar parámetros UTM", en: "How to use UTM parameters" },
  "admin.dashboard.utmGuideDesc": { es: "Agrega estos parámetros a tus enlaces para rastrear de dónde viene el tráfico:", en: "Add these parameters to your links to track where traffic comes from:" },
  "admin.dashboard.utmSource": { es: "Origen: whatsapp, instagram, tiktok, email, facebook", en: "Source: whatsapp, instagram, tiktok, email, facebook" },
  "admin.dashboard.utmMedium": { es: "Medio: social, paid, email, messaging, organic", en: "Medium: social, paid, email, messaging, organic" },
  "admin.dashboard.utmCampaign": { es: "Nombre de campaña: lanzamiento, promo_navidad, etc.", en: "Campaign name: launch, holiday_promo, etc." },
  "admin.dashboard.leadsInPeriod": { es: "leads en el período seleccionado", en: "leads in selected period" },
  "admin.dashboard.exportCSV": { es: "Exportar CSV", en: "Export CSV" },
  "admin.dashboard.loading": { es: "Cargando...", en: "Loading..." },
  "admin.dashboard.noLeads": { es: "No hay leads en este período", en: "No leads in this period" },
  "admin.dashboard.allEvents": { es: "Todos los Eventos", en: "All Events" },
  "admin.dashboard.visitors": { es: "Visitantes", en: "Visitors" },
  "admin.dashboard.name": { es: "Nombre", en: "Name" },
  "admin.dashboard.email": { es: "Email", en: "Email" },
  "admin.dashboard.phone": { es: "Teléfono", en: "Phone" },
  "admin.dashboard.country": { es: "País", en: "Country" },
  "admin.dashboard.source": { es: "Fuente", en: "Source" },
  "admin.dashboard.date": { es: "Fecha", en: "Date" },
  "admin.dashboard.yes": { es: "Sí", en: "Yes" },
  "admin.dashboard.no": { es: "No", en: "No" },

  // Admin Music
  "admin.music.title": { es: "Gestión de Música", en: "Music Management" },
  "admin.music.home": { es: "Inicio", en: "Home" },
  "admin.music.dashboard": { es: "Dashboard", en: "Dashboard" },
  "admin.music.logout": { es: "Salir", en: "Logout" },
  "admin.music.newFolder": { es: "Nueva Carpeta", en: "New Folder" },
  "admin.music.uploadFiles": { es: "Subir Archivos", en: "Upload Files" },
  "admin.music.bulkImport": { es: "Importar Carpetas", en: "Import Folders" },
  "admin.music.deleteSelected": { es: "Eliminar Seleccionados", en: "Delete Selected" },
  "admin.music.cleanAll": { es: "Limpiar Todo", en: "Clean All" },
  "admin.music.folders": { es: "Carpetas", en: "Folders" },
  "admin.music.tracks": { es: "Tracks", en: "Tracks" },
  "admin.music.selectAll": { es: "Seleccionar Todo", en: "Select All" },
  "admin.music.noFolders": { es: "No hay carpetas", en: "No folders" },
  "admin.music.noTracks": { es: "No hay tracks", en: "No tracks" },
  "admin.music.createFolder": { es: "Crear Carpeta", en: "Create Folder" },
  "admin.music.folderName": { es: "Nombre de la carpeta", en: "Folder name" },
  "admin.music.cancel": { es: "Cancelar", en: "Cancel" },
  "admin.music.create": { es: "Crear", en: "Create" },
  "admin.music.uploadTracks": { es: "Subir Tracks", en: "Upload Tracks" },
  "admin.music.selectFiles": { es: "Seleccionar archivos MP3", en: "Select MP3 files" },
  "admin.music.upload": { es: "Subir", en: "Upload" },
  "admin.music.bulkUploadTitle": { es: "Importación Masiva de Carpetas", en: "Bulk Folder Import" },
  "admin.music.bulkUploadDesc": { es: "Selecciona múltiples carpetas con archivos MP3. El nombre de cada carpeta se usará como género.", en: "Select multiple folders with MP3 files. Each folder name will be used as genre." },
  "admin.music.selectFolders": { es: "Seleccionar Carpetas", en: "Select Folders" },
  "admin.music.import": { es: "Importar", en: "Import" },
  "admin.music.editTrack": { es: "Editar Track", en: "Edit Track" },
  "admin.music.trackTitle": { es: "Título", en: "Title" },
  "admin.music.artist": { es: "Artista", en: "Artist" },
  "admin.music.genre": { es: "Género", en: "Genre" },
  "admin.music.bpm": { es: "BPM", en: "BPM" },
  "admin.music.visible": { es: "Visible", en: "Visible" },
  "admin.music.save": { es: "Guardar", en: "Save" },
  "admin.music.confirmDelete": { es: "Confirmar Eliminación", en: "Confirm Delete" },
  "admin.music.deleteConfirmMsg": { es: "¿Estás seguro de que quieres eliminar", en: "Are you sure you want to delete" },
  "admin.music.delete": { es: "Eliminar", en: "Delete" },
  "admin.music.bulkDeleteTitle": { es: "Eliminar Seleccionados", en: "Delete Selected" },
  "admin.music.bulkDeleteMsg": { es: "¿Estás seguro de que quieres eliminar los elementos seleccionados?", en: "Are you sure you want to delete the selected items?" },
  "admin.music.cleanAllTitle": { es: "Limpiar Todo", en: "Clean All" },
  "admin.music.cleanAllMsg": { es: "¿Estás seguro de que quieres eliminar TODOS los tracks y carpetas? Esta acción no se puede deshacer.", en: "Are you sure you want to delete ALL tracks and folders? This action cannot be undone." },
  "admin.music.deleting": { es: "Eliminando...", en: "Deleting..." },
  "admin.music.folderCreated": { es: "Carpeta creada", en: "Folder created" },
  "admin.music.trackUpdated": { es: "Track actualizado", en: "Track updated" },
  "admin.music.deletedSuccess": { es: "Eliminado correctamente", en: "Deleted successfully" },
  "admin.music.orderUpdated": { es: "Orden actualizado", en: "Order updated" },
  "admin.music.errorLoad": { es: "No se pudo cargar el contenido", en: "Could not load content" },
  "admin.music.errorCreate": { es: "No se pudo crear la carpeta", en: "Could not create folder" },
  "admin.music.errorUpdate": { es: "No se pudo actualizar", en: "Could not update" },
  "admin.music.errorDelete": { es: "No se pudo eliminar", en: "Could not delete" },
  "admin.music.errorUpload": { es: "Error durante la subida", en: "Error during upload" },
  "admin.music.uploading": { es: "Subiendo...", en: "Uploading..." },
  "admin.music.processing": { es: "Procesando...", en: "Processing..." },
  "admin.music.analyzingFiles": { es: "Analizando archivos...", en: "Analyzing files..." },
  "admin.music.creatingFolders": { es: "Creando carpetas...", en: "Creating folders..." },
  "admin.music.filesUploaded": { es: "archivos subidos", en: "files uploaded" },
  "admin.music.filesFailed": { es: "archivos fallaron", en: "files failed" },
  "admin.music.foldersFailed": { es: "carpetas fallaron", en: "folders failed" },
  "admin.music.importComplete": { es: "Importación completa", en: "Import complete" },
  "admin.music.importWithErrors": { es: "Importación con errores", en: "Import with errors" },
  "admin.music.importError": { es: "Error de importación", en: "Import error" },
  "admin.music.importErrorDescription": { es: "Error durante la importación", en: "Error during import" },
  "admin.music.uploadedFilesPreserved": { es: "Los archivos subidos se conservaron", en: "Uploaded files were preserved" },
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
