"use client";

import { cn } from "@/components/ui/cn";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "mono w-full rounded-md px-4 py-3 text-[13px] text-white/85",
        "bg-white/4 border border-white/10",
        "placeholder:text-white/30",
        "focus:outline-none focus:ring-2 focus:ring-white/15",
        props.className,
      )}
    />
  );
}
