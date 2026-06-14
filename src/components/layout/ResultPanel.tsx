import { useAppStore } from "@/store/appStore";
import { formatBytes, statusTone } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { useWsMessageScroll } from "@/hooks/useWebSocketEvents";
import type { ResponseTab, ScriptLogLine } from "@/types";

function ScriptLogList({ logs }: { logs: ScriptLogLine[] }) {
  if (logs.length === 0) {
    return <p className="text-[var(--text-tertiary)]">暂无脚本日志</p>;
  }
  return (
    <div className="space-y-1">
      {logs.map((line) => (
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
      ))}
    </div>
  );
}

export function ResultPanel() {
  const protocol = useAppStore((s) => s.protocol);
  const response = useAppStore((s) => s.response);
  const responseTab = useAppStore((s) => s.responseTab);
  const scriptLogs = useAppStore((s) => s.scriptLogs);
  const wsMessages = useAppStore((s) => s.wsMessages);
  const wsStatus = useAppStore((s) => s.wsStatus);
  const wsError = useAppStore((s) => s.wsError);
  const setResponseTab = useAppStore((s) => s.setResponseTab);
  const clearWsMessages = useAppStore((s) => s.clearWsMessages);
  const exportWsMessages = useAppStore((s) => s.exportWsMessages);

  const isWs = protocol === "websocket";
  const listRef = useWsMessageScroll([wsMessages.length, responseTab, isWs]);

  const wsStatusTone =
    wsStatus === "connected"
      ? ("success" as const)
      : wsStatus === "error"
        ? ("danger" as const)
        : wsStatus === "connecting"
          ? ("warning" as const)
          : ("neutral" as const);

  const wsStatusLabel =
    wsStatus === "connected"
      ? "已连接"
      : wsStatus === "connecting"
        ? "连接中…"
        : wsStatus === "error"
          ? "连接失败"
          : "未连接";

  const httpTabs: Array<{ id: ResponseTab; label: string }> = [
    { id: "body", label: "响应体" },
    { id: "headers", label: "响应头" },
    { id: "log", label: "脚本日志" },
  ];

  const showLog = responseTab === "log";

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-editor/60 px-4 py-2">
        <span className="text-sm font-semibold">{isWs ? "消息" : "响应"}</span>

        {isWs ? (
          <>
            <Pill tone={wsStatusTone}>{wsStatusLabel}</Pill>
            {wsError && <span className="truncate text-xs text-red-500">{wsError}</span>}
          </>
        ) : (
          <>
            {response && !response.error && response.status > 0 && (
              <>
                <Pill tone={statusTone(response.status)}>
                  {response.status} {response.statusText}
                </Pill>
                <span className="text-xs text-[var(--text-secondary)]">{response.durationMs} ms</span>
                <span className="text-xs text-[var(--text-secondary)]">{formatBytes(response.sizeBytes)}</span>
              </>
            )}
            {response?.error && <Pill tone="danger">网络错误</Pill>}
          </>
        )}

        <div className="flex-1" />

        {isWs ? (
          <>
            <Button
              variant={showLog ? "primary" : "ghost"}
              className="h-8"
              onClick={() => setResponseTab(showLog ? "body" : "log")}
            >
              脚本日志
            </Button>
            {!showLog && (
              <>
                <Button variant="ghost" className="h-8" onClick={clearWsMessages}>
                  清空
                </Button>
                <Button variant="ghost" className="h-8" onClick={exportWsMessages}>
                  导出
                </Button>
              </>
            )}
          </>
        ) : (
          httpTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={responseTab === tab.id ? "primary" : "ghost"}
              className="h-8"
              onClick={() => setResponseTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))
        )}
      </div>

      <div ref={isWs ? listRef : undefined} className="min-h-0 flex-1 overflow-auto bg-surface-editor p-4 font-mono text-sm">
        {isWs && !showLog && wsMessages.length === 0 && (
          <p className="text-[var(--text-tertiary)]">连接成功后，收发消息显示于此</p>
        )}

        {isWs &&
          !showLog &&
          wsMessages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 ${msg.direction === "sent" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
            >
              <span className="text-[var(--text-tertiary)]">{msg.time}</span>{" "}
              <span className="text-[var(--text-tertiary)]">{msg.direction === "sent" ? "↑" : "↓"}</span> {msg.content}
            </div>
          ))}

        {!isWs && !response && responseTab !== "log" && (
          <p className="text-[var(--text-tertiary)]">发送请求后，响应显示于此</p>
        )}

        {!isWs && responseTab === "body" && response && (
          response.error ? (
            <div className="space-y-2 text-red-600 dark:text-red-300">
              <p>{response.error}</p>
              <Button variant="secondary" onClick={() => useAppStore.getState().sendRequest()}>
                重试
              </Button>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-all">{response.body || "（空）"}</pre>
          )
        )}

        {!isWs && responseTab === "headers" && response && (
          <div className="space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key}>
                <span className="text-[var(--text-secondary)]">{key}: </span>
                {value}
              </div>
            ))}
          </div>
        )}

        {(isWs ? showLog : responseTab === "log") && <ScriptLogList logs={scriptLogs} />}
      </div>
    </section>
  );
}
