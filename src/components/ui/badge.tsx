import * as React from "react";
import { twMerge } from "tailwind-merge";

export function Badge({ className, variant = 'info', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'success' | 'destructive' | 'info' | 'warning' }) {
  const variants = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    destructive: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };
  return (
    <div className={twMerge("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none", variants[variant], className)} {...props} />
  );
}
