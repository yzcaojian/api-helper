import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { listenWsMessage, listenWsStatus } from "@/lib/ws";
import { formatTime } from "@/lib/utils";

export function useWebSocketEvents() {
  const appendWsMessage = useAppStore((s) => s.appendWsMessage);
  const setWsStatus = useAppStore((s) => s.setWsStatus);

  useEffect(() => {
    let unlistenStatus: (() => void) | undefined;
    let unlistenMessage: (() => void) | undefined;

    void (async () => {
      try {
        unlistenStatus = await listenWsStatus((event) => {
          setWsStatus(event.status as "connecting" | "connected" | "disconnected" | "error", event.message ?? null);
          if (event.status === "connected") {
            useAppStore.setState({ wsSessionId: event.session_id, loading: false });
            useAppStore.getState().recordWsHistory("已连接");
          }
          if (event.status === "disconnected" || event.status === "error") {
            useAppStore.setState({ wsSessionId: null, loading: false });
          }
        });

        unlistenMessage = await listenWsMessage((event) => {
          appendWsMessage({
            id: crypto.randomUUID(),
            direction: event.direction,
            content: event.content,
            timestamp: event.timestamp,
            time: formatTime(new Date(event.timestamp)),
          });
        });
      } catch (err) {
        console.error("WebSocket event listener setup failed:", err);
      }
    })();

    return () => {
      unlistenStatus?.();
      unlistenMessage?.();
    };
  }, [appendWsMessage, setWsStatus]);
}

export function useWsMessageScroll(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, deps);

  return ref;
}
