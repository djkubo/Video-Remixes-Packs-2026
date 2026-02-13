import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingSection() {
  return (
    <section className="bg-zinc-950 px-4 pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold text-white">DJ PRO Vol. Mensual</p>
                <p className="mt-2 text-3xl font-extrabold text-white">$35 USD</p>
              </div>
              <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-semibold text-zinc-400">
                Pago Único
              </span>
            </div>

            <ul className="mt-6 space-y-3">
              {["3,000 canciones MP3", "50+ géneros organizados", "Descarga inmediata"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#25D366]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                variant="outline"
                className="min-h-[56px] w-full border-zinc-700 bg-transparent font-semibold text-white hover:bg-zinc-800"
              >
                Comprar Pack
              </Button>
              <p className="mt-3 text-center text-xs text-zinc-500">
                💳 o 4 cuotas sin intereses con Klarna/Afterpay
              </p>
            </div>
          </article>

          <article className="relative rounded-2xl border border-[#25D366] bg-zinc-900 p-6 lg:scale-105">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#25D366] px-4 py-1 text-xs font-extrabold text-black">
              LA MEJOR OPCIÓN
            </span>

            <div className="mt-2">
              <p className="text-xl font-extrabold text-white">Membresía DJ PRO</p>
              <p className="mt-2 text-3xl font-extrabold text-white">$35 USD / mes</p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "Acceso al catálogo COMPLETO",
                "Actualizaciones automáticas mensuales",
                "Cancela cuando quieras con 1 clic",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#25D366]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button className="min-h-[56px] w-full bg-[#25D366] font-bold text-black hover:bg-[#1EBE5D]">
                Iniciar Membresía
              </Button>
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold text-white">USB Física 128GB</p>
                <p className="mt-2 text-3xl font-extrabold text-white">$147 USD</p>
              </div>
              <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-semibold text-zinc-400">
                Pago Único
              </span>
            </div>

            <div className="mt-4">
              <span className="inline-flex rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-semibold text-[#25D366]">
                Envío GRATIS USA
              </span>
            </div>

            <ul className="mt-6 space-y-3">
              {["Samsung BAR Plus 128GB", "+10,000 canciones listas", "Plug and play"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#25D366]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                variant="outline"
                className="min-h-[56px] w-full border-zinc-700 bg-transparent font-semibold text-white hover:bg-zinc-800"
              >
                Pedir mi USB
              </Button>
              <p className="mt-3 text-center text-xs text-zinc-500">
                💳 o 4 cuotas sin intereses con Klarna/Afterpay
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

