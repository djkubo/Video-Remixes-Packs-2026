import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDataLayer } from "@/hooks/useDataLayer";

/* ─── types ─── */
interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLeadCaptured: (leadId: string) => void;
    isSpanish: boolean;
    product: string;
    price: number;
}

/* ─── component ─── */
export default function LeadCaptureModal({
    isOpen,
    onClose,
    onLeadCaptured,
    isSpanish,
    product,
    price,
}: LeadCaptureModalProps) {
    const { trackEvent } = useAnalytics();
    const { trackEvent: trackDL } = useDataLayer();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* auto-focus first field on open */
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    /* prevent body scroll */
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);

            const trimmedName = name.trim();
            const trimmedEmail = email.trim().toLowerCase();
            const trimmedPhone = phone.trim().replace(/\s+/g, "");

            /* validation */
            if (!trimmedName || trimmedName.length < 2) {
                setError(isSpanish ? "Escribe tu nombre" : "Enter your name");
                return;
            }
            if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                setError(isSpanish ? "Email inválido" : "Invalid email");
                return;
            }
            if (!trimmedPhone || trimmedPhone.length < 7) {
                setError(
                    isSpanish
                        ? "Escribe tu WhatsApp (ej: +1 555 123 4567)"
                        : "Enter your WhatsApp (e.g. +1 555 123 4567)"
                );
                return;
            }

            setIsSubmitting(true);
            try {
                const leadId = crypto.randomUUID();

                const leadRecord = {
                    id: leadId,
                    name: trimmedName,
                    email: trimmedEmail,
                    phone: trimmedPhone,
                    source: "usb_500gb_modal",
                    source_page: window.location.pathname,
                    intent_plan: product,
                    funnel_step: "pre_checkout",
                    tags: ["usb_500gb", "pre_checkout_lead"],
                };

                const { error: insertError } = await supabase
                    .from("leads")
                    .insert(leadRecord);
                if (insertError) throw insertError;

                /* track lead capture */
                trackEvent("lead_captured", {
                    lead_id: leadId,
                    plan_id: product,
                    funnel_step: "pre_checkout",
                    source: "usb_500gb_modal",
                });
                trackDL("generate_lead", {
                    currency: "USD",
                    value: price,
                    lead_id: leadId,
                });

                /* try ManyChat sync (best effort) */
                try {
                    await supabase.functions.invoke("sync-manychat", {
                        body: { leadId },
                    });
                } catch {
                    // ignore
                }

                onLeadCaptured(leadId);
            } catch (err) {
                console.error("Lead capture error:", err);
                setError(
                    isSpanish
                        ? "Hubo un error. Intenta de nuevo."
                        : "Something went wrong. Try again."
                );
            } finally {
                setIsSubmitting(false);
            }
        },
        [name, email, phone, isSpanish, product, price, trackEvent, trackDL, onLeadCaptured]
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* modal card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: "spring", damping: 22, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md rounded-2xl border border-[#5E5E5E]/60 bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-6 md:p-8 shadow-2xl"
                    >
                        {/* close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* header */}
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#AA0202]/15">
                                <ShieldCheck className="h-7 w-7 text-[#AA0202]" />
                            </div>
                            <h2
                                className="text-2xl font-bold tracking-tight"
                                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}
                            >
                                {isSpanish
                                    ? "ÚLTIMOS DATOS PARA TU PEDIDO"
                                    : "LAST STEP BEFORE CHECKOUT"}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-400">
                                {isSpanish
                                    ? "Para procesar tu USB y enviarte confirmación"
                                    : "To process your USB and send confirmation"}
                            </p>
                        </div>

                        {/* form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    {isSpanish ? "Nombre completo" : "Full name"}
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={isSpanish ? "Ej: Juan Pérez" : "E.g. John Smith"}
                                    className="w-full rounded-lg border border-[#5E5E5E]/50 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#AA0202] focus:outline-none focus:ring-1 focus:ring-[#AA0202]/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    {isSpanish ? "Email" : "Email"}
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full rounded-lg border border-[#5E5E5E]/50 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#AA0202] focus:outline-none focus:ring-1 focus:ring-[#AA0202]/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 555 123 4567"
                                    className="w-full rounded-lg border border-[#5E5E5E]/50 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#AA0202] focus:outline-none focus:ring-1 focus:ring-[#AA0202]/50 transition-colors"
                                />
                            </div>

                            {error && (
                                <p className="text-center text-sm font-medium text-red-400">{error}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-13 w-full rounded-xl bg-[#AA0202] text-base font-bold text-white shadow-lg shadow-[#AA0202]/25 transition-all hover:bg-[#cc0303] hover:shadow-[#AA0202]/40 disabled:opacity-60"
                                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", letterSpacing: "0.06em" }}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : isSpanish ? (
                                    "CONTINUAR AL PAGO SEGURO →"
                                ) : (
                                    "CONTINUE TO SECURE CHECKOUT →"
                                )}
                            </Button>

                            <p className="text-center text-[11px] text-zinc-500">
                                🔒{" "}
                                {isSpanish
                                    ? "Tu información está protegida. Solo la usamos para tu pedido y soporte."
                                    : "Your info is protected. We only use it for your order and support."}
                            </p>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
