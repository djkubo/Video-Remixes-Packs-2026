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
import RouteMenu from "@/components/RouteMenu";

const queryClient = new QueryClient();
const DevTestPopup = import.meta.env.DEV ? lazy(() => import("./pages/TestPopup")) : null;

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Gratis = lazy(() => import("./pages/Gratis"));
const GratisThankYou = lazy(() => import("./pages/GratisThankYou"));
const Usb128 = lazy(() => import("./pages/Usb128"));
const Usb128ThankYou = lazy(() => import("./pages/Usb128ThankYou"));
const Usb500gb = lazy(() => import("./pages/Usb500gb"));
const Usb500gbThankYou = lazy(() => import("./pages/Usb500gbThankYou"));
const Anual = lazy(() => import("./pages/Anual"));
const AnualThankYou = lazy(() => import("./pages/AnualThankYou"));
const Membresia = lazy(() => import("./pages/Membresia"));
const MembresiaThankYou = lazy(() => import("./pages/MembresiaThankYou"));
const Explorer = lazy(() => import("./pages/Explorer"));
const DjEdits = lazy(() => import("./pages/DjEdits"));
const DjEditsThankYou = lazy(() => import("./pages/DjEditsThankYou"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminMusic = lazy(() => import("./pages/AdminMusic"));
const Admin = lazy(() => import("./pages/Admin"));
const Help = lazy(() => import("./pages/Help"));
const Login = lazy(() => import("./pages/Login"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

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
                  <Suspense
                    fallback={
                      <div className="brand-frame min-h-screen bg-background flex items-center justify-center p-6">
                        <div className="glass-card px-6 py-4 text-sm text-muted-foreground">
                          Cargando...
                        </div>
                      </div>
                    }
                  >
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

                      <Route path="/usb500" element={<Usb500gb />} />
                      <Route path="/usb500/gracias" element={<Usb500gbThankYou />} />

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
                      <Route path="/djedits/gracias" element={<DjEditsThankYou />} />
                      {/* Aliases requested by marketing */}
                      <Route path="/DJEDITS" element={<DjEdits />} />
                      <Route path="/DJEDITS/gracias" element={<DjEditsThankYou />} />

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
                  </Suspense>
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
