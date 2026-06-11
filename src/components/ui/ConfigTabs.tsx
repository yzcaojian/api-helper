import type { ConfigTab } from "@/types";

const TABS: Array<{ id: ConfigTab; label: string }> = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "script", label: "预执行脚本" },
  { id: "variables", label: "变量预览" },
];

interface TabsProps {
  active: ConfigTab;
  onChange: (tab: ConfigTab) => void;
  hideBody?: boolean;
}

export function ConfigTabs({ active, onChange, hideBody }: TabsProps) {
  const tabs = hideBody ? TABS.filter((t) => t.id !== "body") : TABS;

  return (
    <div className="flex border-b border-border-subtle px-4" role="tablist">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors ${
              selected
                ? "border-accent font-medium text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
