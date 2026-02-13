import { CheckCheck } from "lucide-react";

type Message = {
  id: string;
  text: string;
};

const MESSAGES: Message[] = [
  { id: "m1", text: "Ya lo compré bro, ya hasta me llegó. Saludos!" },
  { id: "m2", text: "Muchas gracias, ya las descargué todas. Muy buena música." },
  { id: "m3", text: "Si el material es bueno, vale la pena. Excelente Gustavo." },
];

export default function SocialProofSection() {
  return (
    <section className="bg-[#070707] px-4 pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-bebas text-4xl uppercase text-[#EFEFEF] md:text-5xl">
          DJs reales. Resultados reales.
        </h2>
        <p className="mb-10 mt-3 text-center font-sans text-muted-foreground">
          Cero inventos. Mensajes reales de DJs que ya descargan y mezclan nuestra música.
        </p>

        <div className="relative mx-auto max-w-md space-y-4 rounded-2xl border border-[#5E5E5E] bg-[#0B141A] p-4 shadow-2xl sm:p-6">
          {MESSAGES.map((msg) => (
            <div
              key={msg.id}
              className="relative w-fit max-w-[85%] rounded-lg rounded-tl-none border border-[#2A3942] bg-[#202C33] p-3 text-[#E9EDEF] shadow-sm"
            >
              <span
                aria-hidden
                className="absolute -left-[6px] top-0 h-3 w-3 rotate-45 border-l border-t border-[#2A3942] bg-[#202C33]"
              />

              <p className="text-sm leading-relaxed">{msg.text}</p>

              <div className="mt-1 text-right text-[10px] text-muted-foreground">
                14:23 <CheckCheck className="ml-1 inline-block h-3 w-3 text-[#53BDEB]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
