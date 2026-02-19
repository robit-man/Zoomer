"use client";

import { useEffect, useRef } from "react";
import { useMagnetTargets } from "@/components/background/MagnetTargets";
import { cn } from "@/components/ui/cn";

export function Button({
  className,
  children,
  type,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { register } = useMagnetTargets();

  useEffect(() => {
    const element = buttonRef.current;
    if (!element) {
      return;
    }
    return register(element, 0.85);
  }, [register]);

  return (
    <button
      {...props}
      ref={buttonRef}
      type={type ?? "button"}
      className={cn(
        "mono hairline rounded-md px-4 py-2 text-[12px] text-white/85",
        "bg-white/5 hover:bg-white/8 hover:border-white/25 transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-white/20",
        className,
      )}
    >
      {children}
    </button>
  );
}
