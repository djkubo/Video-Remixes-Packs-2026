import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { checkEmailAvailability, loginWithEmail } from "@/lib/productionApi";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

type Step = "email" | "password" | "success";

export default function Login() {
  const { language } = useLanguage();
  const { theme } = useTheme();

  const isSpanish = language === "es";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  const canContinueEmail = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  const handleVerifyEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!canContinueEmail) return;

    setSubmitting(true);
    setError(null);

    try {
      const check = await checkEmailAvailability(email.trim());

      if (!check.exists) {
        setError(
          isSpanish
            ? "No encontramos una cuenta con ese correo."
            : "We could not find an account with that email.",
        );
        return;
      }

      setUserName(check.user?.fullName || "");
      setStep("password");
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : isSpanish
            ? "No pudimos validar tu correo"
            : "Could not validate your email",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!password.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = await loginWithEmail(email.trim(), password);
      sessionStorage.setItem("vr_access_token", payload.access_token);
      sessionStorage.setItem("vr_refresh_token", payload.refresh_token);
      sessionStorage.setItem("vr_user", JSON.stringify(payload.user));
      setUserName(payload.user.fullName || payload.user.email || "");
      setPassword("");
      setStep("success");
    } catch (loginError) {
      setError(
        isSpanish
          ? "No se pudo iniciar sesión. Verifica tus datos."
          : "Login failed. Please verify your credentials.",
      );
      if (loginError instanceof Error) {
        console.error(loginError.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === "password") {
      setStep("email");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 hero-gradient opacity-60" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-4xl px-4">
          <div className="mb-10 flex justify-center">
            <Link to="/">
              <img
                src={theme === "dark" ? logoWhite : logoDark}
                alt="VideoRemixesPack"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-card/90 p-8 text-center shadow-xl backdrop-blur-sm md:p-12">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-4 w-4" />
              {isSpanish ? "Acceso seguro" : "Secure access"}
            </p>

            <h1 className="font-display text-4xl font-black leading-tight md:text-5xl">
              {isSpanish ? "Te damos la bienvenida a VideoRemixesPacks" : "Welcome to VideoRemixesPacks"}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {isSpanish
                ? "Usa el mismo flujo del sitio en producción para validar tu acceso."
                : "Use the same flow as production to validate your access."}
            </p>

            {step !== "success" && (
              <button
                type="button"
                onClick={handleBack}
                disabled={step === "email"}
                className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {isSpanish ? "Volver" : "Back"}
              </button>
            )}

            {step === "email" && (
              <form onSubmit={handleVerifyEmail} className="mt-8 space-y-4 text-left">
                <label className="block text-sm font-semibold text-foreground">
                  {isSpanish ? "Correo electrónico" : "Email address"}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={isSpanish ? "Ingresa tu correo electrónico" : "Enter your email"}
                  className="h-12"
                  autoComplete="email"
                  required
                />

                <Button type="submit" className="h-12 w-full font-bold" disabled={!canContinueEmail || submitting}>
                  {submitting
                    ? isSpanish
                      ? "Validando..."
                      : "Validating..."
                    : isSpanish
                      ? "Continuar"
                      : "Continue"}
                </Button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleLogin} className="mt-8 space-y-4 text-left">
                <div>
                  <p className="text-sm text-muted-foreground">{isSpanish ? "Cuenta detectada" : "Account found"}</p>
                  <p className="font-semibold text-foreground">{userName || email}</p>
                </div>

                <label className="block text-sm font-semibold text-foreground">
                  {isSpanish ? "Contraseña" : "Password"}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSpanish ? "Ingresa tu contraseña" : "Enter your password"}
                  className="h-12"
                  autoComplete="current-password"
                  required
                />

                <Button type="submit" className="h-12 w-full font-bold" disabled={!password.trim() || submitting}>
                  {submitting
                    ? isSpanish
                      ? "Iniciando sesión..."
                      : "Signing in..."
                    : isSpanish
                      ? "Iniciar sesión"
                      : "Sign in"}
                </Button>
              </form>
            )}

            {step === "success" && (
              <div className="mt-8 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="font-semibold text-foreground">
                  {isSpanish ? "Sesión iniciada correctamente" : "Session started successfully"}
                </p>
                <p className="text-sm text-muted-foreground">{userName || email}</p>

                <Button asChild className="h-12 w-full font-bold">
                  <Link to="/trends">{isSpanish ? "Ir a Tendencias" : "Go to Trends"}</Link>
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem("vr_access_token");
                    sessionStorage.removeItem("vr_refresh_token");
                    sessionStorage.removeItem("vr_user");
                    setStep("email");
                    setPassword("");
                    setError(null);
                  }}
                  className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                >
                  {isSpanish ? "Cerrar sesión local" : "Clear local session"}
                </button>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <p className="mt-8 text-xs text-muted-foreground">
              {isSpanish ? "¿Prefieres usar el portal oficial?" : "Prefer the official portal?"} {" "}
              <a
                href="https://videoremixespacks.com/login"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {isSpanish ? "Abrir videoremixespacks.com/login" : "Open videoremixespacks.com/login"}
              </a>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {isSpanish ? "¿Necesitas ayuda?" : "Need help?"}{" "}
              <a
                href="/help"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {isSpanish ? "Contactar soporte" : "Contact support"}
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
