"use client";

import { cn } from "@/components/ui/cn";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "mono control w-full border border-black/12 bg-white/65 px-4 py-3 text-[13px] text-black/82",
        "placeholder:text-black/30",
        "focus:outline-none focus:ring-2 focus:ring-black/10",
        props.className,
      )}
    />
  );
}
