import { useEffect, useRef, useState } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function DropdownSelect({ value, options, onChange, className = "", ariaLabel }: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 min-w-[88px] items-center justify-between gap-2 rounded-md border border-border bg-surface-elevated px-3 text-sm text-[var(--text-primary)] hover:bg-surface-editor focus:border-accent focus:outline-none"
      >
        <span>{selected?.label ?? value}</span>
        <span className="text-[var(--text-tertiary)]">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-[200] mt-1 min-w-full overflow-hidden rounded-md border border-border bg-surface-elevated py-1 shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-surface-editor ${
                  opt.value === value ? "bg-surface-editor font-medium text-accent" : "text-[var(--text-primary)]"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
