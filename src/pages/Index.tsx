import HeroSection from "@/components/HeroSection";
import ProblemSolutionGrid from "@/components/ProblemSolutionGrid";
import SpeedSection from "@/components/SpeedSection";
import InfiniteMarquee from "@/components/InfiniteMarquee";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSolutionGrid />
      <SpeedSection />
      
      {/* Genre Wall Section */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-2 font-display text-3xl font-bold md:text-4xl">
            EL MURO DE GÉNEROS
          </h2>
          <p className="mb-8 text-muted-foreground">
            +60 géneros musicales. Todo lo que necesitas en un solo lugar.
          </p>
        </div>
        <InfiniteMarquee />
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
};

export default Index;
