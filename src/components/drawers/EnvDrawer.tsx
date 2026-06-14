import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

export function EnvDrawer() {
  const open = useAppStore((s) => s.envDrawerOpen);
  const environments = useAppStore((s) => s.environments);
  const activeEnvId = useAppStore((s) => s.activeEnvId);
  const setEnvDrawerOpen = useAppStore((s) => s.setEnvDrawerOpen);
  const setActiveEnvId = useAppStore((s) => s.setActiveEnvId);
  const updateEnvVariable = useAppStore((s) => s.updateEnvVariable);
  const updateEnvVariableKey = useAppStore((s) => s.updateEnvVariableKey);
  const removeEnvVariable = useAppStore((s) => s.removeEnvVariable);
  const addEnvVariable = useAppStore((s) => s.addEnvVariable);

  if (!open) return null;

  const activeEnv = environments.find((e) => e.id === activeEnvId) ?? environments[0];
  const entries = Object.entries(activeEnv?.variables ?? {});

  return (
    <div className="fixed inset-0 z-[100] flex">
      <button
        type="button"
        className="flex-1 bg-black/40"
        aria-label="关闭环境变量面板"
        onClick={() => setEnvDrawerOpen(false)}
      />
      <aside className="relative z-[101] flex w-[480px] flex-col border-l border-border bg-surface-elevated shadow-xl">
        <div className="flex items-center border-b border-border-subtle px-4 py-3">
          <h2 className="text-base font-semibold">环境变量</h2>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => setEnvDrawerOpen(false)}>
            关闭
          </Button>
        </div>

        <div className="space-y-2 border-b border-border-subtle bg-surface-editor/40 px-4 py-3 text-xs text-[var(--text-secondary)]">
          <p>
            <strong>环境有什么用？</strong> 同一套接口在开发 / 测试 / 生产使用不同域名、密钥等。
            在 URL、请求头、请求体里写 <code className="font-mono">{"{{baseUrl}}"}</code> 会自动替换为当前环境的值。
          </p>
          <p>脚本中通过 <code className="font-mono">env.get("key")</code> 读取。导入/导出请使用顶部「导入 / 导出」菜单。</p>
        </div>

        <div className="space-y-3 border-b border-border-subtle p-4">
          <DropdownSelect
            ariaLabel="选择要编辑的环境"
            value={activeEnvId}
            onChange={setActiveEnvId}
            options={environments.map((e) => ({ value: e.id, label: e.name }))}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => addEnvVariable(activeEnvId)}>
              + 添加变量
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {entries.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">暂无变量，点击「添加变量」开始配置。</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[var(--text-secondary)]">
                  <th className="pb-2 pr-2">Key</th>
                  <th className="pb-2 pr-2">Value</th>
                  <th className="pb-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {entries.map(([key, value]) => (
                  <tr key={key} className="border-b border-border-subtle">
                    <td className="py-2 pr-2">
                      <input
                        defaultValue={key}
                        onBlur={(e) => {
                          const newKey = e.target.value.trim();
                          if (newKey && newKey !== key) updateEnvVariableKey(activeEnvId, key, newKey);
                        }}
                        className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-sm focus:border-accent focus:outline-none"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={value}
                        onChange={(e) => updateEnvVariable(activeEnvId, key, e.target.value)}
                        className="w-full rounded border border-border bg-surface px-2 py-1 font-mono text-sm focus:border-accent focus:outline-none"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        aria-label="删除变量"
                        onClick={() => removeEnvVariable(activeEnvId, key)}
                        className="text-[var(--text-tertiary)] hover:text-red-500"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-border-subtle p-4 text-right">
          <Button variant="primary" onClick={() => setEnvDrawerOpen(false)}>
            完成
          </Button>
        </div>
      </aside>
    </div>
  );
}
