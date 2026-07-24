"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
  secondary: "bg-surface text-foreground border border-border hover:bg-surface-hover",
  ghost: "bg-transparent text-foreground hover:bg-surface-hover",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 rounded-full gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-full gap-2",
  lg: "text-base px-6 py-3.5 rounded-full gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={size === "sm" ? 14 : 16} />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
