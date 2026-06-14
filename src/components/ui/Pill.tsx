type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneStyles: Record<Tone, string> = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "bg-red-500/15 text-red-700 dark:text-red-300",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  neutral: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

interface PillProps {
  tone?: Tone;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Pill({ tone = "neutral", children, active, onClick, className = "" }: PillProps) {
  const base = `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneStyles[tone]} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} cursor-pointer transition-opacity hover:opacity-90 ${
          active ? "ring-2 ring-accent ring-offset-1" : ""
        }`}
      >
        {children}
      </button>
    );
  }

  return <span className={base}>{children}</span>;
}
