import { useEffect, useRef, useState } from "react";

export interface ActionMenuItem {
  id: string;
  label: string;
  onSelect: () => void | Promise<void>;
}

interface ActionMenuProps {
  label: string;
  items: ActionMenuItem[];
  className?: string;
}

export function ActionMenu({ label, items, className = "" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm text-[var(--text-secondary)] hover:bg-surface-editor hover:text-[var(--text-primary)]"
      >
        {label}
        <span className="text-[var(--text-tertiary)]">▾</span>
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-[200] mt-1 min-w-[180px] overflow-hidden rounded-md border border-border bg-surface-elevated py-1 shadow-lg">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void item.onSelect();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-surface-editor"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
