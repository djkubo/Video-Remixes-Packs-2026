import { useMemo, useState } from "react";
import { PlayCircle } from "lucide-react";
import { useAudioStore } from "@/store/useAudioStore";

const GENRES = ["Reggaetón", "Cumbia", "Salsa", "Bachata", "Regional Mexicano"] as const;

type Genre = (typeof GENRES)[number];

export default function DemosSection() {
  const [activeGenre, setActiveGenre] = useState<Genre>("Reggaetón");
  const playTrack = useAudioStore((s) => s.playTrack);

  const tracks = useMemo(
    () => [
      {
        id: "demo-1",
        title: "Demo Reggaetón 01",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      },
      {
        id: "demo-2",
        title: "Demo Reggaetón 01",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      },
      {
        id: "demo-3",
        title: "Demo Reggaetón 01",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      },
    ],
    []
  );

  return (
    <section id="demos" className="bg-[#070707] px-4 pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-[#EFEFEF] md:text-4xl">
          ¿Quieres escuchar antes de pagar? Dale play.
        </h2>
        <p className="mb-8 mt-3 text-center text-muted-foreground">
          Sin registro. Sin tarjeta. Comprueba la calidad MP3 320kbps.
        </p>

        <div className="flex gap-2 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {GENRES.map((genre) => {
            const active = genre === activeGenre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setActiveGenre(genre)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-[#AA0202] bg-[#AA0202] text-[#EFEFEF]"
                    : "border-[#5E5E5E] bg-[#111111] text-[#EFEFEF] hover:bg-[#070707]",
                ].join(" ")}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          {tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() =>
                playTrack({
                  id: `${activeGenre}-${track.id}`,
                  title: track.title,
                  genre: activeGenre,
                  src: track.src,
                })
              }
              className="flex w-full items-center gap-3 rounded-xl bg-[#111111] p-3 text-left hover:bg-[#070707]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#070707] text-[#EFEFEF]">
                <PlayCircle className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#EFEFEF]">
                  {track.title}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-[#5E5E5E] bg-[#070707] px-2.5 py-1 text-xs font-semibold text-[#EFEFEF]">
                320kbps
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
