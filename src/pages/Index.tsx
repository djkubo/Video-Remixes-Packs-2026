import { useEffect, useMemo } from "react";
import HeroSection from "@/components/HeroSection";
import MusicExplorer from "@/components/MusicExplorer";
import FAQSection from "@/components/FAQSection";
import TrustSecuritySection from "@/components/TrustSecuritySection";
import OfferComparisonSection from "@/components/OfferComparisonSection";
import FinalCTA from "@/components/FinalCTA";
import GuaranteeSection from "@/components/GuaranteeSection";
import Footer from "@/components/Footer";
import MobileStickyBar from "@/components/MobileStickyBar";
import HowItWorksSection from "@/components/HowItWorksSection";
import CompactSocialProofSection from "@/components/CompactSocialProofSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { useAnalytics } from "@/hooks/useAnalytics";
import { isExperimentEnabled } from "@/lib/croFlags";
import { getExperimentAssignment } from "@/lib/experiments";

const Index = () => {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();

  // Initialize engagement tracking (scroll depth, time on page, video plays)
  useEngagementTracking();

  const socialProofAssignment = useMemo(
    () =>
      isExperimentEnabled("social_proof_position")
        ? getExperimentAssignment("social_proof_position")
        : {
            id: "social_proof_position" as const,
            variant: "A" as const,
            assignedAt: new Date(0).toISOString(),
          },
    []
  );

  useEffect(() => {
    trackEvent("experiment_exposure", {
      funnel_step: "home",
      experiment_assignments: [socialProofAssignment],
    });
  }, [socialProofAssignment, trackEvent]);

  const showSocialProofEarly = socialProofAssignment.variant === "A";

  return (
    <>
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        {language === "es" ? "Saltar al contenido" : "Skip to main content"}
      </a>

      <main id="main-content" className="min-h-screen bg-background pb-16 md:pb-0" role="main">
        <HeroSection />

        {showSocialProofEarly && <CompactSocialProofSection />}

        <HowItWorksSection />

        <OfferComparisonSection />

        {!showSocialProofEarly && <CompactSocialProofSection />}

        <MusicExplorer />

        <TrustSecuritySection />

        <FAQSection />

        <FinalCTA />

        <GuaranteeSection />

        <Footer />
        <MobileStickyBar />
      </main>
    </>
  );
};

export default Index;
