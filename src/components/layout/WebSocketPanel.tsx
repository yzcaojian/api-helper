import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { useWsMessageScroll } from "@/hooks/useWebSocketEvents";
import type { ResponseTab } from "@/types";

const WS_TABS: Array<{ id: ResponseTab; label: string }> = [
  { id: "body", label: "消息记录" },
  { id: "log", label: "脚本日志" },
];

export function WebSocketPanel() {
  const wsMessages = useAppStore((s) => s.wsMessages);
  const wsStatus = useAppStore((s) => s.wsStatus);
  const wsError = useAppStore((s) => s.wsError);
  const scriptLogs = useAppStore((s) => s.scriptLogs);
  const responseTab = useAppStore((s) => s.responseTab);
  const setResponseTab = useAppStore((s) => s.setResponseTab);
  const clearWsMessages = useAppStore((s) => s.clearWsMessages);
  const exportWsMessages = useAppStore((s) => s.exportWsMessages);

  const listRef = useWsMessageScroll([wsMessages.length, responseTab]);

  const statusTone =
    wsStatus === "connected"
      ? ("success" as const)
      : wsStatus === "error"
        ? ("danger" as const)
        : wsStatus === "connecting"
          ? ("warning" as const)
          : ("neutral" as const);

  const statusLabel =
    wsStatus === "connected"
      ? "已连接"
      : wsStatus === "connecting"
        ? "连接中…"
        : wsStatus === "error"
          ? "连接失败"
          : "未连接";

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-y border-border-subtle bg-surface-editor/60 px-4 py-2">
        <span className="text-sm font-semibold">消息</span>
        <Pill tone={statusTone}>{statusLabel}</Pill>
        {wsError && <span className="text-xs text-red-500">{wsError}</span>}
        <div className="flex-1" />
        {WS_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={responseTab === tab.id ? "primary" : "ghost"}
            className="h-8"
            onClick={() => setResponseTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
        <Button variant="ghost" className="h-8" onClick={clearWsMessages}>
          清空
        </Button>
        <Button variant="ghost" className="h-8" onClick={exportWsMessages}>
          导出
        </Button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-auto bg-surface-editor p-4 font-mono text-sm">
        {responseTab === "body" && wsMessages.length === 0 && (
          <p className="text-[var(--text-tertiary)]">连接成功后，收发的消息会显示在这里 · Ctrl+Enter 发送</p>
        )}

        {responseTab === "body" &&
          wsMessages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 ${msg.direction === "sent" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
            >
              <span className="text-[var(--text-tertiary)]">{msg.time}</span>{" "}
              <span className="text-[var(--text-tertiary)]">{msg.direction === "sent" ? "↑ 发送" : "↓ 接收"}</span>{" "}
              {msg.content}
            </div>
          ))}

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
