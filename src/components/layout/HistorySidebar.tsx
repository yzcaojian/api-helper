import { useAppStore } from "@/store/appStore";
import { Pill } from "@/components/ui/Pill";

export function HistorySidebar() {
  const history = useAppStore((s) => s.history);
  const setUrl = useAppStore((s) => s.setUrl);
  const setMethod = useAppStore((s) => s.setMethod);
  const setProtocol = useAppStore((s) => s.setProtocol);

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-border-subtle bg-surface-elevated">
      <div className="border-b border-border-subtle p-3">
        <input
          type="search"
          placeholder="搜索请求…"
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none"
        />
        <div className="mt-2 flex gap-2">
          <Pill tone="info">全部</Pill>
          <Pill tone="neutral">收藏</Pill>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {history.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setProtocol(item.protocol);
              if (item.method) setMethod(item.method);
              setUrl(item.url);
            }}
            className="mb-2 w-full rounded-md border border-border-subtle bg-surface p-2 text-left transition-colors hover:border-border hover:bg-surface-editor"
          >
            <div className="flex items-center gap-2">
              <Pill tone={item.method === "GET" ? "success" : item.method === "POST" ? "warning" : "info"}>
                {item.method ?? "WS"}
              </Pill>
              <span className="truncate text-sm">{item.url}</span>
            </div>
            <div className="mt-1 text-xs text-[var(--text-tertiary)]">
              {item.status} · {item.time}
              {item.favorite ? " · 收藏" : ""}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
