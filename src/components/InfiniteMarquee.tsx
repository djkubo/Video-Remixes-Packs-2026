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
  // Quadruple the array for seamless loop
  const repeatedGenres = [...genres, ...genres, ...genres, ...genres];

  return (
    <section className="relative w-full overflow-hidden py-8 md:py-12 bg-background">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />
      
      {/* First row - Marquee */}
      <div className="flex w-full">
        <div className="marquee-track">
          {repeatedGenres.map((genre, index) => (
            <span
              key={`row1-${genre}-${index}`}
              className="mx-6 whitespace-nowrap font-display text-5xl font-bold uppercase tracking-wide text-white/10 transition-all duration-500 hover:text-primary/50 md:mx-8 md:text-6xl lg:text-7xl"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
      
      {/* Second row - reverse direction */}
      <div className="mt-4 flex w-full">
        <div 
          className="marquee-track"
          style={{ 
            animationDirection: "reverse",
            animationDuration: "90s"
          }}
        >
          {[...repeatedGenres].reverse().map((genre, index) => (
            <span
              key={`row2-${genre}-${index}`}
              className="mx-6 whitespace-nowrap font-display text-4xl font-bold uppercase tracking-wide text-white/5 transition-all duration-500 hover:text-primary/30 md:mx-8 md:text-5xl lg:text-6xl"
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
