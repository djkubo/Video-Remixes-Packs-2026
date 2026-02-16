import logoWhite from "@/assets/logo-white.webp";

/**
 * Premium full-page loader shown while lazy routes are loading.
 * Replaces bare "Cargando..." text with a branded, animated experience.
 */
export default function PageLoader() {
    return (
        <div className="brand-frame min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
            {/* pulsing logo */}
            <img
                src={logoWhite}
                alt="VideoRemixesPack"
                className="h-10 w-auto animate-pulse opacity-80"
                draggable={false}
            />

            {/* spinner bar */}
            <div className="relative h-1 w-48 overflow-hidden rounded-full bg-white/10">
                <div
                    className="absolute inset-y-0 left-0 w-1/3 rounded-full"
                    style={{
                        background: "linear-gradient(90deg, transparent, #AA0202, transparent)",
                        animation: "pageLoaderSlide 1.2s ease-in-out infinite",
                    }}
                />
            </div>

            {/* inline keyframes — only a few bytes, avoid a separate CSS file */}
            <style>{`
        @keyframes pageLoaderSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
        </div>
    );
}
