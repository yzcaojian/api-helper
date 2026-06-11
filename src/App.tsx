import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { usePersistence } from "@/hooks/usePersistence";
import { useWebSocketEvents } from "@/hooks/useWebSocketEvents";
import { TopBar } from "@/components/layout/TopBar";
import { HistorySidebar } from "@/components/layout/HistorySidebar";
import { RequestBar } from "@/components/layout/RequestBar";
import { ConfigPanel } from "@/components/layout/ConfigPanel";
import { ResponsePanel } from "@/components/layout/ResponsePanel";
import { WebSocketPanel } from "@/components/layout/WebSocketPanel";
import { StatusBar } from "@/components/layout/StatusBar";
import { EnvDrawer } from "@/components/drawers/EnvDrawer";
import { SettingsDialog } from "@/components/settings/SettingsDialog";

function useThemeEffect() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      root.classList.toggle("dark", dark);
    };

    if (theme === "dark") {
      apply(true);
      return;
    }
    if (theme === "light") {
      apply(false);
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    apply(media.matches);
    const listener = (event: MediaQueryListEvent) => apply(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);
}

function SplitWorkspace() {
  const protocol = useAppStore((s) => s.protocol);
  const split = useAppStore((s) => s.responseSplit);
  const setResponseSplit = useAppStore((s) => s.setResponseSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const isWs = protocol === "websocket";

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = ((event.clientY - rect.top) / rect.height) * 100;
      setResponseSplit(Math.min(75, Math.max(25, next)));
    };

    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, setResponseSplit]);

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
      <div style={{ height: `${split}%` }} className="flex min-h-0 flex-col">
        <ConfigPanel />
      </div>
      <div
        role="separator"
        aria-orientation="horizontal"
        onMouseDown={() => setDragging(true)}
        className="h-1 shrink-0 cursor-row-resize bg-border-subtle hover:bg-accent"
      />
      <div style={{ height: `${100 - split}%` }} className="flex min-h-0 flex-col">
        {isWs ? <WebSocketPanel /> : <ResponsePanel />}
      </div>
    </div>
  );
}

export default function App() {
  useThemeEffect();
  usePersistence();
  useWebSocketEvents();

  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const protocol = useAppStore((s) => s.protocol);
  const wsStatus = useAppStore((s) => s.wsStatus);
  const handlePrimaryAction = useAppStore((s) => s.handlePrimaryAction);
  const runScriptOnly = useAppStore((s) => s.runScriptOnly);
  const sendWebSocketMessage = useAppStore((s) => s.sendWebSocketMessage);
  const setConfigTab = useAppStore((s) => s.setConfigTab);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        if (protocol === "websocket" && wsStatus === "connected") {
          void sendWebSocketMessage();
        } else {
          void handlePrimaryAction();
        }
      }
      if (event.ctrlKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        void runScriptOnly();
      }
      if (event.ctrlKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[placeholder*="URL"]');
        input?.focus();
        input?.select();
      }
      if (event.ctrlKey && /^[1-5]$/.test(event.key)) {
        const tabs = ["params", "headers", "body", "script", "variables"] as const;
        setConfigTab(tabs[Number(event.key) - 1]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [protocol, wsStatus, handlePrimaryAction, runScriptOnly, sendWebSocketMessage, setConfigTab]);

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && <HistorySidebar />}
        <main className="flex min-w-0 flex-1 flex-col">
          <RequestBar />
          <SplitWorkspace />
        </main>
      </div>
      <StatusBar />
      <EnvDrawer />
      <SettingsDialog />
    </div>
  );
}
