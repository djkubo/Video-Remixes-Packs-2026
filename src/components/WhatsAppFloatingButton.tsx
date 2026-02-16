import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/message/JKXMYLQH3SORK1";

export default function WhatsAppFloatingButton() {
    const [isVisible, setIsVisible] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isVisible || dismissed) return;
        const tooltipTimer = setTimeout(() => setShowTooltip(true), 8000);
        return () => clearTimeout(tooltipTimer);
    }, [isVisible, dismissed]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40 hidden md:block">
            {/* Tooltip bubble */}
            {showTooltip && !dismissed && (
                <div className="absolute -left-52 bottom-16 w-48 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative rounded-xl border border-[#2A3942] bg-[#202C33] px-3 py-2.5 shadow-xl">
                        <button
                            onClick={() => setDismissed(true)}
                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#111111] border border-[#5E5E5E] text-muted-foreground hover:text-[#EFEFEF]"
                        >
                            <X className="h-3 w-3" />
                        </button>
                        <p className="font-sans text-xs text-[#E9EDEF]">
                            ¿Tienes dudas? Escríbenos por WhatsApp 💬
                        </p>
                        {/* Triangle pointer */}
                        <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-[#2A3942] bg-[#202C33]" />
                    </div>
                </div>
            )}

            {/* Button */}
            <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_20px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_30px_rgba(37,211,102,0.55)]"
                aria-label="Contactar por WhatsApp"
            >
                <MessageCircle className="h-7 w-7 text-white transition-transform group-hover:scale-110" />
            </a>
        </div>
    );
}
