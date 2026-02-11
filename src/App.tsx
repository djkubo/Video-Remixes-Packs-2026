import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";
import Gratis from "./pages/Gratis";
import GratisThankYou from "./pages/GratisThankYou";
import Usb128 from "./pages/Usb128";
import Usb128ThankYou from "./pages/Usb128ThankYou";
import Usb500gb from "./pages/Usb500gb";
import Usb500gbThankYou from "./pages/Usb500gbThankYou";
import Anual from "./pages/Anual";
import AnualThankYou from "./pages/AnualThankYou";
import Membresia from "./pages/Membresia";
import MembresiaThankYou from "./pages/MembresiaThankYou";
import Explorer from "./pages/Explorer";
import DjEdits from "./pages/DjEdits";
import AdminLogin from "./pages/AdminLogin";
import AdminMusic from "./pages/AdminMusic";
import Admin from "./pages/Admin";
import Help from "./pages/Help";
import Login from "./pages/Login";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RouteMenu from "@/components/RouteMenu";

const queryClient = new QueryClient();
const DevTestPopup = import.meta.env.DEV ? lazy(() => import("./pages/TestPopup")) : null;

const App = () => {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <RouteMenu />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    {/* Production route aliases */}
                    <Route path="/trends" element={<Index />} />
                    <Route path="/genres" element={<Explorer />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/terms_and_conditions" element={<TermsAndConditions />} />
                    <Route path="/privacy_policy" element={<PrivacyPolicy />} />

                    <Route path="/gratis" element={<Gratis />} />
                    <Route path="/gratis/gracias" element={<GratisThankYou />} />

                    <Route path="/usb128" element={<Usb128 />} />
                    <Route path="/usb128/gracias" element={<Usb128ThankYou />} />

                    <Route path="/usb-500gb" element={<Usb500gb />} />
                    <Route path="/usb-500gb/gracias" element={<Usb500gbThankYou />} />

                    <Route path="/anual" element={<Anual />} />
                    <Route path="/anual/gracias" element={<AnualThankYou />} />
                    {/* Aliases requested by marketing (uppercase URLs) */}
                    <Route path="/ANUAL" element={<Anual />} />
                    <Route path="/ANUAL/gracias" element={<AnualThankYou />} />

                    <Route path="/membresia" element={<Membresia />} />
                    <Route path="/membresia/gracias" element={<MembresiaThankYou />} />
                    {/* Aliases requested by marketing (uppercase URLs) */}
                    <Route path="/MEMBRESIA" element={<Membresia />} />
                    <Route path="/MEMBRESIA/gracias" element={<MembresiaThankYou />} />
                    {/* Common short alias (legacy) */}
                    <Route path="/plan" element={<Membresia />} />

                    <Route path="/explorer" element={<Explorer />} />

                    <Route path="/djedits" element={<DjEdits />} />
                    {/* Aliases requested by marketing */} 
                    <Route path="/DJEDITS" element={<DjEdits />} />

                    <Route path="/gracias" element={<ThankYou />} />

                    {import.meta.env.DEV && DevTestPopup && (
                      <Route
                        path="/test-popup"
                        element={
                          <Suspense fallback={null}>
                            <DevTestPopup />
                          </Suspense>
                        }
                      />
                    )}
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/music" element={<AdminMusic />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
