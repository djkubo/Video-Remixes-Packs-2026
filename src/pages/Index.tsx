import HeroSection from "@/components/HeroSection";
import MusicExplorer from "@/components/MusicExplorer";
import PremiumFeaturesSection from "@/components/PremiumFeaturesSection";
import AggregatorSection from "@/components/AggregatorSection";
import DJTodoterrenoSection from "@/components/DJTodoterrenoSection";
import SpeedSection from "@/components/SpeedSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import InfiniteMarquee from "@/components/InfiniteMarquee";
import TrustSecuritySection from "@/components/TrustSecuritySection";
import PricingSection from "@/components/PricingSection";
import FinalCTA from "@/components/FinalCTA";
import TrustBar from "@/components/TrustBar";
import GuaranteeSection from "@/components/GuaranteeSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <MusicExplorer />
      <PremiumFeaturesSection />
      <AggregatorSection />
      <DJTodoterrenoSection />
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

      <TrustSecuritySection />
      <PricingSection />
      <FinalCTA />
      <TrustBar />
      <GuaranteeSection />
      <Footer />
    </main>
  );
};

export default Index;
