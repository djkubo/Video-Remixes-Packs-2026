import type { PropsWithChildren } from "react";
import PersistentBottomPlayer from "@/components/landing/PersistentBottomPlayer";

type LandingLayoutProps = PropsWithChildren;

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <main className="min-h-screen bg-zinc-950 pb-[calc(env(safe-area-inset-bottom)+8rem)] text-white">
      {children}
      <PersistentBottomPlayer />
    </main>
  );
}
