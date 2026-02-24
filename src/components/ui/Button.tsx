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
        "mono control hairline px-3 py-2 text-[12px] text-white/85",
        "bg-white/5 hover:bg-white/8 hover:border-white/25 transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-white/20",
        className,
      )}
    >
      {children}
    </button>
  );
}
