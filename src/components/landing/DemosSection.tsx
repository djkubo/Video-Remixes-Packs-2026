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
    <section id="demos" className="bg-zinc-950 px-4 pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
          ¿Quieres escuchar antes de pagar? Dale play.
        </h2>
        <p className="mb-8 mt-3 text-center text-zinc-400">
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
                    ? "border-[#25D366] bg-[#25D366] text-black"
                    : "border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800",
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
              className="flex w-full items-center gap-3 rounded-xl bg-zinc-900/50 p-3 text-left hover:bg-zinc-800"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white">
                <PlayCircle className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{track.title}</span>
              </span>
              <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white">
                320kbps
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

