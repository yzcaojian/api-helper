import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WsStatusEvent {
  session_id: string;
  status: WsStatus;
  message?: string;
}

export interface WsMessageEvent {
  session_id: string;
  direction: "sent" | "received";
  content: string;
  timestamp: number;
}

export async function wsConnect(url: string, headers: Record<string, string>): Promise<string> {
  return invoke<string>("ws_connect", {
    payload: { url, headers },
  });
}

export async function wsDisconnect(): Promise<void> {
  await invoke("ws_disconnect");
}

export async function wsSend(sessionId: string, message: string): Promise<void> {
  await invoke("ws_send", { sessionId, message });
}

export function listenWsStatus(handler: (event: WsStatusEvent) => void): Promise<UnlistenFn> {
  return listen<WsStatusEvent>("ws-status", (e) => handler(e.payload));
}

export function listenWsMessage(handler: (event: WsMessageEvent) => void): Promise<UnlistenFn> {
  return listen<WsMessageEvent>("ws-message", (e) => handler(e.payload));
}
