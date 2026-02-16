import { CheckCircle2 } from "lucide-react";
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
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
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
                <Link to={monthlyUrl}>
                  ELEGIR PLAN MENSUAL
                </Link>
              </Button>
            </div>
          </article>

          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <div>
              <p className="font-bebas text-3xl uppercase tracking-wide text-[#EFEFEF]">
                Plan PRO DJ trimestral
              </p>
              <p className="mt-1 font-bebas text-5xl uppercase text-[#EFEFEF]">$90USD/3m</p>
              <p className="mt-2 font-sans text-sm font-semibold text-[#AA0202]">
                Equivale a $30 / mes
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
                <Link to={quarterlyUrl}>
                  EMPEZAR TRIMESTRAL
                </Link>
              </Button>
            </div>
          </article>

          <article className="relative rounded-2xl border-2 border-[#AA0202] bg-[#111111] p-6 lg:scale-105">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#AA0202] px-4 py-1 font-bebas text-xs uppercase tracking-wide text-[#EFEFEF]">
              LA ELECCIÓN DEL DJ EMPRESARIO
            </span>

            <div className="mt-2">
              <p className="font-bebas text-3xl uppercase tracking-wide text-[#EFEFEF]">
                Plan 2 TB / Mes – 195 Anual
              </p>
              <p className="mt-1 font-bebas text-5xl uppercase text-[#EFEFEF]">$195USD/a</p>
              <p className="mt-2 font-sans text-sm font-semibold text-[#AA0202]">
                Equivale a solo $16.25 / mes
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "2000 GB cada mes",
                "trial 7 días $0",
                "Pago único deducible de impuestos",
                "Cero límites de velocidad.",
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
                className="min-h-[56px] w-full bg-[#AA0202] font-bebas text-2xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#8A0101]"
              >
                <Link to={annualUrl}>
                  HAZTE ELITE
                </Link>
              </Button>
              <p className="mt-3 text-center font-sans text-xs text-muted-foreground">
                Ahorras $225 en comparación al plan mensual.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
