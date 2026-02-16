import { useCallback } from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import HeroCommunitySection from "@/components/landing/HeroCommunitySection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DemosSection from "@/components/landing/DemosSection";
import PricingSection from "@/components/landing/PricingSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import FaqSection from "@/components/landing/FaqSection";
import Footer from "@/components/landing/Footer";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDataLayer } from "@/hooks/useDataLayer";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";

const PLAN_URL = "/plan";

export default function Index() {
  const { trackEvent } = useAnalytics();
  const { trackClick } = useDataLayer();

  useEngagementTracking();

  const trackCta = useCallback(
    (buttonText: string, ctaId: string, destination: string) => {
      trackClick(buttonText);
      trackEvent("click", {
        button_text: buttonText,
        cta_id: ctaId,
        section: "hero",
        destination,
        funnel_step: "home",
      });
    },
    [trackClick, trackEvent]
  );

  return (
    <LandingLayout>
      <HeroCommunitySection
        whatsappGroupUrl={PLAN_URL}
        onPrimaryCtaClick={() =>
          trackCta("INICIAR PRUEBA DE 7 DÍAS (100GB)", "hero_go_plan", PLAN_URL)
        }
        onSecondaryCtaClick={() => trackCta("VER DEMOS Y PRECIOS", "hero_scroll_demos_pricing", "#demos")}
      />
      <HowItWorksSection />
      <DemosSection />
      <PricingSection checkoutUrl={PLAN_URL} />
      <SocialProofSection />
      <FaqSection />
      <Footer
        whatsappJoinUrl={PLAN_URL}
        onCtaClick={() =>
          trackCta("INICIAR MI PRUEBA DE 7 DÍAS", "footer_go_plan", PLAN_URL)
        }
      />
    </LandingLayout>
  );
}
