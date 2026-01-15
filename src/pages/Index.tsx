import HeroSection from "@/components/HeroSection";
import ProblemSolutionGrid from "@/components/ProblemSolutionGrid";
import SpeedSection from "@/components/SpeedSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import InfiniteMarquee from "@/components/InfiniteMarquee";
import FinalCTA from "@/components/FinalCTA";
import GuaranteeSection from "@/components/GuaranteeSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSolutionGrid />
      <SpeedSection />
      <TestimonialsSection />
      <FAQSection />
      
      {/* Genre Wall Section - El Muro de Géneros */}
      <section className="relative py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            EL MURO DE GÉNEROS
          </h2>
          <p className="mb-10 font-sans text-lg text-muted-foreground">
            +60 géneros musicales. Todo lo que necesitas en un solo lugar.
          </p>
        </div>
        <InfiniteMarquee />
      </section>

      <FinalCTA />
      <GuaranteeSection />
      <Footer />
    </main>
  );
};

export default Index;
