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
import { checkEmailAvailability, loginWithEmail } from "@/lib/productionApi";
import logoWhite from "@/assets/logo-white.webp";

type Step = "email" | "password" | "success";

export default function Login() {
  const { language } = useLanguage();

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
        isSpanish
          ? "No pudimos validar tu correo en este momento. Si ya pagaste, revisa tu email (y spam) o contáctanos en Soporte."
          : "We couldn’t validate your email right now. If you already paid, check your email (and spam) or contact Support.",
      );
      if (verifyError instanceof Error) {
        console.error(verifyError.message);
      }
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
          ? "No se pudo iniciar sesión en este momento. Intenta de nuevo más tarde o contáctanos en Soporte."
          : "We couldn’t sign you in right now. Please try again later or contact Support.",
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
    <main className="brand-frame min-h-screen bg-[#070707]">
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto max-w-4xl px-4">
          <div className="mb-10 flex justify-center">
            <Link to="/">
              <img
                src={logoWhite}
                alt="VideoRemixesPack"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="mx-auto max-w-2xl rounded-2xl border border-[#5E5E5E]/60 bg-[#111111] p-8 text-center shadow-xl md:p-12">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5E5E5E] bg-[#111111] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#AA0202]">
              <ShieldCheck className="h-4 w-4" />
              {isSpanish ? "Acceso seguro" : "Secure access"}
            </p>

            <h1 className="font-bebas text-4xl font-black leading-tight md:text-5xl">
              {isSpanish ? "Te damos la bienvenida a VideoRemixesPack" : "Welcome to VideoRemixesPack"}
            </h1>
            <p className="mt-4 text-zinc-400">
              {isSpanish
                ? "Usa el mismo flujo del sitio en producción para validar tu acceso."
                : "Use the same flow as production to validate your access."}
            </p>

            {step !== "success" && (
              <button
                type="button"
                onClick={handleBack}
                disabled={step === "email"}
                className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-foreground"
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

                <Button
                  type="submit"
                  className="h-12 w-full font-bold disabled:opacity-100 disabled:bg-[#6b6b6b] disabled:text-white/75"
                  disabled={!canContinueEmail || submitting}
                >
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
                  <p className="text-sm text-zinc-400">{isSpanish ? "Cuenta detectada" : "Account found"}</p>
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

                <Button
                  type="submit"
                  className="h-12 w-full font-bold disabled:opacity-100 disabled:bg-[#6b6b6b] disabled:text-white/75"
                  disabled={!password.trim() || submitting}
                >
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
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#AA0202]/15 text-[#AA0202]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="font-semibold text-foreground">
                  {isSpanish ? "Sesión iniciada correctamente" : "Session started successfully"}
                </p>
                <p className="text-sm text-zinc-400">{userName || email}</p>

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
                  className="text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-foreground hover:underline"
                >
                  {isSpanish ? "Cerrar sesión local" : "Clear local session"}
                </button>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <p className="mt-8 text-xs text-zinc-400">
              {isSpanish ? "¿Prefieres usar el portal oficial?" : "Prefer the official portal?"} {" "}
              <a
                href="https://videoremixpack.com/login"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {isSpanish ? "Abrir videoremixpack.com/login" : "Open videoremixpack.com/login"}
              </a>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
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
