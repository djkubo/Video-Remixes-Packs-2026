import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Package,
  ShieldCheck,
  Truck,
  Usb,
  Zap,
} from "lucide-react";
import SettingsToggle from "@/components/SettingsToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { countryNameFromCode, detectCountryCodeFromTimezone } from "@/lib/country";

type CountryData = {
  country_code: string;
  country_name: string;
  dial_code: string;
};

const COUNTRY_DIAL_CODES: Record<string, string> = {
  US: "+1",
  MX: "+52",
  ES: "+34",
  AR: "+54",
  CO: "+57",
  CL: "+56",
  PE: "+51",
  VE: "+58",
  EC: "+593",
  GT: "+502",
  CU: "+53",
  DO: "+1",
  HN: "+504",
  SV: "+503",
  NI: "+505",
  CR: "+506",
  PA: "+507",
  UY: "+598",
  PY: "+595",
  BO: "+591",
  PR: "+1",
  BR: "+55",
  PT: "+351",
  CA: "+1",
  GB: "+44",
  FR: "+33",
  DE: "+49",
  IT: "+39",
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function normalizePhoneInput(input: string): { clean: string; digits: string } {
  const clean = input.trim().replace(/[\s().-]/g, "");
  const digits = clean.startsWith("+") ? clean.slice(1) : clean;
  return { clean, digits };
}

export default function Usb128() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [countryData, setCountryData] = useState<CountryData>({
    country_code: "US",
    country_name: "United States",
    dial_code: "+1",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const paymentBadges = useMemo(
    () => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "PayPal"],
    []
  );

  useEffect(() => {
    // Basic page title for this route (SPA).
    document.title = "USB LATIN POWER 128 GB – 10 000 hits latinos HQ por $147";
  }, []);

  // Detect user's country (best-effort; timezone-based so we avoid CORS/network issues).
  useEffect(() => {
    const code = detectCountryCodeFromTimezone() || "US";
    const dialCode = COUNTRY_DIAL_CODES[code] || "+1";
    setCountryData({
      country_code: code,
      country_name: countryNameFromCode(code, language === "es" ? "es" : "en"),
      dial_code: dialCode,
    });
  }, [language]);

  const openOrder = useCallback(() => setIsOrderOpen(true), []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const { clean: cleanPhone, digits: phoneDigits } = normalizePhoneInput(formData.phone);

      if (!name || !email || !cleanPhone) {
        toast({
          title: language === "es" ? "Campos requeridos" : "Required fields",
          description:
            language === "es"
              ? "Por favor completa todos los campos."
              : "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidEmail(email)) {
        toast({
          title: language === "es" ? "Email inválido" : "Invalid email",
          description:
            language === "es"
              ? "Por favor ingresa un email válido."
              : "Please enter a valid email.",
          variant: "destructive",
        });
        return;
      }

      // NOTE: Supabase RLS policy enforces phone length <= 20.
      if (
        cleanPhone.length > 20 ||
        !/^\+?\d{7,20}$/.test(cleanPhone) ||
        !/[1-9]/.test(phoneDigits)
      ) {
        toast({
          title: language === "es" ? "WhatsApp inválido" : "Invalid WhatsApp",
          description:
            language === "es"
              ? "Número de teléfono no válido."
              : "Phone number is not valid.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const leadId = crypto.randomUUID();

        const { error: insertError } = await supabase.from("leads").insert({
          id: leadId,
          name,
          email,
          phone: cleanPhone,
          country_code: countryData.dial_code,
          country_name: countryData.country_name,
          source: "usb128",
          tags: ["usb128", "usb_order"],
        });

        if (insertError) throw insertError;

        // Best-effort ManyChat sync (don't block checkout on a transient error).
        try {
          const { error: syncError } = await supabase.functions.invoke("sync-manychat", {
            body: { leadId },
          });
          if (syncError && import.meta.env.DEV) {
            console.warn("ManyChat sync error:", syncError);
          }
        } catch (syncErr) {
          if (import.meta.env.DEV) console.warn("ManyChat sync threw:", syncErr);
        }

        setIsOrderOpen(false);

        // Try to redirect to Stripe Checkout (if configured). If not, fallback to thank-you.
        try {
          const { data: checkout, error: checkoutError } = await supabase.functions.invoke(
            "stripe-checkout",
            {
              body: { leadId, product: "usb128" },
            }
          );

          if (checkoutError && import.meta.env.DEV) {
            console.warn("Stripe checkout error:", checkoutError);
          }

          const url = (checkout as { url?: unknown } | null)?.url;
          if (typeof url === "string" && url.length > 0) {
            window.location.assign(url);
            return;
          }
        } catch (stripeErr) {
          if (import.meta.env.DEV) console.warn("Stripe invoke threw:", stripeErr);
        }

        navigate("/usb128/gracias");
      } catch (err) {
        console.error("USB128 lead submit error:", err);
        toast({
          title: language === "es" ? "Error" : "Error",
          description:
            language === "es"
              ? "Hubo un problema al enviar tus datos. Intenta de nuevo."
              : "There was a problem submitting your data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [countryData.dial_code, countryData.country_name, formData, isSubmitting, language, navigate, toast]
  );

  return (
    <main className="min-h-screen bg-background">
      <SettingsToggle />

      {/* Top feature strip */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-2 px-4 py-4 text-center text-xs text-muted-foreground md:grid-cols-3 md:text-sm">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>+10,000 Canciones en MP3 (320 kbps) listas para mezclar</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span>Organizadas por géneros para máxima facilidad</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Usb className="h-4 w-4 text-primary" />
            <span>Compatible con Serato, Virtual DJ, Rekordbox y más</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-60" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-16 md:pb-20 md:pt-24">
          <div className="flex items-center justify-center">
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPacks"
              className="h-14 w-auto object-contain md:h-16"
            />
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-start">
            {/* Product visual (stylized) */}
            <div className="glass-card overflow-hidden p-5">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/25 via-background to-background">
                <div className="absolute inset-0 opacity-70">
                  <div className="absolute -left-10 top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                  <div className="absolute -right-12 bottom-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                </div>
                <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-card/40">
                    <Usb className="h-10 w-10 text-primary" />
                  </div>
                  <p className="mt-6 text-sm text-muted-foreground">
                    Samsung BAR Plus
                  </p>
                  <p className="font-display text-4xl font-black tracking-wide">
                    128 GB
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    USB 3.1 • Metal • Lista para gigs
                  </p>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div>
              <h1 className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
                DJ, deja el Wi‑Fi y conecta{" "}
                <span className="text-gradient-red">10,000</span> hits latinos en
                5 segundos.
              </h1>

              <p className="mt-4 text-sm text-muted-foreground md:text-base">
                Samsung BAR Plus 128 GB · 30 géneros curados ·{" "}
                <span className="font-bold text-primary">$147</span> envío gratis
                solo a <span className="font-bold text-primary">Estados Unidos</span>
              </p>

              <div className="mt-6">
                <Button
                  onClick={openOrder}
                  className="btn-primary-glow h-12 w-full text-base font-black md:w-auto md:px-10"
                >
                  👉¡LO QUIERO YA👈 Por tan solo $147
                </Button>

                <div className="mt-4 rounded-xl border border-border/50 bg-card/60 p-3 text-center text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Quedan</span>{" "}
                  /300 unidades · <span className="font-semibold text-foreground">para que suba a $197</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {paymentBadges.map((label) => (
                    <Badge
                      key={label}
                      variant="outline"
                      className="border-border/60 bg-card/40 px-3 py-1 text-[11px] text-muted-foreground"
                    >
                      <CreditCard className="mr-2 h-3 w-3 text-primary" />
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-8 glass-card p-5">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>10,000 MP3 320 kbps – sonido nítido, sin rips chafas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>Tags BPM &amp; Key: encuentra tu siguiente track en 2 segy explicit.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>USB 3.1 a 400 MB/s - Carga más raído que el tiempo en que desaparece tu ex</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>Metal Resistente al agua, golpes y rayos Gamma - pa&apos; la vida del DJ Callejero.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Genres */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-4xl font-black md:text-5xl">
            Tus clientes piden TODO esto (y ya viene en la USB)
          </h2>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {["Bachata", "Merengue", "Cumbia", "Norteño", "Mariachi"].map((g) => (
              <Badge
                key={g}
                className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/15"
              >
                {g}
              </Badge>
            ))}
          </div>

          <p className="mt-8 text-center font-display text-4xl font-black text-gradient-red md:text-5xl">
            Y muchos más
          </p>
        </div>
      </section>

      {/* Speed / Benefits */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="glass-card p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-card/60">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <p className="font-display text-2xl font-black">Carga en 5 seg</p>
              </div>

              <h3 className="mt-6 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                Menos espera, más mezcla,{" "}
                <span className="text-gradient-red">más propinas</span>.
              </h3>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <span>Ahorra 10 h/sem | La curaduría está lista; dedícalas a vender.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <span>La BAR Plus metálica se ve 🔥 en cabina.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <span>Diseñada pa’ USA‑Latino gigs | Bodas, quince y clubs hispanos cubiertos.</span>
                </li>
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="glass-card p-6">
                <p className="font-display text-2xl font-black">dj&apos;s que han ganado con la USB</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Lo Que Dicen Nuestros Clientes <span className="font-semibold">(Testimonios Reales)</span>
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-1">
                {[
                  {
                    quote:
                      "“Olvidé lo que es descargar música cada fin de semana. Ahora solo conecto y listo, puro éxito en cada evento.\"",
                    who: "- Ricardo (Houston tx)",
                  },
                  {
                    quote:
                      "\"La mejor inversión que hice en mi carrera de DJ. Calidad de primera, organización increíble y un soporte genial.\"",
                    who: "- Javier (Miami fl)",
                  },
                  {
                    quote:
                      "\"Esta USB cambió totalmente mi negocio. Ahora tengo más eventos y gano más dinero sin estrés. ¡Súper recomendada!\"",
                    who: "- Carlos (Los Angeles, CA)",
                  },
                ].map((t) => (
                  <div key={t.who} className="glass-card p-6">
                    <p className="text-sm text-muted-foreground">{t.quote}</p>
                    <p className="mt-4 font-display text-xl font-black">{t.who}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center">
            <p className="font-display text-2xl font-black">¿No te sientes seguro?</p>
            <h2 className="mt-2 font-display text-5xl font-black">
              <span className="text-gradient-red">¡Te lo aclaro!!</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Si sigues con dudas después de leer esto es que no quieres chingarle
            </p>
          </div>

          <div className="mt-10 glass-card p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  ¿Funciona con Serato, Rekordbox, VDJ, Traktor?
                </AccordionTrigger>
                <AccordionContent>
                  Sí, plug‑and‑play. Formateada exFAT para Mac &amp; Windows.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>¿Formato de los archivos?</AccordionTrigger>
                <AccordionContent>
                  MP3 320 kbps etiquetados con BPM, Key y género.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>¿Envían fuera de EE. UU.?</AccordionTrigger>
                <AccordionContent>NO. Sólo territory gringo.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>¿Cuánto tarda?</AccordionTrigger>
                <AccordionContent>
                  USPS Priority: 3‑5 días hábiles. Tracking en 24 h.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>¿Y si la USB llega dañada?</AccordionTrigger>
                <AccordionContent>Te mandamos otra sin costo. Punto.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger>¿Puedo devolverla?</AccordionTrigger>
                <AccordionContent>Sólo si está sellada y sin copiar. 14 días.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              onClick={openOrder}
              className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
            >
              👉¡LO QUIERO YA👈 Por tan solo $147
            </Button>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="glass-card p-8">
            <h2 className="text-center font-display text-4xl font-black md:text-5xl">
              Nuestra Garantía de Confianza Total
            </h2>

            <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 text-primary" />
                <span>USPS Priority incluido. Directo hasta tu casa en aproximadamente 5 días.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <span>Si tu USB no llega en 7 días hábiles, enviamos otra gratis.</span>
              </li>
              <li className="flex items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 text-primary" />
                <span>Garantía Samsung 5 años.</span>
              </li>
            </ul>

            <div className="mt-10 flex justify-center">
              <Button
                onClick={openOrder}
                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
              >
                ¡ORDENA TU USB AHORA MISMO! No pierdas más tiempo buscando música
              </Button>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Copyrights 2025 |Gustavo Garcia™ | Terms &amp; Conditions
          </p>
        </div>
      </section>

      {/* Order modal */}
      <Dialog open={isOrderOpen} onOpenChange={setIsOrderOpen}>
        <DialogContent className="glass-card border-border/60 p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {language === "es" ? "Antes de pagar" : "Before checkout"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Déjanos tus datos para confirmación, tracking y soporte."
                : "Leave your details for confirmation, tracking, and support."}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 md:p-7">
            <h3 className="font-display text-3xl font-black">
              {language === "es" ? "Antes de pagar" : "Before checkout"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === "es"
                ? "Déjanos tus datos para confirmación, tracking y soporte. Después te enviamos al checkout."
                : "Leave your details for confirmation, tracking, and support. Then we’ll send you to checkout."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="usb128-name">{language === "es" ? "Nombre" : "Name"}</Label>
                <Input
                  id="usb128-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={language === "es" ? "Tu nombre completo" : "Your full name"}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usb128-email">Email</Label>
                <Input
                  id="usb128-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usb128-phone">
                  {language === "es" ? "WhatsApp" : "WhatsApp"}
                </Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-10 shrink-0 border-border/60 bg-card/40 px-3 text-sm text-muted-foreground"
                    title={countryData.country_name}
                  >
                    {countryData.dial_code}
                  </Badge>
                  <Input
                    id="usb128-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder={language === "es" ? "Tu número" : "Your number"}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "es"
                    ? "Envío gratis solo a Estados Unidos (EE. UU.)."
                    : "Free shipping only to the United States (US)."}
                </p>
              </div>

              <Button
                type="submit"
                className="btn-primary-glow h-12 w-full text-base font-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "es" ? "Enviando..." : "Submitting..."}
                  </>
                ) : (
                  language === "es" ? "Continuar al checkout" : "Continue to checkout"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {language === "es"
                  ? "Al continuar aceptas recibir información y soporte sobre tu pedido."
                  : "By continuing you agree to receive information and support about your order."}
              </p>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
