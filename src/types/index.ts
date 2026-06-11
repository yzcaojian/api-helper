export type Protocol = "http" | "websocket";

export type HttpMethod = "GET" | "POST";

export type BodyType = "none" | "json" | "form" | "raw";

export type ConfigTab = "params" | "headers" | "body" | "script" | "variables";

export type ResponseTab = "body" | "headers" | "log";

export interface KeyValue {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  sizeBytes: number;
  error?: string;
}

export interface ScriptLogLine {
  id: string;
  time: string;
  level: "info" | "error" | "success";
  message: string;
}

export interface ResolvedVariable {
  name: string;
  value: string;
  source: "environment" | "script";
  usedIn: string[];
}

export interface HistoryItem {
  id: string;
  protocol: Protocol;
  method?: HttpMethod;
  url: string;
  status?: string;
  time: string;
  favorite?: boolean;
}

export type WsConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface WsMessage {
  id: string;
  direction: "sent" | "received";
  content: string;
  timestamp: number;
  time: string;
}

export function createKeyValue(key = "", value = ""): KeyValue {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    key,
    value,
  };
}
