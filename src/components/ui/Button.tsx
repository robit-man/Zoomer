"use client";

import { cn } from "@/components/ui/cn";

export function Button({
  className,
  children,
  type,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={type ?? "button"}
      className={cn(
        "mono control hairline px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-black/82",
        "bg-[var(--acid)] hover:bg-[var(--acid-deep)] hover:border-black/30 transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-black/12",
        className,
      )}
    >
      {children}
    </button>
  );
}
