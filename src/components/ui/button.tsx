import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { SpinnerIcon } from "./icons";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "soft"
  | "danger"
  | "danger-ghost";

export type ButtonSize = "sm" | "md" | "icon" | "icon-sm";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-forest text-cream shadow-[0_1px_2px_rgba(24,53,41,0.18)] hover:bg-forest-dark",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-forest/35 hover:bg-surface-muted",
  ghost: "text-ink-soft hover:bg-surface-muted hover:text-ink",
  soft: "bg-forest-tint text-forest-dark hover:bg-[#d8e5d5]",
  danger: "bg-danger text-white hover:bg-[#7d2e24]",
  "danger-ghost":
    "border border-danger/25 text-danger hover:border-danger/40 hover:bg-danger-tint",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3.5 text-[13px]",
  md: "h-11 gap-2 px-5 text-sm",
  icon: "h-11 w-11",
  "icon-sm": "h-9 w-9",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex select-none items-center justify-center rounded-full font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <SpinnerIcon size={15} /> : null}
      {children}
    </button>
  );
}
