import { CloudDownload, CreditCard, FolderSearch } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="bg-zinc-950 px-4 pb-12 pt-6 md:pb-16 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          ¿CÓMO FUNCIONA?
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-[#25D366]">
              <FolderSearch />
            </div>
            <p className="mt-4 text-base font-semibold text-white">Elige tu pack o membresía</p>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-[#25D366]">
              <CreditCard />
            </div>
            <p className="mt-4 text-base font-semibold text-white">
              Paga seguro con Tarjeta, PayPal o Klarna
            </p>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-[#25D366]">
              <CloudDownload />
            </div>
            <p className="mt-4 text-base font-semibold text-white">
              Descarga al instante desde Google Drive
            </p>
          </article>
        </div>

        <div className="mt-6 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-center text-sm font-semibold text-white md:text-base">
          🚚 ¿Prefieres todo listo? Pide la USB de 128GB y te la enviamos con envío GRATIS a toda USA.
        </div>
      </div>
    </section>
  );
}

