import { useAppStore } from "@/store/appStore";

export function StatusBar() {
  const scriptEnabled = useAppStore((s) => s.scriptEnabled);

  return (
    <footer className="flex h-6 shrink-0 items-center border-t border-border-subtle bg-surface-editor/60 px-4 text-xs text-[var(--text-tertiary)]">
      Ctrl+Enter 发送 · Ctrl+R 运行脚本 · {scriptEnabled ? "脚本已启用" : "脚本已禁用"} · 本地
      %AppData%\API Helper
    </footer>
  );
}
