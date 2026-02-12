import { ArrowRight, Check, Headphones, MessageCircle, Usb } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";

const OfferComparisonSection = () => {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const isEs = language === "es";

  const offers = [
    {
      key: "pack",
      icon: Headphones,
      title: isEs ? "Pack Individual" : "Single Pack",
      price: "$35 USD",
      subtitle: isEs ? "Pago único · 3,000 canciones" : "One-time payment · 3,000 tracks",
      bullets: isEs
        ? [
            "Ideal para probar antes de escalar",
            "Descarga digital inmediata",
            "Escucha demos antes de comprar",
          ]
        : [
            "Best to start and validate quality",
            "Instant digital download",
            "Listen to demos before buying",
          ],
      cta: isEs ? "Escuchar demos" : "Listen to demos",
      to: "/explorer",
      variant: "outline" as const,
      ctaId: "offer_pack_demos",
      planId: null,
    },
    {
      key: "membresia",
      icon: MessageCircle,
      title: isEs ? "Membresía" : "Membership",
      price: "$19.50/mes · $195/año",
      subtitle: isEs ? "Contenido actualizado + comunidad" : "Updated content + community",
      bullets: isEs
        ? [
            "Catálogo en expansión continua",
            "Soporte en español por WhatsApp",
            "Sin permanencia forzosa",
          ]
        : [
            "Continuously updated catalog",
            "Spanish support on WhatsApp",
            "No forced commitment",
          ],
      cta: isEs ? "Ver membresía" : "View membership",
      to: "/membresia",
      variant: "default" as const,
      highlighted: true,
      ctaId: "offer_membresia",
      planId: "plan_2tb_anual",
    },
    {
      key: "usb",
      icon: Usb,
      title: isEs ? "USB Física" : "Physical USB",
      price: "$147 USD",
      subtitle: isEs ? "10,000 canciones · envío USA" : "10,000 tracks · US shipping",
      bullets: isEs
        ? [
            "Conecta y mezcla sin complicaciones",
            "Compatible con Serato / VDJ / Rekordbox",
            "Pago con tarjeta, PayPal y cuotas",
          ]
        : [
            "Plug and mix with no setup friction",
            "Compatible with Serato / VDJ / Rekordbox",
            "Card, PayPal, and installments available",
          ],
      cta: isEs ? "Ver USB" : "View USB",
      to: "/usb128",
      variant: "outline" as const,
      ctaId: "offer_usb",
      planId: null,
    },
  ];

  return (
    <section className="relative border-y border-border/75 bg-background-carbon/58 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge variant="outline" className="border border-primary/60 bg-card px-3 py-1 text-primary hover:bg-card">
              {isEs ? "OFERTA CLARA" : "CLEAR OFFER"}
            </Badge>
            <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl lg:text-6xl">
              {isEs ? (
                <>
                  Elige la opción con <span className="text-primary">mejor retorno</span>
                </>
              ) : (
                <>
                  Choose the option with <span className="text-primary">best ROI</span>
                </>
              )}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
              {isEs
                ? "Comparación directa de precio, formato y objetivo. Sin letras chiquitas, sin confusión."
                : "Direct comparison of price, format, and goal. No fine print, no confusion."}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.key}
                className={`rounded-2xl border bg-card p-6 shadow-[0_12px_28px_rgba(15,23,42,0.1)] ${
                  offer.highlighted
                    ? "border-primary/65 ring-1 ring-primary/28 shadow-[0_16px_32px_rgba(236,9,50,0.16)]"
                    : "border-border/88"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/45 bg-card">
                    <offer.icon className="h-5 w-5 text-primary" />
                  </div>
                  {offer.highlighted && (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                      {isEs ? "Recomendado" : "Recommended"}
                    </span>
                  )}
                </div>

                <p className="mt-4 font-display text-2xl font-bold text-foreground">{offer.title}</p>
                <p className="mt-2 font-display text-4xl font-bold text-primary">{offer.price}</p>
                <p className="mt-1 text-sm text-muted-foreground">{offer.subtitle}</p>

                <ul className="mt-6 space-y-2 text-sm text-foreground/90">
                  {offer.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <Button
                    asChild
                    variant={offer.variant}
                    className={`h-11 w-full font-bold ${offer.highlighted ? "btn-primary-glow" : ""}`}
                    onClick={() =>
                      trackEvent("click", {
                        cta_id: offer.ctaId,
                        plan_id: offer.planId,
                        section: "offer_comparison",
                        funnel_step: "decision",
                      })
                    }
                  >
                    <Link to={offer.to}>
                      {offer.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isEs
              ? "Tip CRO: si dudas, valida con demos y vuelve al plan recomendado."
              : "CRO tip: if unsure, validate with demos and return to the recommended plan."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default OfferComparisonSection;
