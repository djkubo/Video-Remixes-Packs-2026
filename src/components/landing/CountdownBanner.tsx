import { useState, useEffect, useMemo } from "react";
import { Flame, Clock, Users } from "lucide-react";

function getEndOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getTimeLeft(target: Date): { days: number; hours: number; minutes: number; seconds: number } {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
    };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="font-bebas text-2xl tabular-nums text-[#EFEFEF] md:text-3xl">
                {String(value).padStart(2, "0")}
            </span>
            <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
        </div>
    );
}

export default function CountdownBanner() {
    const endOfMonth = useMemo(getEndOfMonth, []);
    const [timeLeft, setTimeLeft] = useState(getTimeLeft(endOfMonth));

    useEffect(() => {
        const interval = setInterval(() => setTimeLeft(getTimeLeft(endOfMonth)), 1000);
        return () => clearInterval(interval);
    }, [endOfMonth]);

    return (
        <div className="bg-gradient-to-r from-[#AA0202]/20 via-[#070707] to-[#AA0202]/20 border-y border-[#AA0202]/30 px-4 py-5">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 md:flex-row md:justify-between">
                {/* Left: urgency text */}
                <div className="flex items-center gap-3 text-center md:text-left">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#AA0202]/20 md:flex">
                        <Flame className="h-5 w-5 text-[#AA0202]" />
                    </div>
                    <div>
                        <p className="font-bebas text-lg uppercase tracking-wide text-[#EFEFEF] md:text-xl">
                            🔥 PRECIO ESPECIAL ESTE MES
                        </p>
                        <p className="font-sans text-xs text-muted-foreground">
                            <Users className="mr-1 inline h-3 w-3" />
                            Plazas limitadas para nuevos miembros · La oferta termina en:
                        </p>
                    </div>
                </div>

                {/* Right: countdown */}
                <div className="flex items-center gap-3">
                    <Clock className="hidden h-4 w-4 text-[#AA0202] md:block" />
                    <div className="flex items-center gap-2">
                        <TimeBlock value={timeLeft.days} label="días" />
                        <span className="font-bebas text-xl text-[#AA0202]">:</span>
                        <TimeBlock value={timeLeft.hours} label="hrs" />
                        <span className="font-bebas text-xl text-[#AA0202]">:</span>
                        <TimeBlock value={timeLeft.minutes} label="min" />
                        <span className="font-bebas text-xl text-[#AA0202]">:</span>
                        <TimeBlock value={timeLeft.seconds} label="seg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
