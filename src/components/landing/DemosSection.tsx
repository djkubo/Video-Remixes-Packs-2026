import { useEffect, useRef, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { useAudioStore } from "@/store/useAudioStore";
import { supabase } from "@/integrations/supabase/client";

const GENRES = ["Reggaetón", "Cumbia", "Salsa", "Bachata", "Regional Mexicano"] as const;

type Genre = (typeof GENRES)[number];

type DemoTrack = {
  id: string;
  title: string;
  artist: string;
  src: string;
};

const GENRE_QUERY: Record<Genre, string[]> = {
  Reggaetón: ["reggaeton", "reggaetón"],
  Cumbia: ["cumbia"],
  Salsa: ["salsa"],
  Bachata: ["bachata"],
  "Regional Mexicano": ["banda", "regional", "mexicano", "norte", "corrid"],
};

function formatTrackTitle(track: { title: string; artist: string }): string {
  const title = track.title.trim();
  const artist = track.artist.trim();
  if (!artist || artist.toLowerCase() === "unknown artist") return title;
  return `${artist} - ${title}`;
}

export default function DemosSection() {
  const [activeGenre, setActiveGenre] = useState<Genre>("Reggaetón");
  const playTrack = useAudioStore((s) => s.playTrack);

  const [tracks, setTracks] = useState<DemoTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Partial<Record<Genre, DemoTrack[]>>>({});

  useEffect(() => {
    let cancelled = false;

    const cached = cacheRef.current[activeGenre];
    if (cached) {
      setTracks(cached);
      return;
    }

    setIsLoading(true);

    (async () => {
      try {
        const patterns = GENRE_QUERY[activeGenre] ?? [];

        let query = supabase
          .from("tracks")
          .select("id,title,artist,file_url,genre")
          .eq("is_visible", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (patterns.length === 1) {
          query = query.ilike("genre", `%${patterns[0]}%`);
        } else if (patterns.length > 1) {
          query = query.or(
            patterns.map((p) => `genre.ilike.%${p}%`).join(",")
          );
        }

        const { data, error } = await query;
        if (error) throw error;

        const nextTracks: DemoTrack[] = (data ?? [])
          .filter(
            (row): row is { id: string; title: string; artist: string; file_url: string; genre: string } =>
              Boolean(row?.id) &&
              typeof row.title === "string" &&
              typeof row.artist === "string" &&
              typeof (row as { file_url?: unknown }).file_url === "string"
          )
          .map((row) => ({
            id: row.id,
            title: row.title,
            artist: row.artist,
            src: (row as { file_url: string }).file_url,
          }));

        if (cancelled) return;
        cacheRef.current[activeGenre] = nextTracks;
        setTracks(nextTracks);
      } catch {
        if (cancelled) return;
        cacheRef.current[activeGenre] = [];
        setTracks([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeGenre]);

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
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex w-full items-center gap-3 rounded-xl bg-[#111111] p-3 opacity-80"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#070707] text-[#EFEFEF]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block h-4 w-44 rounded bg-[#070707]" />
                </span>
                <span className="h-7 w-16 rounded-full border border-[#5E5E5E] bg-[#070707]" />
              </div>
            ))
          ) : (
            tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() =>
                playTrack({
                  id: `${activeGenre}-${track.id}`,
                  title: formatTrackTitle(track),
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
                  {formatTrackTitle(track)}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-[#5E5E5E] bg-[#070707] px-2.5 py-1 text-xs font-semibold text-[#EFEFEF]">
                320kbps
              </span>
            </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
