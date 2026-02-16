import { Zap, ShieldCheck, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type FooterProps = {
  whatsappJoinUrl: string;
  onCtaClick?: () => void;
};

export default function Footer({ whatsappJoinUrl, onCtaClick }: FooterProps) {
  const isInternal = whatsappJoinUrl.startsWith("/");

  return (
    <footer>
      <div className="border-t border-[#5E5E5E] bg-[#111111]/30 px-4 py-16 text-center">
        <h2 className="mx-auto max-w-2xl font-bebas text-4xl uppercase text-[#EFEFEF] md:text-5xl">
          ¿Listo para llegar a tu próximo evento sin estrés?
        </h2>
        <p className="mx-auto mt-3 max-w-lg font-sans text-sm text-muted-foreground">
          Únete a +4,800 DJs que ya dejaron de perder tiempo buscando música.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <Button
            asChild
            className="min-h-[56px] w-full bg-[#AA0202] px-6 font-bebas text-2xl uppercase tracking-wide text-[#EFEFEF] shadow-lg hover:bg-[#8A0101]"
            onClick={onCtaClick}
          >
            {isInternal ? (
              <Link to={whatsappJoinUrl}>
                <Zap className="h-5 w-5" />
                INICIAR MI PRUEBA DE 7 DÍAS
              </Link>
            ) : (
              <a href={whatsappJoinUrl} target="_blank" rel="noopener noreferrer">
                <Zap className="h-5 w-5" />
                INICIAR MI PRUEBA DE 7 DÍAS
              </a>
            )}
          </Button>

          {/* Trust badges below CTA */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-sans text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              7 días gratis
            </span>
            <span className="inline-flex items-center gap-1.5 font-sans text-xs">
              <Lock className="h-3.5 w-3.5 text-green-500" />
              Pago seguro
            </span>
            <span className="font-sans text-xs">
              Cancela cuando quieras
            </span>
          </div>

          {/* Mini payment logos */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-semibold text-muted-foreground">
            <span className="rounded border border-border/60 px-2 py-1">Stripe</span>
            <span className="rounded border border-border/60 px-2 py-1">VISA</span>
            <span className="rounded border border-border/60 px-2 py-1">MC</span>
            <span className="rounded border border-border/60 px-2 py-1">PayPal</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#111111] bg-[#070707] py-8 text-center">
        <p className="font-sans text-sm text-muted-foreground">
          © 2026 Video Remixes Pack, LLC. Todos los derechos reservados.
        </p>
        <nav className="mt-4 flex justify-center gap-4 font-sans text-xs text-muted-foreground">
          <Link to="/terms_and_conditions" className="hover:text-[#EFEFEF]">
            Términos y Condiciones
          </Link>
          <Link to="/privacy_policy" className="hover:text-[#EFEFEF]">
            Política de Privacidad
          </Link>
          <Link to="/help" className="hover:text-[#EFEFEF]">
            Soporte
          </Link>
        </nav>
      </div>
    </footer>
  );
}
