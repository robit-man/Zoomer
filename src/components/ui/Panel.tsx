"use client";

import { type ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("panel", className)}>
      {children}
    </div>
  );
}
