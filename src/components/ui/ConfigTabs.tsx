import type { ConfigTab } from "@/types";

const TABS: Array<{ id: ConfigTab; label: string }> = [
  { id: "params", label: "参数" },
  { id: "headers", label: "请求头" },
  { id: "body", label: "请求体" },
  { id: "script", label: "脚本" },
  { id: "variables", label: "变量" },
];

interface TabsProps {
  active: ConfigTab;
  onChange: (tab: ConfigTab) => void;
}

export function ConfigTabs({ active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-border-subtle px-4" role="tablist">
      {TABS.map((tab) => {
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
