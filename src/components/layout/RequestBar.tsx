import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export function RequestBar() {
  const protocol = useAppStore((s) => s.protocol);
  const method = useAppStore((s) => s.method);
  const url = useAppStore((s) => s.url);
  const loading = useAppStore((s) => s.loading);
  const wsStatus = useAppStore((s) => s.wsStatus);
  const setProtocol = useAppStore((s) => s.setProtocol);
  const setMethod = useAppStore((s) => s.setMethod);
  const setUrl = useAppStore((s) => s.setUrl);
  const handlePrimaryAction = useAppStore((s) => s.handlePrimaryAction);
  const sendWebSocketMessage = useAppStore((s) => s.sendWebSocketMessage);
  const disconnectWebSocket = useAppStore((s) => s.disconnectWebSocket);

  const isWs = protocol === "websocket";
  const wsConnected = wsStatus === "connected";

  return (
    <div className="relative z-20 border-b border-border-subtle px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={protocol}
          onChange={(v) => setProtocol(v as "http" | "websocket")}
          options={[
            { value: "http", label: "HTTP" },
            { value: "websocket", label: "WebSocket" },
          ]}
        />
        {!isWs && (
          <Select
            value={method}
            onChange={(v) => setMethod(v as "GET" | "POST")}
            options={[
              { value: "GET", label: "GET" },
              { value: "POST", label: "POST" },
            ]}
          />
        )}
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入 URL，支持 {{变量}}"
          className="h-9 min-w-[280px] flex-1 rounded-md border border-border bg-surface-elevated px-3 font-mono text-sm focus:border-accent focus:outline-none"
        />
        {isWs && (
          <span className="text-xs text-[var(--text-secondary)]">
            {wsStatus === "connected"
              ? "已连接"
              : wsStatus === "connecting"
                ? "连接中…"
                : wsStatus === "error"
                  ? "连接失败"
                  : "未连接"}
          </span>
        )}
        {isWs && wsConnected ? (
          <>
            <Button variant="primary" onClick={() => void sendWebSocketMessage()}>
              发送
            </Button>
            <Button variant="secondary" onClick={() => void disconnectWebSocket()}>
              断开
            </Button>
          </>
        ) : (
          <Button variant="primary" disabled={loading} onClick={() => void handlePrimaryAction()}>
            {loading ? (isWs ? "连接中…" : "请求中…") : isWs ? "连接" : "发送"}
          </Button>
        )}
      </div>
    </div>
  );
}
