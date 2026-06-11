import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Select } from "@/components/ui/Select";

export function TopBar() {
  const environments = useAppStore((s) => s.environments);
  const activeEnvId = useAppStore((s) => s.activeEnvId);
  const setActiveEnvId = useAppStore((s) => s.setActiveEnvId);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setEnvDrawerOpen = useAppStore((s) => s.setEnvDrawerOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const varCount = useAppStore((s) => s.getResolvedVariables().filter((v) => v.value).length);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-elevated px-4">
      <div className="text-sm font-semibold">API Helper</div>
      <div className="h-6 w-px bg-border-subtle" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-secondary)]">环境</span>
        <Select
          value={activeEnvId}
          onChange={setActiveEnvId}
          options={environments.map((e) => ({ value: e.id, label: e.name }))}
        />
        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setEnvDrawerOpen(true)}>
          管理
        </Button>
      </div>
      <button
        type="button"
        onClick={() => useAppStore.getState().setConfigTab("variables")}
        className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Pill tone="info">变量 {varCount}</Pill>
      </button>
      <div className="flex-1" />
      <Button variant="ghost" onClick={toggleSidebar}>
        历史
      </Button>
      <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
        设置
      </Button>
    </header>
  );
}
