import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { useWsMessageScroll } from "@/hooks/useWebSocketEvents";

export function WebSocketPanel() {
  const wsMessages = useAppStore((s) => s.wsMessages);
  const wsInput = useAppStore((s) => s.wsInput);
  const wsStatus = useAppStore((s) => s.wsStatus);
  const wsError = useAppStore((s) => s.wsError);
  const scriptLogs = useAppStore((s) => s.scriptLogs);
  const setWsInput = useAppStore((s) => s.setWsInput);
  const sendWebSocketMessage = useAppStore((s) => s.sendWebSocketMessage);
  const clearWsMessages = useAppStore((s) => s.clearWsMessages);
  const exportWsMessages = useAppStore((s) => s.exportWsMessages);

  const listRef = useWsMessageScroll([wsMessages.length]);

  const statusLabel =
    wsStatus === "connected"
      ? "已连接"
      : wsStatus === "connecting"
        ? "连接中…"
        : wsStatus === "error"
          ? "错误"
          : "未连接";

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-y border-border-subtle bg-surface-editor/60 px-4 py-2">
        <span className="text-sm font-semibold">Messages</span>
        <span className="text-xs text-[var(--text-secondary)]">{statusLabel}</span>
        {wsError && <span className="text-xs text-red-500">{wsError}</span>}
        <div className="flex-1" />
        <Button variant="ghost" className="h-8" onClick={clearWsMessages}>
          清空
        </Button>
        <Button variant="ghost" className="h-8" onClick={exportWsMessages}>
          导出
        </Button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-auto bg-surface-editor p-4 font-mono text-sm">
        {wsMessages.length === 0 ? (
          <p className="text-[var(--text-tertiary)]">连接后消息将显示在这里</p>
        ) : (
          wsMessages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 ${msg.direction === "sent" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
            >
              <span className="text-[var(--text-tertiary)]">{msg.time}</span>{" "}
              <span className="text-[var(--text-tertiary)]">{msg.direction === "sent" ? "↑" : "↓"}</span>{" "}
              {msg.content}
            </div>
          ))
        )}

        {scriptLogs.length > 0 && (
          <div className="mt-4 border-t border-border-subtle pt-3">
            <div className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">脚本日志</div>
            {scriptLogs.map((line) => (
              <div key={line.id} className="text-xs text-[var(--text-tertiary)]">
                [{line.time}] {line.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border-subtle bg-surface-elevated p-3">
        <input
          value={wsInput}
          onChange={(e) => setWsInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendWebSocketMessage();
            }
            if (e.ctrlKey && e.key === "Enter") {
              e.preventDefault();
              void sendWebSocketMessage();
            }
          }}
          placeholder="与上方「消息」标签同步，Enter 发送"
          disabled={wsStatus !== "connected"}
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <Button
          variant="primary"
          disabled={wsStatus !== "connected"}
          onClick={() => void sendWebSocketMessage()}
        >
          发送
        </Button>
      </div>
    </section>
  );
}
