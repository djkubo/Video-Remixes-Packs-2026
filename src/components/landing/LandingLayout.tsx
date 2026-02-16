import type { PropsWithChildren } from "react";
import PersistentBottomPlayer from "@/components/landing/PersistentBottomPlayer";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

type LandingLayoutProps = PropsWithChildren;

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <main className="min-h-screen bg-[#070707] pb-[calc(env(safe-area-inset-bottom)+8rem)] text-[#EFEFEF]">
      {children}
      <PersistentBottomPlayer />
      <WhatsAppFloatingButton />
    </main>
  );
}
