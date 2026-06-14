import type { KeyValue } from "@/types";
import { createKeyValue } from "@/types";
import { Button } from "./Button";

interface KeyValueTableProps {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  keyLabel?: string;
  valueLabel?: string;
}

export function KeyValueTable({
  rows,
  onChange,
  keyLabel = "键",
  valueLabel = "值",
}: KeyValueTableProps) {
  const updateRow = (id: string, patch: Partial<KeyValue>) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  return (
    <div className="overflow-auto rounded-md border border-border-subtle">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-surface-elevated">
          <tr className="border-b border-border-subtle text-left text-[var(--text-secondary)]">
            <th className="w-10 px-3 py-2" />
            <th className="px-3 py-2 font-medium">{keyLabel}</th>
            <th className="px-3 py-2 font-medium">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={`border-b border-border-subtle ${index % 2 === 1 ? "bg-surface-editor/50" : ""}`}
            >
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateRow(row.id, { enabled: e.target.checked })}
                  aria-label={`启用 ${row.key || "行"}`}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  value={row.key}
                  onChange={(e) => updateRow(row.id, { key: e.target.value })}
                  className="w-full rounded border border-transparent bg-transparent px-1 py-1 font-mono text-sm focus:border-border focus:bg-surface-elevated focus:outline-none"
                  placeholder={keyLabel}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  value={row.value}
                  onChange={(e) => updateRow(row.id, { value: e.target.value })}
                  className="w-full rounded border border-transparent bg-transparent px-1 py-1 font-mono text-sm focus:border-border focus:bg-surface-elevated focus:outline-none"
                  placeholder={valueLabel}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border-subtle p-2">
        <Button variant="ghost" onClick={() => onChange([...rows, createKeyValue()])}>
          + 添加行
        </Button>
      </div>
    </div>
  );
}
