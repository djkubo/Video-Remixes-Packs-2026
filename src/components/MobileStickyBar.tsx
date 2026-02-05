import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

const MobileStickyBar = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          {/* Top fade */}
          <div className="h-4 bg-gradient-to-t from-background to-transparent" />
          
          {/* Bar content - Enhanced separation with stronger blur and subtle border */}
          <div className="flex items-center justify-between gap-3 bg-background/95 px-4 py-3 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={theme === "dark" ? logoWhite : logoDark}
                alt="VRP"
                className="h-7 w-auto object-contain flex-shrink-0"
              />
              <p className="text-sm text-muted-foreground font-sans truncate">
                {t("mobile.ready")}
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="btn-primary-glow h-11 gap-2 px-5 font-bold text-sm flex-shrink-0"
            >
              <a href="https://videoremixespacks.com/plan">
                <Zap className="h-4 w-4" />
                {t("mobile.cta")}
              </a>
            </Button>
          </div>
          
          {/* Safe area for iOS */}
          <div className="h-[env(safe-area-inset-bottom)] bg-background" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileStickyBar;
