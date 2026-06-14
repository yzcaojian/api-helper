interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export function Select({ value, onChange, options, className = "" }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`relative z-10 h-9 rounded-md border border-border bg-surface-elevated px-2 text-sm text-[var(--text-primary)] focus:border-accent focus:outline-none ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
