import { CheckCircle2, ArrowRight, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type PricingSectionProps = {
  checkoutUrl: string;
};

function withPlan(url: string, plan: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}plan=${encodeURIComponent(plan)}`;
}

export default function PricingSection({ checkoutUrl }: PricingSectionProps) {
  const monthlyUrl = withPlan(checkoutUrl, "plan_1tb_mensual");
  const quarterlyUrl = withPlan(checkoutUrl, "plan_1tb_trimestral");
  const annualUrl = withPlan(checkoutUrl, "plan_2tb_anual");

  return (
    <section className="bg-[#070707] px-4 pb-16">
      <div className="mx-auto max-w-6xl">
        {/* Value anchor */}
        <div className="mb-10 text-center">
          <p className="font-sans text-sm text-zinc-400">
            Suscribirte a BPMSupreme + DJCity + Beatjunkies por separado =
          </p>
          <p className="mt-1 font-bebas text-3xl text-[#5E5E5E] line-through decoration-[#AA0202] md:text-4xl">
            $500+ USD / MES
          </p>
          <p className="mt-2 font-bebas text-xl uppercase text-[#EFEFEF] md:text-2xl">
            Con VRP obtienes TODO desde <span className="text-[#AA0202]">$16.25/mes</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
          {/* Monthly */}
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <div>
              <p className="font-bebas text-3xl uppercase tracking-wide text-[#EFEFEF]">
                Plan PRO DJ mensual
              </p>
              <p className="mt-1 font-bebas text-5xl uppercase text-[#EFEFEF]">$35USD/m</p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "1000 GB cada mes",
                "trial 7 días $0",
                "Actualizaciones semanales",
                "Audio/Video/Karaoke sin logos.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 font-sans text-sm text-[#EFEFEF]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                asChild
                variant="outline"
                className="min-h-[56px] w-full border-[#AA0202] bg-transparent font-bebas text-xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#AA0202]/15 hover:text-[#EFEFEF]"
              >
                <a href={monthlyUrl} rel="noopener noreferrer">
                  ELEGIR PLAN MENSUAL
                </a>
              </Button>
            </div>
          </article>

          {/* Quarterly */}
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <div>
              <p className="font-bebas text-3xl uppercase tracking-wide text-[#EFEFEF]">
                Plan PRO DJ trimestral
              </p>
              <p className="mt-1 font-bebas text-5xl uppercase text-[#EFEFEF]">$90USD/3m</p>
              <p className="mt-2 font-sans text-sm font-semibold text-[#AA0202]">
                Equivale a $30 / mes — Ahorras $15
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "1000 GB cada mes",
                "trial 7 días $0",
                "Pago cada 3 meses",
                "Menos fricción al empezar",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 font-sans text-sm text-[#EFEFEF]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                asChild
                className="min-h-[56px] w-full bg-[#111111] border border-[#AA0202] font-bebas text-2xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#AA0202]/15"
              >
                <a href={quarterlyUrl} rel="noopener noreferrer">
                  EMPEZAR TRIMESTRAL
                </a>
              </Button>
            </div>
          </article>

          {/* Annual / Elite — RECOMMENDED */}
          <article className="relative rounded-2xl border-2 border-[#AA0202] bg-[#111111] p-6 lg:scale-105 shadow-[0_0_60px_rgba(170,2,2,0.2)]">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-[#AA0202] px-5 py-1.5 font-bebas text-sm uppercase tracking-wide text-[#EFEFEF] shadow-lg">
              <Crown className="h-4 w-4" />
              RECOMENDADO — LA ELECCIÓN DEL DJ PRO
            </span>

            <div className="mt-3">
              <p className="font-bebas text-3xl uppercase tracking-wide text-[#EFEFEF]">
                Plan 2 TB / Mes – 195 Anual
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <p className="font-bebas text-5xl uppercase text-[#EFEFEF]">$195USD/a</p>
                <p className="font-bebas text-2xl text-[#5E5E5E] line-through">$420</p>
              </div>
              <p className="mt-2 font-sans text-sm font-semibold text-[#AA0202]">
                Equivale a solo $16.25 / mes — ¡53% de descuento!
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "2000 GB cada mes",
                "trial 7 días $0",
                "Pago único deducible de impuestos",
                "Cero límites de velocidad.",
                "Acceso prioritario a música nueva",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 font-sans text-sm text-[#EFEFEF]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                asChild
                className="min-h-[56px] w-full bg-[#AA0202] font-bebas text-2xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#8A0101] shadow-[0_10px_30px_rgba(170,2,2,0.35)]"
              >
                <a href={annualUrl} rel="noopener noreferrer">
                  <ArrowRight className="h-5 w-5" />
                  HAZTE ELITE
                </a>
              </Button>
              <p className="mt-3 text-center font-sans text-xs text-zinc-400">
                Ahorras $225 vs plan mensual · Garantía 7 días
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
