import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Download,
  Headphones,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Usb,
  Zap,
} from "lucide-react";

import logoDark from "@/assets/logo-dark.png";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataLayer } from "@/hooks/useDataLayer";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { useAnalytics } from "@/hooks/useAnalytics";
import { isExperimentEnabled } from "@/lib/croFlags";
import { getExperimentAssignment } from "@/lib/experiments";
import {
  extractBpm,
  extractGenreFromPath,
  fetchLastWeeks,
  formatDuration,
  type ProductionFile,
} from "@/lib/productionApi";

type CatalogTrack = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: string;
  bpm: number | null;
};

type PlanCard = {
  key: string;
  title: string;
  price: string;
  subtitle: string;
  bullets: string[];
  to: string;
  cta: string;
  ctaId: string;
  planId: string | null;
  highlighted?: boolean;
};

function mapFileToTrack(file: ProductionFile, index: number): CatalogTrack {
  const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
  const title = file.title?.trim() || cleanTitle;
  const artistFromName = file.name.includes(" - ") ? file.name.split(" - ")[0]?.trim() : "";
  const artist = file.artist?.trim() || artistFromName || "VideoRemixesPack";
  const genreFromList = file.genre?.[0]?.trim();
  const genre = genreFromList || extractGenreFromPath(file.path) || "General";

  return {
    id: file.id || `${title}-${index}`,
    title,
    artist,
    genre,
    duration: formatDuration(file.duration),
    bpm: extractBpm(file.name) ?? extractBpm(file.title),
  };
}

