import { useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { ActionMenu } from "@/components/ui/ActionMenu";

async function notify(result: { ok: boolean; message: string }) {
  if (result.message === "已取消" || result.message === "已取消保存") return;
  window.alert(result.ok ? result.message : `操作失败：${result.message}`);
}

export function TopBar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const environments = useAppStore((s) => s.environments);
  const activeEnvId = useAppStore((s) => s.activeEnvId);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setActiveEnvId = useAppStore((s) => s.setActiveEnvId);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setEnvDrawerOpen = useAppStore((s) => s.setEnvDrawerOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const importFromJson = useAppStore((s) => s.importFromJson);
  const importFromFile = useAppStore((s) => s.importFromFile);
  const exportPostman = useAppStore((s) => s.exportPostman);
  const exportApipost = useAppStore((s) => s.exportApipost);
  const exportEnvironments = useAppStore((s) => s.exportEnvironments);

  const onImportFile = async (file: File) => {
    const text = await file.text();
    await notify(importFromJson(text));
  };

  return (
    <header className="relative z-20 flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle bg-surface-elevated px-4">
      <div className="text-sm font-semibold">API Helper</div>
      <div className="h-5 w-px bg-border-subtle" />
      <DropdownSelect
        ariaLabel="选择环境"
        value={activeEnvId}
        onChange={setActiveEnvId}
        options={environments.map((e) => ({ value: e.id, label: e.name }))}
      />
      <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setEnvDrawerOpen(true)}>
        环境变量
      </Button>
      <div className="flex-1" />
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onImportFile(file);
          e.target.value = "";
        }}
      />
      <ActionMenu
        label="导入 / 导出"
        items={[
          {
            id: "import-file",
            label: "导入 JSON 文件…",
            onSelect: async () => {
              const result = await importFromFile();
              if (result.message === "已取消") {
                if (!("__TAURI_INTERNALS__" in window)) fileRef.current?.click();
                return;
              }
              await notify(result);
            },
          },
          { id: "export-postman", label: "导出 Postman 集合…", onSelect: async () => notify(await exportPostman()) },
          { id: "export-apipost", label: "导出 Apipost 项目…", onSelect: async () => notify(await exportApipost()) },
          {
            id: "export-env",
            label: "导出环境变量…",
            onSelect: async () => notify(await exportEnvironments()),
          },
        ]}
      />
      <Button variant={sidebarOpen ? "secondary" : "ghost"} className="h-8" onClick={toggleSidebar}>
        历史
      </Button>
      <Button variant="ghost" className="h-8" onClick={() => setSettingsOpen(true)}>
        设置
      </Button>
    </header>
  );
}
