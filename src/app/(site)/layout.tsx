import type { ReactNode } from "react";
import Background from "@/components/background/Background";
import { MagnetTargetsProvider } from "@/components/background/MagnetTargets";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <MagnetTargetsProvider>
      <div className="noise relative min-h-screen">
        <Background />
        <div className="relative z-10 min-h-screen">{children}</div>
      </div>
    </MagnetTargetsProvider>
  );
}