const Index = () => {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { trackClick } = useDataLayer();
  const isSpanish = language === "es";

  useEngagementTracking();

  const heroAssignment = useMemo(
    () =>
      isExperimentEnabled("home_hero_cta")
        ? getExperimentAssignment("home_hero_cta")
        : {
            id: "home_hero_cta" as const,
            variant: "A" as const,
            assignedAt: new Date(0).toISOString(),
          },
    []
  );

  const socialAssignment = useMemo(
    () =>
      isExperimentEnabled("social_proof_position")
        ? getExperimentAssignment("social_proof_position")
        : {
            id: "social_proof_position" as const,
            variant: "A" as const,
            assignedAt: new Date(0).toISOString(),
          },
    []
  );

  useEffect(() => {
    trackEvent("experiment_exposure", {
      funnel_step: "home",
      experiment_assignments: [heroAssignment, socialAssignment],
    });
  }, [heroAssignment, socialAssignment, trackEvent]);

  const primaryCta =
    heroAssignment.variant === "A"
      ? {
          label: isSpanish ? "Ver planes" : "View plans",
          to: "/plan",
          ctaId: "hero_ver_planes",
          planId: "plan_2tb_anual",
          icon: Zap,
        }
      : {
          label: isSpanish ? "Escuchar demos" : "Listen demos",
          to: "/explorer",
          ctaId: "hero_escuchar_demos_primary",
          planId: null,
          icon: PlayCircle,
        };

  const secondaryCta =
    heroAssignment.variant === "A"
      ? {
          label: isSpanish ? "Explorar catálogo" : "Explore catalog",
          to: "/explorer",
          ctaId: "hero_explorar_catalogo",
          planId: null,
          icon: Headphones,
        }
      : {
          label: isSpanish ? "Ver membresía" : "View membership",
          to: "/plan",
          ctaId: "hero_ver_membresia_secondary",
          planId: "plan_2tb_anual",
          icon: Zap,
        };

  const [catalogTracks, setCatalogTracks] = useState<CatalogTrack[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");

  useEffect(() => {
    const controller = new AbortController();

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);

      try {
        const weeks = await fetchLastWeeks(controller.signal);
        const files = weeks.flatMap((week) => week.files || []);
        const mapped = files.map((file, index) => mapFileToTrack(file, index));
        const unique = Array.from(new Map(mapped.map((track) => [track.id, track])).values());
        setCatalogTracks(unique.slice(0, 24));
      } catch {
        setCatalogError(
          isSpanish
            ? "No se pudo cargar el preview en vivo en este momento."
            : "Could not load the live preview right now."
        );
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
    return () => controller.abort();
  }, [isSpanish]);

  const genres = useMemo(() => {
    const set = new Set<string>(catalogTracks.map((track) => track.genre));
    return ["all", ...Array.from(set).slice(0, 9)];
  }, [catalogTracks]);

  const visibleTracks = useMemo(() => {
    if (selectedGenre === "all") return catalogTracks.slice(0, 10);
    return catalogTracks.filter((track) => track.genre === selectedGenre).slice(0, 10);
  }, [catalogTracks, selectedGenre]);

  const plans: PlanCard[] = isSpanish
    ? [
        {
          key: "pack",
          title: "Pack Individual",
          price: "$35 USD",
          subtitle: "Pago único · 3,000 canciones",
          bullets: [
            "Ideal para probar antes de escalar",
            "Descarga digital inmediata",
            "Escucha demos antes de comprar",
          ],
          to: "/explorer",
          cta: "Escuchar demos",
          ctaId: "pricing_pack_demos",
          planId: null,
        },
        {
          key: "membresia",
          title: "Membresía 2TB",
          price: "$19.50/mes · $195/año",
          subtitle: "Actualización semanal + comunidad",
          bullets: [
            "Catálogo en expansión continua",
            "Soporte en español por WhatsApp",
            "Sin permanencia forzosa",
          ],
          to: "/membresia",
          cta: "Ver membresía",
          ctaId: "pricing_membresia",
          planId: "plan_2tb_anual",
          highlighted: true,
        },
        {
          key: "usb",
          title: "USB Física",
          price: "$147 USD",
          subtitle: "10,000 canciones · envío USA",
          bullets: [
            "Conecta y mezcla sin complicaciones",
            "Compatible con Serato / VDJ / Rekordbox",
            "Pago con tarjeta, PayPal y cuotas",
          ],
          to: "/usb128",
          cta: "Ver USB",
          ctaId: "pricing_usb",
          planId: null,
        },
      ]
    : [
        {
          key: "pack",
          title: "Single Pack",
          price: "$35 USD",
          subtitle: "One-time payment · 3,000 tracks",
          bullets: [
            "Best to validate before upgrading",
            "Instant digital download",
            "Listen to demos before buying",
          ],
          to: "/explorer",
          cta: "Listen to demos",
          ctaId: "pricing_pack_demos",
          planId: null,
        },
        {
          key: "membresia",
          title: "2TB Membership",
          price: "$19.50/mo · $195/year",
          subtitle: "Weekly updates + community",
          bullets: [
            "Continuously updated catalog",
            "Spanish support on WhatsApp",
            "No forced commitment",
          ],
          to: "/membresia",
          cta: "View membership",
          ctaId: "pricing_membresia",
          planId: "plan_2tb_anual",
          highlighted: true,
        },
        {
          key: "usb",
          title: "Physical USB",
          price: "$147 USD",
          subtitle: "10,000 tracks · US shipping",
          bullets: [
            "Plug and mix with no setup friction",
            "Compatible with Serato / VDJ / Rekordbox",
            "Card, PayPal and installments",
          ],
          to: "/usb128",
          cta: "View USB",
          ctaId: "pricing_usb",
          planId: null,
        },
      ];

  const faqs = isSpanish
    ? [
        {
          q: "¿Puedo cancelar cuando quiera?",
          a: "Sí. No hay permanencia mínima y puedes cancelar en cualquier momento.",
        },
        {
          q: "¿Puedo escuchar demos antes de pagar?",
          a: "Sí. Puedes validar calidad y géneros desde el explorador antes de elegir plan.",
        },
        {
          q: "¿Funciona con Serato, VirtualDJ y Rekordbox?",
          a: "Sí. Los archivos son compatibles y vienen listos para mezclar.",
        },
        {
          q: "¿Qué soporte recibo?",
          a: "Soporte humano en español por WhatsApp para acceso, descargas y dudas técnicas.",
        },
      ]
    : [
        {
          q: "Can I cancel anytime?",
          a: "Yes. There is no minimum commitment and you can cancel anytime.",
        },
        {
          q: "Can I listen to demos before paying?",
          a: "Yes. You can validate quality and genres in the explorer before choosing a plan.",
        },
        {
          q: "Does it work with Serato, VirtualDJ and Rekordbox?",
          a: "Yes. Files are compatible and delivered ready to mix.",
        },
        {
          q: "What support do I get?",
          a: "Human support in Spanish via WhatsApp for access, downloads and technical questions.",
        },
      ];

  const showSocialProofEarly = socialAssignment.variant === "A";

  const handleCta = (label: string, ctaId: string, section: string, planId: string | null, to: string) => {
    trackClick(label);
    trackEvent("click", {
      button_text: label,
      cta_id: ctaId,
      section,
      plan_id: planId,
      destination: to,
      funnel_step: "home",
      experiment_assignments: [heroAssignment, socialAssignment],
    });
  };

  const SocialProof = (
    <section className="px-4 py-10 md:py-14">
      <div className="container mx-auto max-w-6xl">
        <div className="rounded-[28px] border border-[#242424] bg-[#111111] p-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#e10613] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#ff2a2a]">
                <Sparkles className="h-3.5 w-3.5" />
                {isSpanish ? "Prueba social real" : "Real social proof"}
              </p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight md:text-4xl">
                {isSpanish ? "DJs reales, resultados medibles" : "Real DJs, measurable results"}
              </h2>
              <p className="mt-2 text-sm text-white/75 md:text-base">
                {isSpanish
                  ? "Comunidad activa con compras recurrentes y uso diario del catálogo."
                  : "Active community with repeat purchases and daily catalog usage."}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "7,000+", label: isSpanish ? "DJs" : "DJs" },
                { value: "4.9/5", label: isSpanish ? "Soporte" : "Support" },
                { value: "50K+", label: isSpanish ? "Tracks" : "Tracks" },
              ].map((item) => (
                <div key={item.value} className="rounded-xl border border-[#2f2f2f] bg-[#181818] px-3 py-3 text-center">
                  <p className="font-display text-2xl font-black text-[#e10613]">{item.value}</p>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#e10613] focus:px-4 focus:py-2 focus:text-white"
      >
        {isSpanish ? "Saltar al contenido" : "Skip to content"}
      </a>

      <main id="main-content" className="relative isolate min-h-screen overflow-hidden bg-[#fafafa] pb-24 md:pb-0">
        <section className="relative overflow-hidden border-b border-[#780008] bg-gradient-to-br from-[#2d0003] via-[#e10613] to-[#740009] px-4 pb-16 pt-12 text-white md:pb-20 md:pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(0,0,0,0.25),transparent_38%)]" />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/95">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isSpanish ? "DJs latinos USA · actualizado semanal" : "US latin DJs · weekly updates"}
                </p>
                <h1 className="mt-4 max-w-xl font-display text-5xl font-black leading-[0.95] md:text-6xl">
                  {isSpanish ? "Tu música lista para tocar" : "Your music ready to perform"}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                  {isSpanish
                    ? "Un solo lugar para demos, catálogo y membresía. Menos tiempo buscando, más tiempo facturando."
                    : "One place for demos, catalog and membership. Less time searching, more paid gigs."}
                </p>

                <ul className="mt-6 space-y-2.5 text-sm md:text-base">
                  {[
                    isSpanish ? "Audio y video organizados por género" : "Audio and video organized by genre",
                    isSpanish
                      ? "Compatible con Serato, Rekordbox y VirtualDJ"
                      : "Compatible with Serato, Rekordbox and VirtualDJ",
                    isSpanish ? "Soporte real en español por WhatsApp" : "Real Spanish support on WhatsApp",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-white/95">
                      <Check className="mt-0.5 h-4.5 w-4.5 text-white" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="h-12 bg-white px-6 text-sm font-black text-[#e10613] hover:bg-white/92 md:text-base"
                    onClick={() =>
                      handleCta(primaryCta.label, primaryCta.ctaId, "hero", primaryCta.planId, primaryCta.to)
                    }
                  >
                    <Link to={primaryCta.to}>
                      <primaryCta.icon className="h-4.5 w-4.5" />
                      {primaryCta.label}
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="h-12 border border-white/35 bg-black/15 px-6 text-sm font-bold text-white hover:bg-black/28 md:text-base"
                    onClick={() =>
                      handleCta(
                        secondaryCta.label,
                        secondaryCta.ctaId,
                        "hero",
                        secondaryCta.planId,
                        secondaryCta.to
                      )
                    }
                  >
                    <Link to={secondaryCta.to}>
                      <secondaryCta.icon className="h-4.5 w-4.5" />
                      {secondaryCta.label}
                    </Link>
                  </Button>
                </div>
              </div>

              <aside className="rounded-[28px] border border-[#d5d5d5] bg-white p-5 text-[#121212] shadow-[0_20px_42px_rgba(0,0,0,0.3)] md:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7d7d7d]">
                    {isSpanish ? "Plan recomendado" : "Recommended plan"}
                  </p>
                  <span className="rounded-full bg-[#e10613] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    {isSpanish ? "Más vendido" : "Best seller"}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-4xl font-black leading-none">{isSpanish ? "Membresía 2TB" : "2TB Membership"}</h2>
                <p className="mt-2 text-sm font-semibold text-[#5a5a5a]">{isSpanish ? "$195 anual" : "$195 yearly"}</p>

                <div className="mt-5 space-y-2.5">
                  {[
                    isSpanish ? "Actualizaciones semanales" : "Weekly updates",
                    isSpanish ? "Acceso por carpetas y FTP" : "Folder and FTP access",
                    isSpanish ? "Soporte VIP en español" : "VIP support in Spanish",
                  ].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5">
                      <span className="text-sm font-semibold text-[#1f1f1f]">{item}</span>
                      <Check className="h-4.5 w-4.5 text-[#e10613]" />
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className="mt-5 h-11 w-full bg-[#e10613] text-sm font-black text-white hover:bg-[#ad000a]"
                  onClick={() =>
                    handleCta(
                      isSpanish ? "Ver membresía" : "View membership",
                      "hero_card_ver_membresia",
                      "hero_card",
                      "plan_2tb_anual",
                      "/membresia"
                    )
                  }
                >
                  <Link to="/membresia">
                    {isSpanish ? "Ver membresía" : "View membership"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </aside>
            </div>
          </div>
        </section>

        <section className="px-4 py-10">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: isSpanish ? "Problema real" : "Real problem",
                  text: isSpanish
                    ? "Perder horas buscando música entre pools y carpetas sueltas."
                    : "Losing hours searching across pools and scattered folders.",
                },
                {
                  title: isSpanish ? "Solución simple" : "Simple solution",
                  text: isSpanish
                    ? "Un solo catálogo por género con estructura clara."
                    : "A single genre-based catalog with clear structure.",
                },
                {
                  title: isSpanish ? "Resultado" : "Outcome",
                  text: isSpanish
                    ? "Más tiempo tocando y menos fricción antes de cada evento."
                    : "More time performing and less pre-gig friction.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="relative overflow-hidden rounded-2xl border border-[#ddd7d7] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]"
                >
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#280003] via-[#e10613] to-[#7d000a]"
                  />
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#e10613]">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#3a3a3a] md:text-base">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {showSocialProofEarly && SocialProof}

        <section id="planes" className="border-y border-[#dfd9d9] bg-white px-4 py-12 md:py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e10613]">
                {isSpanish ? "Oferta clara" : "Clear offer"}
              </p>
              <h2 className="mt-3 font-display text-4xl font-black text-[#111111] md:text-5xl">
                {isSpanish ? (
                  <>
                    Elige la opción con <span className="text-[#e10613]">mejor retorno</span>
                  </>
                ) : (
                  <>
                    Choose the option with <span className="text-[#e10613]">best return</span>
                  </>
                )}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[#545454] md:text-base">
                {isSpanish
                  ? "Comparación directa de precio, formato y objetivo. Sin letras chiquitas."
                  : "Direct comparison by price, format and objective. No fine print."}
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.key}
                  className={`relative overflow-hidden rounded-2xl border p-6 shadow-[0_10px_28px_rgba(0,0,0,0.07)] ${
                    plan.highlighted
                      ? "border-[#e10613] bg-white shadow-[0_14px_30px_rgba(120,0,10,0.22)]"
                      : "border-[#ded8d8] bg-[#fdfdfd]"
                  }`}
                >
                  <div
                    aria-hidden
                    className={`absolute inset-x-0 top-0 h-1 ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-[#270003] via-[#e10613] to-[#8e000b]"
                        : "bg-gradient-to-r from-[#1a1a1a] via-[#5f5f5f] to-[#1a1a1a]"
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <p className="font-display text-2xl font-black text-[#171717] md:text-3xl">{plan.title}</p>
                    {plan.highlighted && (
                      <span className="rounded-full bg-[#e10613] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                        {isSpanish ? "Recomendado" : "Recommended"}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-display text-4xl font-black leading-none text-[#e10613]">{plan.price}</p>
                  <p className="mt-1 text-sm font-semibold text-[#6a6a6a]">{plan.subtitle}</p>

                  <ul className="mt-5 space-y-2.5">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-sm text-[#2a2a2a]">
                        <Check className="mt-0.5 h-4 w-4 text-[#e10613]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`mt-6 h-11 w-full font-black ${
                      plan.highlighted
                        ? "bg-[#e10613] text-white hover:bg-[#ad000a]"
                        : "border border-[#d5cfcf] bg-white text-[#111111] hover:border-[#e10613] hover:text-[#e10613]"
                    }`}
                    onClick={() => handleCta(plan.cta, plan.ctaId, "pricing", plan.planId, plan.to)}
                  >
                    <Link to={plan.to}>
                      {plan.key === "usb" ? <Usb className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                      {plan.cta}
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {!showSocialProofEarly && SocialProof}

        <section id="catalogo" className="px-4 py-12 md:py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e10613]">
                {isSpanish ? "Preview de catálogo" : "Catalog preview"}
              </p>
              <h2 className="mt-3 font-display text-4xl font-black text-[#111111] md:text-5xl">
                {isSpanish ? "Catálogo en vivo" : "Live catalog"}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[#555555] md:text-base">
                {isSpanish
                  ? "Vista rápida de contenido reciente. Para búsqueda avanzada, abre el explorador completo."
                  : "Quick view of recent content. Use the full explorer for advanced filtering."}
              </p>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-3xl border border-[#ddd6d6] bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.06)] md:p-6">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1a1a1a] via-[#e10613] to-[#1a1a1a]"
              />
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {genres.map((genre) => {
                  const active = selectedGenre === genre;
                  const label = genre === "all" ? (isSpanish ? "Todos" : "All") : genre;
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                        active
                          ? "border-[#e10613] bg-[#e10613] text-white"
                          : "border-[#d8d1d1] bg-white text-[#5a5a5a] hover:border-[#e10613] hover:text-[#e10613]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {catalogLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-12 animate-pulse rounded-xl bg-[#efebeb]" />
                  ))}
                </div>
              ) : catalogError ? (
                <p className="rounded-xl border border-[#ebd0d0] bg-[#fff4f4] px-4 py-3 text-sm font-semibold text-[#8d1a24]">
                  {catalogError}
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleTracks.map((track) => (
                    <article key={track.id} className="rounded-xl border border-[#e4dddd] bg-[#fbfbfb] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[#161616]">{track.title}</p>
                          <p className="truncate text-xs text-[#666666]">{track.artist}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#737373]">
                            <span className="rounded-full bg-[#f0ecec] px-2.5 py-1 font-semibold text-[#5c5c5c]">{track.genre}</span>
                            <span>{track.duration}</span>
                            {track.bpm ? <span>{track.bpm} BPM</span> : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e10613]/50 bg-white text-[#e10613] transition-colors hover:bg-[#e10613] hover:text-white"
                          aria-label={isSpanish ? "Descargar con plan" : "Download with plan"}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-5 text-center">
                <Button
                  asChild
                  className="h-11 bg-[#e10613] px-6 text-sm font-black text-white hover:bg-[#ad000a]"
                  onClick={() =>
                    handleCta(
                      isSpanish ? "Abrir explorador" : "Open explorer",
                      "catalog_open_explorer",
                      "catalog",
                      null,
                      "/explorer"
                    )
                  }
                >
                  <Link to="/explorer">
                    {isSpanish ? "Abrir explorador completo" : "Open full explorer"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10">
          <div className="container mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[30px] border border-[#1d1d1d] bg-gradient-to-br from-[#171717] to-[#070707] p-8 text-white shadow-[0_18px_44px_rgba(0,0,0,0.4)] md:p-10">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2a0003] via-[#e10613] to-[#2a0003]"
              />
              <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e10613]">
                    {isSpanish ? "Pagos protegidos" : "Secure payments"}
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-black leading-tight md:text-5xl">
                    {isSpanish ? (
                      <>
                        Miles de DJs <span className="text-[#e10613]">confían en nosotros</span>
                      </>
                    ) : (
                      <>
                        Thousands of DJs <span className="text-[#e10613]">trust us</span>
                      </>
                    )}
                  </h2>
                  <p className="mt-3 text-sm text-white/80 md:text-base">
                    {isSpanish
                      ? "Compra segura, acceso claro y soporte humano para que inviertas con confianza."
                      : "Secure checkout, clear access and human support so you invest confidently."}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/25 p-5">
                  <ul className="space-y-2.5 text-sm text-white/90">
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#59d989]" />{isSpanish ? "Cancela cuando quieras" : "Cancel anytime"}</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#59d989]" />{isSpanish ? "Sin letras chiquitas" : "No hidden terms"}</li>
                    <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#59d989]" />{isSpanish ? "Checkout seguro en segundos" : "Secure checkout in seconds"}</li>
                  </ul>
                  <Button
                    asChild
                    className="mt-5 h-11 w-full bg-[#e10613] text-sm font-black text-white hover:bg-[#ad000a]"
                    onClick={() =>
                      handleCta(
                        isSpanish ? "Ver planes" : "View plans",
                        "trust_ver_planes",
                        "trust",
                        "plan_2tb_anual",
                        "/plan"
                      )
                    }
                  >
                    <Link to="/plan">
                      {isSpanish ? "Ver planes" : "View plans"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-10 md:py-14">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e10613]">FAQ</p>
              <h2 className="mt-3 font-display text-4xl font-black text-[#111111] md:text-5xl">
                {isSpanish ? "Objeciones antes de comprar" : "Questions before buying"}
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.q}
                  value={`faq-${index}`}
                  className="rounded-2xl border border-[#ddd6d6] bg-white px-5 data-[state=open]:border-[#e10613] data-[state=open]:shadow-[0_10px_24px_rgba(120,0,10,0.18)]"
                >
                  <AccordionTrigger className="py-4 text-left text-base font-bold text-[#181818] hover:text-[#e10613] hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-[#555555] md:text-base">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-4 pb-12 pt-4 md:pb-16">
          <div className="container mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-[28px] border border-[#cfcbcb] bg-white p-8 shadow-[0_14px_34px_rgba(0,0,0,0.08)] md:p-10">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2c0003] via-[#e10613] to-[#780008]"
              />
              <div className="grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-center">
                <div>
                  <h2 className="font-display text-4xl font-black leading-tight text-[#111111] md:text-5xl">
                    {isSpanish ? (
                      <>
                        ¿Listo para dejar de buscar en <span className="text-[#e10613]">5 pools</span>?
                      </>
                    ) : (
                      <>
                        Ready to stop searching across <span className="text-[#e10613]">5 pools</span>?
                      </>
                    )}
                  </h2>
                  <p className="mt-3 max-w-lg text-sm text-[#5d5d5d] md:text-base">
                    {isSpanish
                      ? "Una sola suscripción. Todo el contenido que necesitas para tocar mejor y facturar más."
                      : "One subscription. All the content you need to perform better and earn more."}
                  </p>
                </div>

                <Button
                  asChild
                  className="h-12 w-full bg-[#e10613] text-sm font-black text-white hover:bg-[#ad000a] md:w-auto md:px-8"
                  onClick={() =>
                    handleCta(
                      isSpanish ? "Ver planes" : "View plans",
                      "final_ver_planes",
                      "final_cta",
                      "plan_2tb_anual",
                      "/plan"
                    )
                  }
                >
                  <Link to="/plan">
                    {isSpanish ? "Ver planes" : "View plans"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#dad4d4] bg-[#f7f5f5] px-4 py-10">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col items-center gap-6 text-center">
              <img src={logoDark} alt="VideoRemixesPack" className="h-14 w-auto object-contain" />

              <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-semibold text-[#5a5a5a]">
                <Link to="/plan" className="hover:text-[#e10613]">{isSpanish ? "Planes" : "Plans"}</Link>
                <Link to="/explorer" className="hover:text-[#e10613]">{isSpanish ? "Demos" : "Demos"}</Link>
                <Link to="/help" className="hover:text-[#e10613]">{isSpanish ? "Soporte" : "Support"}</Link>
                <Link to="/terms_and_conditions" className="hover:text-[#e10613]">
                  {isSpanish ? "Términos" : "Terms"}
                </Link>
                <Link to="/privacy_policy" className="hover:text-[#e10613]">
                  {isSpanish ? "Privacidad" : "Privacy"}
                </Link>
              </div>

              <p className="text-xs text-[#777777]">
                © {new Date().getFullYear()} VideoRemixesPack. {isSpanish ? "Todos los derechos reservados." : "All rights reserved."}
              </p>
            </div>
          </div>
        </footer>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2b2b2b] bg-[#121212]/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                {isSpanish ? "Membresía recomendada" : "Recommended membership"}
              </p>
              <p className="truncate text-sm font-black text-white">$19.50/mes · $195/año</p>
            </div>
            <Button
              asChild
              className="h-10 bg-[#e10613] px-4 text-xs font-black text-white hover:bg-[#ad000a]"
              onClick={() =>
                handleCta(
                  isSpanish ? "Ver planes" : "View plans",
                  "mobile_sticky_ver_planes",
                  "mobile_sticky",
                  "plan_2tb_anual",
                  "/plan"
                )
              }
            >
              <Link to="/plan">
                <Zap className="h-4 w-4" />
                {isSpanish ? "Ver planes" : "View plans"}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Index;
