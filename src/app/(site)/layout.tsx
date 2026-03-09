import type { ReactNode } from "react";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <div className="relative min-h-screen bg-[var(--paper)]">{children}</div>;
}
