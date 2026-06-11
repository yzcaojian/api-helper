import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";

export function SettingsDialog() {
  const open = useAppStore((s) => s.settingsOpen);
  const theme = useAppStore((s) => s.theme);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setTheme = useAppStore((s) => s.setTheme);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-surface-elevated">
        <div className="flex items-center border-b border-border-subtle px-4 py-3">
          <h2 className="text-base font-semibold">设置</h2>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
            关闭
          </Button>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <section className="rounded-md border border-border-subtle p-4">
            <h3 className="mb-3 text-sm font-semibold">通用</h3>
            <p className="mb-2 text-xs text-[var(--text-secondary)]">主题</p>
            <div className="flex gap-2">
              {(["system", "light", "dark"] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={theme === mode ? "primary" : "secondary"}
                  onClick={() => setTheme(mode)}
                >
                  {mode === "system" ? "跟随系统" : mode === "light" ? "浅色" : "深色"}
                </Button>
              ))}
            </div>
          </section>
          <section className="rounded-md border border-border-subtle p-4">
            <h3 className="mb-3 text-sm font-semibold">脚本</h3>
            <p className="text-sm">脚本超时 5 秒</p>
            <p className="text-xs text-[var(--text-tertiary)]">失败时阻止请求</p>
          </section>
          <section className="rounded-md border border-border-subtle p-4">
            <h3 className="mb-3 text-sm font-semibold">请求</h3>
            <p className="text-sm">HTTP 超时 30s</p>
            <p className="text-xs text-[var(--text-tertiary)]">跟随重定向</p>
          </section>
          <section className="rounded-md border border-border-subtle p-4">
            <h3 className="mb-3 text-sm font-semibold">数据</h3>
            <p className="font-mono text-xs">%AppData%\API Helper</p>
          </section>
        </div>
      </div>
    </div>
  );
}
