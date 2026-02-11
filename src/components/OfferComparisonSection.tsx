import { CreditCard, Headphones, MessageCircle, Usb } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const OfferComparisonSection = () => {
  const { language } = useLanguage();
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
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-muted/20 dark:bg-background-carbon">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              {isEs ? "OFERTA CLARA" : "CLEAR OFFER"}
            </Badge>
            <h2 className="mt-4 font-display text-4xl font-black md:text-5xl">
              {isEs ? (
                <>
                  Elige la opción que <span className="text-gradient-red">más te conviene</span>
                </>
              ) : (
                <>
                  Choose the option that <span className="text-gradient-red">fits your stage</span>
                </>
              )}
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              {isEs
                ? "Compara precio, formato y objetivo en segundos. Sin letras chiquitas."
                : "Compare price, format, and goal in seconds. No fine print."}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.key}
                className={`glass-card p-6 ${offer.highlighted ? "ring-1 ring-primary/30" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                    <offer.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-display text-2xl font-black">{offer.title}</p>
                </div>

                <p className="mt-5 font-display text-3xl font-black text-gradient-red">{offer.price}</p>
                <p className="mt-1 text-sm text-muted-foreground">{offer.subtitle}</p>

                <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                  {offer.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <CreditCard className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Button asChild variant={offer.variant} className="h-11 w-full font-black">
                    <Link to={offer.to}>{offer.cta}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isEs
              ? "Tip: si todavía tienes dudas, empieza por demos y luego avanza al plan que mejor encaje contigo."
              : "Tip: if you still have doubts, start with demos and move to the plan that fits you best."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default OfferComparisonSection;
