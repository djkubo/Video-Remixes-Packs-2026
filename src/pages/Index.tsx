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

import FinalCTA from "@/components/FinalCTA";
import TrustBar from "@/components/TrustBar";
import GuaranteeSection from "@/components/GuaranteeSection";
import Footer from "@/components/Footer";
import MobileStickyBar from "@/components/MobileStickyBar";
import SettingsToggle from "@/components/SettingsToggle";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();

  return (
    <>
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <main id="main-content" className="min-h-screen bg-background pb-16 md:pb-0" role="main">
        <SettingsToggle />
        
        {/* 1. HERO - Captura atención */}
        <HeroSection />
        
        {/* 2. EXPLORADOR - Demostración del producto */}
        <MusicExplorer />
        
        {/* 3. MODELO AGREGADOR - Propuesta de valor única */}
        <AggregatorSection />
        
        {/* 4. DJ TODOTERRENO - Variedad de géneros */}
        <DJTodoterrenoSection />
        
        {/* 5. VELOCIDAD FTP - Beneficio técnico clave */}
        <SpeedSection />
        
        {/* 6. CARACTERÍSTICAS PREMIUM - Detalles técnicos */}
        <PremiumFeaturesSection />
        
        {/* 7. MURO DE GÉNEROS - Prueba social visual */}
        <section 
          className="relative py-16 md:py-24 bg-background"
          aria-labelledby="genres-heading"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 
              id="genres-heading"
              className="mb-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl"
            >
              {t("genres.title")}
            </h2>
            <p className="mb-10 font-sans text-lg text-muted-foreground">
              {t("genres.subtitle")}
            </p>
          </div>
          <InfiniteMarquee />
        </section>
        
        {/* 8. TESTIMONIOS - Prueba social */}
        <TestimonialsSection />
        
        {/* 9. CONFIANZA Y SEGURIDAD - Reducir fricción */}
        <TrustSecuritySection />
        
        {/* 10. PRECIOS - Moved to external site */}
        
        {/* 11. REGLAS DE ORO - Refuerzo de valor */}
        <TrustBar />
        
        {/* 12. FAQ - Eliminar objeciones */}
        <FAQSection />
        
        {/* 13. CTA FINAL - Última oportunidad */}
        <FinalCTA />
        
        {/* 14. GARANTÍA - Última reducción de riesgo */}
        <GuaranteeSection />

        <Footer />
        <MobileStickyBar />
        <ExitIntentPopup />
      </main>
    </>
  );
};

export default Index;
