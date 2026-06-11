import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  secondary:
    "bg-surface-elevated border border-border text-[var(--text-primary)] hover:bg-surface-editor disabled:opacity-50",
  ghost:
    "text-[var(--text-secondary)] hover:bg-surface-editor hover:text-[var(--text-primary)] disabled:opacity-50",
};

export function Button({ variant = "secondary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
