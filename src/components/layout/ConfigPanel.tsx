import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/store/appStore";
import { ConfigTabs } from "@/components/ui/ConfigTabs";
import { KeyValueTable } from "@/components/ui/KeyValueTable";
import { CodeEditor } from "@/components/ui/CodeEditor";
import { Button } from "@/components/ui/Button";
import { maskSecret } from "@/lib/utils";
import type { BodyType } from "@/types";

const BODY_TYPES: Array<{ id: BodyType; label: string }> = [
  { id: "json", label: "JSON" },
  { id: "raw", label: "纯文本" },
  { id: "none", label: "无" },
];

export function ConfigPanel() {
  const protocol = useAppStore((s) => s.protocol);
  const method = useAppStore((s) => s.method);
  const configTab = useAppStore((s) => s.configTab);
  const params = useAppStore((s) => s.params);
  const headers = useAppStore((s) => s.headers);
  const bodyType = useAppStore((s) => s.bodyType);
  const bodyContent = useAppStore((s) => s.bodyContent);
  const scriptEnabled = useAppStore((s) => s.scriptEnabled);
  const scriptCode = useAppStore((s) => s.scriptCode);
  const variableDeps = useAppStore(
    useShallow((s) => ({
      url: s.url,
      params: s.params,
      headers: s.headers,
      bodyContent: s.bodyContent,
      runtimeVars: s.runtimeVars,
      activeEnvId: s.activeEnvId,
      environments: s.environments,
    })),
  );
  const variables = useMemo(
    () => useAppStore.getState().getResolvedVariables(),
    [variableDeps],
  );
  const setConfigTab = useAppStore((s) => s.setConfigTab);
  const setMethod = useAppStore((s) => s.setMethod);
  const setParams = useAppStore((s) => s.setParams);
  const setHeaders = useAppStore((s) => s.setHeaders);
  const setBodyType = useAppStore((s) => s.setBodyType);
  const setBodyContent = useAppStore((s) => s.setBodyContent);
  const setScriptEnabled = useAppStore((s) => s.setScriptEnabled);
  const setScriptCode = useAppStore((s) => s.setScriptCode);
  const runScriptOnly = useAppStore((s) => s.runScriptOnly);

  const isWs = protocol === "websocket";
  const canEditBody = isWs || method === "POST";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ConfigTabs active={configTab} onChange={setConfigTab} />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {configTab === "params" && (
          <KeyValueTable rows={params} onChange={setParams} keyLabel="键" valueLabel="值" />
        )}

        {configTab === "headers" && (
          <KeyValueTable rows={headers} onChange={setHeaders} keyLabel="名称" valueLabel="值" />
        )}

        {configTab === "body" && !canEditBody && (
          <div className="rounded-md border border-border-subtle bg-surface-editor p-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">GET 请求不包含请求体</p>
            <Button variant="primary" className="mt-3" onClick={() => setMethod("POST")}>
              切换为 POST
            </Button>
          </div>
        )}

        {configTab === "body" && canEditBody && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {BODY_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant={bodyType === type.id ? "primary" : "secondary"}
                  onClick={() => setBodyType(type.id)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
            {bodyType !== "none" && (
              <CodeEditor value={bodyContent} onChange={setBodyContent} language="json" minHeight="260px" />
            )}
          </div>
        )}

        {configTab === "script" && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={scriptEnabled}
                onChange={(e) => setScriptEnabled(e.target.checked)}
              />
              发送前执行
            </label>
            <CodeEditor value={scriptCode} onChange={setScriptCode} language="javascript" minHeight="280px" />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => void runScriptOnly()}>
                试运行
              </Button>
            </div>
          </div>
        )}

        {configTab === "variables" && (
          <div className="overflow-auto rounded-md border border-border-subtle">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-surface-elevated">
                <tr className="border-b border-border-subtle text-left text-[var(--text-secondary)]">
                  <th className="px-3 py-2">变量名</th>
                  <th className="px-3 py-2">值</th>
                  <th className="px-3 py-2">来源</th>
                  <th className="px-3 py-2">引用</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((v, i) => (
                  <tr key={v.name} className={i % 2 === 1 ? "bg-surface-editor/50" : ""}>
                    <td className="px-3 py-2 font-mono">{v.name}</td>
                    <td className="px-3 py-2 font-mono">
                      {v.name.toLowerCase().includes("secret") || v.name.toLowerCase().includes("token")
                        ? maskSecret(v.value)
                        : v.value || "—"}
                    </td>
                    <td className="px-3 py-2">{v.source === "script" ? "脚本" : "环境"}</td>
                    <td className="px-3 py-2">{v.usedIn.join("、") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
