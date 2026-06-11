type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneStyles: Record<Tone, string> = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "bg-red-500/15 text-red-700 dark:text-red-300",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  neutral: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}
