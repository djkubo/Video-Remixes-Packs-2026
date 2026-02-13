import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type FooterProps = {
  whatsappJoinUrl: string;
  onCtaClick?: () => void;
};

export default function Footer({ whatsappJoinUrl, onCtaClick }: FooterProps) {
  return (
    <footer>
      <div className="border-t border-zinc-800 bg-zinc-900/30 px-4 py-16 text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white md:text-4xl">
          ¿Listo para llegar a tu próximo evento sin estrés?
        </h2>
        <div className="mx-auto mt-8 max-w-md">
          <Button
            asChild
            className="min-h-[56px] w-full bg-[#25D366] px-6 font-bold text-black shadow-lg hover:bg-[#1EBE5D]"
            onClick={onCtaClick}
          >
            <a href={whatsappJoinUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              QUIERO UNIRME AL GRUPO (GRATIS)
            </a>
          </Button>
        </div>
      </div>

      <div className="border-t border-zinc-900 bg-zinc-950 py-8 text-center">
        <p className="text-sm text-zinc-400">
          © 2026 Video Remixes Pack, LLC. Todos los derechos reservados.
        </p>
        <nav className="mt-4 flex justify-center gap-4 text-xs text-zinc-500">
          <Link to="/terms_and_conditions" className="hover:text-zinc-200">
            Términos y Condiciones
          </Link>
          <Link to="/privacy_policy" className="hover:text-zinc-200">
            Política de Privacidad
          </Link>
          <Link to="/help" className="hover:text-zinc-200">
            Soporte
          </Link>
        </nav>
      </div>
    </footer>
  );
}

