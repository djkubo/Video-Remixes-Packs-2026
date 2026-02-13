import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type PricingSectionProps = {
  checkoutUrl: string;
};

export default function PricingSection({ checkoutUrl }: PricingSectionProps) {
  return (
    <section className="bg-[#070707] px-4 pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bebas text-3xl uppercase tracking-wide text-[#EFEFEF]">
                  PRUEBA DE FUEGO
                </p>
                <p className="mt-1 font-bebas text-5xl uppercase text-[#EFEFEF]">$0</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#5E5E5E] bg-[#070707] px-3 py-1 font-bebas text-xs uppercase tracking-wide text-muted-foreground">
                POR 7 DÍAS
              </span>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "100 GB de descarga rápida",
                "Conexión FTP Profesional",
                "Catálogo completo.",
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
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                  INICIAR PRUEBA GRATIS
                </a>
              </Button>
              <p className="mt-3 text-center font-sans text-xs text-muted-foreground">
                Requiere tarjeta como filtro de calidad. $0 cobrados hoy.
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <div>
              <p className="font-bebas text-3xl uppercase tracking-wide text-[#EFEFEF]">
                PLAN MENSUAL PRO
              </p>
              <p className="mt-1 font-bebas text-5xl uppercase text-[#EFEFEF]">$35 / MES</p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "1 TB (1,000 GB) mensual",
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
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                  ELEGIR PLAN MENSUAL
                </a>
              </Button>
            </div>
          </article>

          <article className="relative rounded-2xl border-2 border-[#AA0202] bg-[#111111] p-6 lg:scale-105">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#AA0202] px-4 py-1 font-bebas text-xs uppercase tracking-wide text-[#EFEFEF]">
              LA ELECCIÓN DEL DJ EMPRESARIO
            </span>

            <div className="mt-2">
              <p className="font-bebas text-3xl uppercase tracking-wide text-[#EFEFEF]">
                PLAN ANUAL ELITE
              </p>
              <p className="mt-1 font-bebas text-5xl uppercase text-[#EFEFEF]">$195 / AÑO</p>
              <p className="mt-2 font-sans text-sm font-semibold text-[#AA0202]">
                Equivale a solo $16.25 / mes
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "2 TB mensuales (Doble capacidad)",
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
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                  HAZTE ELITE
                </a>
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
