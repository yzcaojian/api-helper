import { useAppStore } from "@/store/appStore";
import { formatBytes, statusTone } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import type { ResponseTab } from "@/types";

const RESPONSE_TABS: Array<{ id: ResponseTab; label: string }> = [
  { id: "body", label: "响应体" },
  { id: "headers", label: "响应头" },
  { id: "log", label: "脚本日志" },
];

export function ResponsePanel() {
  const response = useAppStore((s) => s.response);
  const responseTab = useAppStore((s) => s.responseTab);
  const scriptLogs = useAppStore((s) => s.scriptLogs);
  const setResponseTab = useAppStore((s) => s.setResponseTab);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-y border-border-subtle bg-surface-editor/60 px-4 py-2">
        <span className="text-sm font-semibold">响应</span>
        {response && !response.error && response.status > 0 && (
          <>
            <Pill tone={statusTone(response.status)}>
              {response.status} {response.statusText}
            </Pill>
            <span className="text-xs text-[var(--text-secondary)]">{response.durationMs} 毫秒</span>
            <span className="text-xs text-[var(--text-secondary)]">{formatBytes(response.sizeBytes)}</span>
          </>
        )}
        {response?.error && <Pill tone="danger">网络错误</Pill>}
        <div className="flex-1" />
        {RESPONSE_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={responseTab === tab.id ? "primary" : "ghost"}
            className="h-8"
            onClick={() => setResponseTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-surface-editor p-4 font-mono text-sm">
        {!response && responseTab !== "log" && (
          <p className="text-[var(--text-tertiary)]">尚未发送请求 · Ctrl+Enter 快速发送</p>
        )}

        {responseTab === "body" && response && (
          <>
            {response.error ? (
              <div className="space-y-2 text-red-600 dark:text-red-300">
                <p>{response.error}</p>
                <Button variant="secondary" onClick={() => useAppStore.getState().sendRequest()}>
                  重试
                </Button>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-all">{response.body || "（空）"}</pre>
            )}
          </>
        )}

        {responseTab === "headers" && response && (
          <div className="space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key}>
                <span className="text-[var(--text-secondary)]">{key}: </span>
                {value}
              </div>
            ))}
          </div>
        )}

        {responseTab === "log" && (
          <div className="space-y-1">
            {scriptLogs.length === 0 ? (
              <p className="text-[var(--text-tertiary)]">暂无脚本日志</p>
            ) : (
              scriptLogs.map((line) => (
                <div
                  key={line.id}
                  className={
                    line.level === "error"
                      ? "text-red-600 dark:text-red-300"
                      : line.level === "success"
                        ? "text-emerald-600 dark:text-emerald-300"
                        : ""
                  }
                >
                  [{line.time}] {line.message}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
