import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Moon, Sun, Globe, ChevronDown, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";

const SettingsToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { currency, currencies, setCurrency } = useCurrency();
  const [showCurrencyList, setShowCurrencyList] = useState(false);

  return (
    <>
      {/* Floating Settings Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg transition-all hover:bg-card hover:border-primary/50 hover:shadow-glow"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5 text-foreground" />
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setShowCurrencyList(false);
              }}
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-80 bg-card backdrop-blur-xl border-l border-border shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 p-6">
                <h2 className="font-display text-xl font-bold">
                  {language === "es" ? "Configuración" : "Settings"}
                </h2>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCurrencyList(false);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Theme Toggle */}
                <div className="space-y-3">
                  <label className="font-bebas text-sm tracking-wider text-muted-foreground">
                    {language === "es" ? "TEMA" : "THEME"}
                  </label>
                  <button
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between rounded-xl bg-secondary/50 border border-border/50 p-4 transition-all hover:bg-secondary hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon className="h-5 w-5 text-primary" />
                      ) : (
                        <Sun className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-sans font-medium">
                        {theme === "dark"
                          ? language === "es"
                            ? "Modo Oscuro"
                            : "Dark Mode"
                          : language === "es"
                          ? "Modo Claro"
                          : "Light Mode"}
                      </span>
                    </div>
                    <div
                      className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                        theme === "light" ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <motion.div
                        layout
                        className={`h-5 w-5 rounded-full bg-white shadow-md`}
                        animate={{ x: theme === "light" ? 20 : 0 }}
                      />
                    </div>
                  </button>
                </div>

                {/* Language Toggle */}
                <div className="space-y-3">
                  <label className="font-bebas text-sm tracking-wider text-muted-foreground">
                    {language === "es" ? "IDIOMA" : "LANGUAGE"}
                  </label>
                  <button
                    onClick={toggleLanguage}
                    className="flex w-full items-center justify-between rounded-xl bg-secondary/50 border border-border/50 p-4 transition-all hover:bg-secondary hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-sans font-medium">
                        {language === "es" ? "Español" : "English"}
                      </span>
                    </div>
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                      {language === "es" ? "ES" : "EN"}
                    </span>
                  </button>
                </div>

                {/* Currency Selector */}
                <div className="space-y-3">
                  <label className="font-bebas text-sm tracking-wider text-muted-foreground">
                    {language === "es" ? "MONEDA" : "CURRENCY"}
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCurrencyList(!showCurrencyList)}
                      className="flex w-full items-center justify-between rounded-xl bg-secondary/50 border border-border/50 p-4 transition-all hover:bg-secondary hover:border-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 font-bold text-primary">
                          {currency.symbol}
                        </span>
                        <div className="text-left">
                          <span className="font-sans font-medium block">
                            {currency.code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {currency.name}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          showCurrencyList ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Currency Dropdown */}
                    <AnimatePresence>
                      {showCurrencyList && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-auto rounded-xl bg-card border border-border/50 shadow-xl z-10"
                        >
                          {currencies.map((curr) => (
                            <button
                              key={curr.code}
                              onClick={() => {
                                setCurrency(curr.code);
                                setShowCurrencyList(false);
                              }}
                              className={`flex w-full items-center gap-3 p-3 transition-colors hover:bg-secondary ${
                                currency.code === curr.code
                                  ? "bg-primary/10 text-primary"
                                  : ""
                              }`}
                            >
                              <span className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-sm font-bold">
                                {curr.symbol}
                              </span>
                              <div className="text-left">
                                <span className="font-medium block text-sm">
                                  {curr.code}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {curr.name}
                                </span>
                              </div>
                              {currency.code === curr.code && (
                                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Info */}
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "es"
                      ? "Los precios se muestran como referencia y se cobran en USD al momento del pago."
                      : "Prices are shown as reference and charged in USD at checkout."}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsToggle;
