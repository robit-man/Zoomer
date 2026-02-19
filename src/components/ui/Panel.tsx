"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMagnetTargets } from "@/components/background/MagnetTargets";
import { cn } from "@/components/ui/cn";

export function Panel({
  className,
  magnetStrength = 1,
  children,
}: {
  className?: string;
  magnetStrength?: number;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { register } = useMagnetTargets();

  useEffect(() => {
    const element = panelRef.current;
    if (!element) {
      return;
    }
    return register(element, magnetStrength);
  }, [magnetStrength, register]);

  return (
    <div ref={panelRef} className={cn("panel", className)}>
      {children}
    </div>
  );
}
