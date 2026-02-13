import { Flame, HardDriveDownload, Server } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="bg-[#070707] px-4 pb-12 pt-6 md:pb-16 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-bebas text-4xl uppercase tracking-tight text-[#EFEFEF] md:text-5xl">
          ¿CÓMO FUNCIONA?
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#5E5E5E] bg-[#070707] text-[#AA0202]">
              <Flame />
            </div>
            <p className="mt-4 font-bebas text-2xl uppercase text-[#EFEFEF]">
              1. LA PRUEBA DE FUEGO
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              7 días gratis y 100GB. Requiere tarjeta por seguridad, pero si no te convence,
              cancelas con 1 clic. $0 cobrados hoy.
            </p>
          </article>

          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#5E5E5E] bg-[#070707] text-[#AA0202]">
              <Server />
            </div>
            <p className="mt-4 font-bebas text-2xl uppercase text-[#EFEFEF]">
              2. CONECTA TU GESTOR FTP
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              Usa Air Explorer o FileZilla. Te damos un video tutorial de 2 minutos y soporte
              'Anti-Estrés' para conectarte al instante.
            </p>
          </article>

          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#5E5E5E] bg-[#070707] text-[#AA0202]">
              <HardDriveDownload />
            </div>
            <p className="mt-4 font-bebas text-2xl uppercase text-[#EFEFEF]">
              3. DESCARGA MIENTRAS DUERMES
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              Olvídate del clic-por-canción. Selecciona las carpetas del mes, dale descargar,
              vete a dormir y despierta con tu biblioteca lista.
            </p>
          </article>
        </div>

        <div className="mt-6 w-full rounded-2xl border border-[#5E5E5E] bg-[#111111] px-4 py-4 text-center font-sans text-sm font-semibold text-[#EFEFEF] md:text-base">
          💎 FILOSOFÍA VRP: Calidad sobre cantidad. Sin logos visuales, intros limpios y etiquetas
          perfectas.
        </div>
      </div>
    </section>
  );
}
