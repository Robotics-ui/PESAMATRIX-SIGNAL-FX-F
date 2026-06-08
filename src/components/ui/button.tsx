import * as React from "react";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'success';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer";
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-700 text-white shadow",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white"
  };

  return (
    <button className={twMerge(base, variants[variant], className)} {...props} />
  );
}
