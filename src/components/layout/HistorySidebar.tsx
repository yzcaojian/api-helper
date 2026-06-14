import { useAppStore } from "@/store/appStore";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";

export function HistorySidebar() {
  const history = useAppStore((s) => s.history);
  const historyFilter = useAppStore((s) => s.historyFilter);
  const setHistoryFilter = useAppStore((s) => s.setHistoryFilter);
  const applyHistoryItem = useAppStore((s) => s.applyHistoryItem);
  const toggleHistoryFavorite = useAppStore((s) => s.toggleHistoryFavorite);
  const removeHistoryItem = useAppStore((s) => s.removeHistoryItem);
  const clearHistory = useAppStore((s) => s.clearHistory);

  const filtered =
    historyFilter === "favorites" ? history.filter((item) => item.favorite) : history;

  const onClearHistory = () => {
    if (history.length === 0) return;
    if (window.confirm("确定清空全部历史记录？")) {
      clearHistory();
    }
  };

  return (
    <aside className="relative z-10 flex w-[200px] shrink-0 flex-col border-r border-border-subtle bg-surface-elevated">
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
        <Pill tone="info" active={historyFilter === "all"} onClick={() => setHistoryFilter("all")}>
          全部
        </Pill>
        <Pill tone="neutral" active={historyFilter === "favorites"} onClick={() => setHistoryFilter("favorites")}>
          收藏
        </Pill>
        <div className="flex-1" />
        {history.length > 0 && (
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={onClearHistory}>
            清空
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2">
        {filtered.length === 0 ? (
          <p className="p-3 text-center text-xs text-[var(--text-tertiary)]">
            {historyFilter === "favorites" ? "暂无收藏" : "暂无历史"}
          </p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="mb-1.5 flex items-start gap-0.5 rounded-md border border-border-subtle bg-surface hover:bg-surface-editor"
            >
              <button
                type="button"
                onClick={() => applyHistoryItem(item)}
                className="min-w-0 flex-1 p-2 text-left"
              >
                <div className="flex items-center gap-1.5">
                  <Pill
                    tone={
                      item.protocol === "websocket"
                        ? "info"
                        : item.method === "GET"
                          ? "success"
                          : "warning"
                    }
                  >
                    {item.protocol === "websocket" ? "长连" : item.method}
                  </Pill>
                  <span className="truncate text-xs">{item.url}</span>
                </div>
                <div className="mt-0.5 truncate text-[10px] text-[var(--text-tertiary)]">
                  {item.status} · {item.time}
                </div>
              </button>
              <Button
                type="button"
                variant="ghost"
                className="h-7 w-7 shrink-0 px-0 text-sm"
                aria-label={item.favorite ? "取消收藏" : "加入收藏"}
                onClick={() => toggleHistoryFavorite(item.id)}
              >
                {item.favorite ? "★" : "☆"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-7 w-7 shrink-0 px-0 text-xs text-[var(--text-tertiary)] hover:text-red-500"
                aria-label="删除"
                onClick={() => removeHistoryItem(item.id)}
              >
                ×
              </Button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
