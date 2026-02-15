import { useEffect, useRef } from "react";

type HlsVideoProps = {
  src: string;
  poster?: string;
  className?: string;
};

export default function HlsVideo({ src, poster, className }: HlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // If the browser supports HLS natively (Safari), use it directly.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    let cancelled = false;
    // deno-lint-ignore no-explicit-any
    let hls: any = null;

    const setup = async () => {
      try {
        const mod = await import("hls.js");
        if (cancelled) return;

        const Hls = mod.default;
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          // Best-effort fallback: some browsers/contexts may still play.
          video.src = src;
        }
      } catch {
        // If Hls.js fails to load for some reason, fallback to direct src.
        video.src = src;
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      poster={poster}
      className={className}
    />
  );
}

