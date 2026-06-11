import { invoke } from "@tauri-apps/api/core";
import type { HttpMethod, HttpResponse } from "@/types";

export interface SendHttpOptions {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeoutSecs?: number;
}

interface RustHttpResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  duration_ms: number;
  size_bytes: number;
}

export async function sendHttpRequest(options: SendHttpOptions): Promise<HttpResponse> {
  const result = await invoke<RustHttpResponse>("send_http_request", {
    payload: {
      method: options.method,
      url: options.url,
      headers: options.headers,
      body: options.body,
      timeout_secs: options.timeoutSecs ?? 30,
    },
  });

  return {
    status: result.status,
    statusText: result.status_text,
    headers: result.headers,
    body: result.body,
    durationMs: result.duration_ms,
    sizeBytes: result.size_bytes,
  };
}
