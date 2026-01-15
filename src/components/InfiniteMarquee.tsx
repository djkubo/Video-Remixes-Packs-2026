import { memo } from "react";

const genres = [
  "10s", "2000", "House", "60s", "70s", "80s High Energy", "90s Latino", 
  "90s Old School", "Acapella In/Out", "Afrobeat", "Afro House", "Alternativo", 
  "Bachata", "Banda", "Bodas", "Calentano", "Cumbia Sonidera", "Cumbia Wepa", 
  "Cumbia Villera", "Circuit", "Corridos", "Country", "Cubaton", "Dance Hall", 
  "Deep House", "Dembow", "Disco", "Dubstep", "Duranguense", "EDM", 
  "Electro Latino", "Freestyle", "Funk", "Guaracha", "Hip Hop", "Huapangos Tribal", 
  "K-Pop", "Latin House", "Mambo", "Mariachi", "Mashups", "Merengue", "Moombahton", 
  "Norteñas Sax", "Nu Disco", "Pop Latino", "Punta", "Rancheras", "Rap", "Reggae", 
  "Reggaeton Old", "Reggaeton New", "Regional Mexicano", "Rock en Español", 
  "Salsa", "Tech House", "Techno", "Tierra Caliente", "Trap", "Tribal", 
  "Twerk", "Urbano", "Vallenato"
];

const InfiniteMarquee = memo(() => {
  // Double the array for seamless loop
  const doubledGenres = [...genres, ...genres];

  return (
    <section className="relative w-full overflow-hidden py-12 md:py-16">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />
      
      {/* Marquee container */}
      <div className="flex w-full">
        <div className="marquee-track">
          {doubledGenres.map((genre, index) => (
            <span
              key={`${genre}-${index}`}
              className="mx-4 whitespace-nowrap font-display text-2xl font-bold uppercase tracking-wide text-muted-foreground/40 transition-colors duration-300 hover:text-primary md:mx-6 md:text-4xl lg:text-5xl"
              style={{
                textShadow: "0 0 40px transparent",
              }}
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
      
      {/* Second row - reverse direction */}
      <div className="mt-6 flex w-full">
        <div 
          className="marquee-track"
          style={{ 
            animationDirection: "reverse",
            animationDuration: "80s"
          }}
        >
          {doubledGenres.reverse().map((genre, index) => (
            <span
              key={`reverse-${genre}-${index}`}
              className="mx-4 whitespace-nowrap font-display text-xl font-semibold uppercase tracking-wide text-muted-foreground/30 transition-colors duration-300 hover:text-primary/80 md:mx-6 md:text-3xl lg:text-4xl"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
});

InfiniteMarquee.displayName = "InfiniteMarquee";

export default InfiniteMarquee;
