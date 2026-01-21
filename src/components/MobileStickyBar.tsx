import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileStickyBar = () => {
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
          
          {/* Bar content */}
          <div className="flex items-center justify-between gap-3 bg-background/98 px-4 py-3 backdrop-blur-xl border-t border-primary/30">
            <p className="text-sm text-muted-foreground font-sans">
              ¿Listo para empezar?
            </p>
            <Button
              asChild
              size="sm"
              className="btn-primary-glow h-11 gap-2 px-5 font-bold text-sm"
            >
              <a href="https://videoremixespacks.com/plan">
                <Zap className="h-4 w-4" />
                Ver Planes
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
