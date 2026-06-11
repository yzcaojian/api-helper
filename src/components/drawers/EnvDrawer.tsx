import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export function EnvDrawer() {
  const open = useAppStore((s) => s.envDrawerOpen);
  const environments = useAppStore((s) => s.environments);
  const activeEnvId = useAppStore((s) => s.activeEnvId);
  const setEnvDrawerOpen = useAppStore((s) => s.setEnvDrawerOpen);
  const setActiveEnvId = useAppStore((s) => s.setActiveEnvId);
  const updateEnvVariable = useAppStore((s) => s.updateEnvVariable);
  const addEnvVariable = useAppStore((s) => s.addEnvVariable);

  if (!open) return null;

  const activeEnv = environments.find((e) => e.id === activeEnvId) ?? environments[0];
  const entries = Object.entries(activeEnv.variables);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="flex-1 bg-black/40"
        aria-label="关闭环境变量面板"
        onClick={() => setEnvDrawerOpen(false)}
      />
      <aside className="flex w-[420px] flex-col border-l border-border bg-surface-elevated shadow-none">
        <div className="flex items-center border-b border-border-subtle px-4 py-3">
          <h2 className="text-base font-semibold">环境变量</h2>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => setEnvDrawerOpen(false)}>
            关闭
          </Button>
        </div>
        <div className="space-y-3 border-b border-border-subtle p-4">
          <Select
            value={activeEnvId}
            onChange={setActiveEnvId}
            options={environments.map((e) => ({ value: e.id, label: e.name }))}
          />
          <Button variant="secondary" onClick={() => addEnvVariable(activeEnvId)}>
            + 添加变量
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[var(--text-secondary)]">
                <th className="pb-2 pr-3">Key</th>
                <th className="pb-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} className="border-b border-border-subtle">
                  <td className="py-2 pr-3 font-mono">{key}</td>
                  <td className="py-2">
                    <input
                      value={value}
                      onChange={(e) => updateEnvVariable(activeEnvId, key, e.target.value)}
                      className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-sm focus:border-accent focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-[var(--text-tertiary)]">
            环境变量可通过 env.get() 在脚本中读取，或在 Headers 中用 {"{{key}}"} 引用。
          </p>
        </div>
        <div className="border-t border-border-subtle p-4 text-right">
          <Button variant="primary" onClick={() => setEnvDrawerOpen(false)}>
            保存
          </Button>
        </div>
      </aside>
    </div>
  );
}
