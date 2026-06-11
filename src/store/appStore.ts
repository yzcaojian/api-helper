import { create } from "zustand";
import type {
  BodyType,
  ConfigTab,
  Environment,
  HistoryItem,
  HttpMethod,
  HttpResponse,
  KeyValue,
  Protocol,
  ResolvedVariable,
  ResponseTab,
  ScriptLogLine,
  WsConnectionStatus,
  WsMessage,
} from "@/types";
import { createKeyValue } from "@/types";
import { DEFAULT_SCRIPT } from "@/lib/preScript";
import { sendHttpRequest } from "@/lib/http";
import { runPreRequestScript } from "@/lib/preScript";
import type { PersistedSnapshot } from "@/lib/storage";
import { wsConnect, wsDisconnect, wsSend } from "@/lib/ws";
import {
  extractVariableNames,
  formatTime,
  hasUnresolvedVariables,
  substituteVariables,
} from "@/lib/utils";

const DEFAULT_ENVS: Environment[] = [
  {
    id: "dev",
    name: "开发",
    variables: {
      baseUrl: "https://httpbin.org",
      apiSecret: "demo-secret",
      wsHost: "echo.websocket.events",
    },
  },
  {
    id: "test",
    name: "测试",
    variables: {
      baseUrl: "https://test.api.com",
      apiSecret: "test-secret",
      wsHost: "test.ws.com",
    },
  },
  {
    id: "prod",
    name: "生产",
    variables: {
      baseUrl: "https://api.example.com",
      apiSecret: "",
      wsHost: "ws.example.com",
    },
  },
];

interface AppState {
  theme: "system" | "light" | "dark";
  sidebarOpen: boolean;
  envDrawerOpen: boolean;
  settingsOpen: boolean;
  environments: Environment[];
  activeEnvId: string;
  protocol: Protocol;
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  bodyType: BodyType;
  bodyContent: string;
  scriptEnabled: boolean;
  scriptCode: string;
  scriptLogs: ScriptLogLine[];
  runtimeVars: Record<string, string>;
  configTab: ConfigTab;
  responseTab: ResponseTab;
  response: HttpResponse | null;
  loading: boolean;
  history: HistoryItem[];
  responseSplit: number;
  wsStatus: WsConnectionStatus;
  wsError: string | null;
  wsSessionId: string | null;
  wsMessages: WsMessage[];
  wsInput: string;

  setTheme: (theme: AppState["theme"]) => void;
  toggleSidebar: () => void;
  setEnvDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveEnvId: (id: string) => void;
  updateEnvVariable: (envId: string, key: string, value: string) => void;
  addEnvVariable: (envId: string) => void;
  setProtocol: (protocol: Protocol) => void;
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setParams: (params: KeyValue[]) => void;
  setHeaders: (headers: KeyValue[]) => void;
  setBodyType: (type: BodyType) => void;
  setBodyContent: (content: string) => void;
  setScriptEnabled: (enabled: boolean) => void;
  setScriptCode: (code: string) => void;
  setConfigTab: (tab: ConfigTab) => void;
  setResponseTab: (tab: ResponseTab) => void;
  setResponseSplit: (value: number) => void;
  setWsInput: (value: string) => void;
  setWsStatus: (status: WsConnectionStatus, error?: string | null) => void;
  appendWsMessage: (message: WsMessage) => void;
  clearWsMessages: () => void;
  exportWsMessages: () => void;
  getActiveEnv: () => Environment;
  getMergedVariables: () => Record<string, string>;
  getResolvedVariables: () => ResolvedVariable[];
  runScriptOnly: () => Promise<boolean>;
  prepareRequestContext: () => Promise<{
    ok: boolean;
    variables: Record<string, string>;
    scriptLogs: ScriptLogLine[];
    resolvedUrl: string;
    headers: Record<string, string>;
  }>;
  sendRequest: () => Promise<void>;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => Promise<void>;
  sendWebSocketMessage: (text?: string) => Promise<void>;
  handlePrimaryAction: () => Promise<void>;
  hydrate: (snapshot: PersistedSnapshot) => void;
}

function buildHttpUrl(baseUrl: string, params: KeyValue[], vars: Record<string, string>) {
  const resolvedBase = substituteVariables(baseUrl, vars);
  const enabled = params.filter((p) => p.enabled && p.key.trim());
  if (enabled.length === 0) return resolvedBase;

  const url = new URL(resolvedBase.includes("://") ? resolvedBase : `https://${resolvedBase}`);
  for (const param of enabled) {
    url.searchParams.set(
      substituteVariables(param.key.trim(), vars),
      substituteVariables(param.value, vars),
    );
  }
  return url.toString();
}

function buildWsUrl(baseUrl: string, params: KeyValue[], vars: Record<string, string>) {
  let resolved = substituteVariables(baseUrl, vars).trim();
  if (!resolved.includes("://")) {
    resolved = `wss://${resolved}`;
  }

  const enabled = params.filter((p) => p.enabled && p.key.trim());
  if (enabled.length === 0) return resolved;

  const url = new URL(resolved);
  for (const param of enabled) {
    url.searchParams.set(
      substituteVariables(param.key.trim(), vars),
      substituteVariables(param.value, vars),
    );
  }
  return url.toString();
}

function collectUsedIn(name: string, state: AppState): string[] {
  const places: string[] = [];
  if (extractVariableNames(state.url).includes(name)) places.push("URL");
  for (const p of state.params) {
    if (extractVariableNames(`${p.key}${p.value}`).includes(name)) places.push("Query");
  }
  for (const h of state.headers) {
    if (extractVariableNames(h.value).includes(name)) places.push("Header");
  }
  if (extractVariableNames(state.bodyContent).includes(name)) places.push("Body");
  return [...new Set(places)];
}

function headersFromState(state: AppState, variables: Record<string, string>) {
  return Object.fromEntries(
    state.headers
      .filter((h) => h.enabled && h.key.trim())
      .map(
        (h) =>
          [
            substituteVariables(h.key.trim(), variables),
            substituteVariables(h.value, variables),
          ] as const,
      ),
  );
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: "system",
  sidebarOpen: true,
  envDrawerOpen: false,
  settingsOpen: false,
  environments: DEFAULT_ENVS,
  activeEnvId: "dev",
  protocol: "http",
  method: "GET",
  url: "{{baseUrl}}/get",
  params: [createKeyValue("id", "1")],
  headers: [
    createKeyValue("X-Timestamp", "{{timestamp}}"),
    createKeyValue("X-Sign", "{{sign}}"),
    createKeyValue("Authorization", "Bearer {{accessToken}}"),
  ],
  bodyType: "json",
  bodyContent: '{\n  "username": "admin",\n  "sign": "{{sign}}"\n}',
  scriptEnabled: true,
  scriptCode: DEFAULT_SCRIPT,
  scriptLogs: [],
  runtimeVars: {},
  configTab: "headers",
  responseTab: "body",
  response: null,
  loading: false,
  history: [],
  responseSplit: 45,
  wsStatus: "idle",
  wsError: null,
  wsSessionId: null,
  wsMessages: [],
  wsInput: '{"type":"ping"}',

  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setEnvDrawerOpen: (open) => set({ envDrawerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setActiveEnvId: (id) => set({ activeEnvId: id }),
  updateEnvVariable: (envId, key, value) =>
    set((s) => ({
      environments: s.environments.map((env) =>
        env.id === envId ? { ...env, variables: { ...env.variables, [key]: value } } : env,
      ),
    })),
  addEnvVariable: (envId) =>
    set((s) => ({
      environments: s.environments.map((env) =>
        env.id === envId
          ? { ...env, variables: { ...env.variables, [`key_${Object.keys(env.variables).length + 1}`]: "" } }
          : env,
      ),
    })),
  setProtocol: (protocol) =>
    set((s) => ({
      protocol,
      url:
        protocol === "websocket" && s.url.includes("/get")
          ? "wss://{{wsHost}}"
          : protocol === "http" && s.url.startsWith("ws")
            ? "{{baseUrl}}/get"
            : s.url,
    })),
  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setParams: (params) => set({ params }),
  setHeaders: (headers) => set({ headers }),
  setBodyType: (bodyType) => set({ bodyType }),
  setBodyContent: (bodyContent) => set({ bodyContent }),
  setScriptEnabled: (scriptEnabled) => set({ scriptEnabled }),
  setScriptCode: (scriptCode) => set({ scriptCode }),
  setConfigTab: (configTab) => set({ configTab }),
  setResponseTab: (responseTab) => set({ responseTab }),
  setResponseSplit: (responseSplit) => set({ responseSplit }),
  setWsInput: (wsInput) => set({ wsInput }),
  setWsStatus: (wsStatus, error = null) => set({ wsStatus, wsError: error }),
  appendWsMessage: (message) => set((s) => ({ wsMessages: [...s.wsMessages, message] })),
  clearWsMessages: () => set({ wsMessages: [] }),
  exportWsMessages: () => {
    const { wsMessages } = get();
    const blob = new Blob([JSON.stringify(wsMessages, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ws-messages-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  getActiveEnv: () => {
    const state = get();
    return state.environments.find((e) => e.id === state.activeEnvId) ?? state.environments[0];
  },

  getMergedVariables: () => {
    const env = get().getActiveEnv();
    return { ...env.variables, ...get().runtimeVars };
  },

  getResolvedVariables: () => {
    const state = get();
    const env = state.getActiveEnv();
    const merged = state.getMergedVariables();
    const names = new Set<string>([
      ...Object.keys(env.variables),
      ...Object.keys(state.runtimeVars),
      ...extractVariableNames(state.url),
      ...state.params.flatMap((p) => extractVariableNames(`${p.key}${p.value}`)),
      ...state.headers.flatMap((h) => extractVariableNames(h.value)),
      ...extractVariableNames(state.bodyContent),
    ]);

    return [...names].map((name) => ({
      name,
      value: merged[name] ?? "",
      source: name in state.runtimeVars ? ("script" as const) : ("environment" as const),
      usedIn: collectUsedIn(name, state),
    }));
  },

  runScriptOnly: async () => {
    const state = get();
    const env = state.getActiveEnv();
    const result = await runPreRequestScript(state.scriptCode, { env: env.variables });
    set({ scriptLogs: result.logs, runtimeVars: result.variables, responseTab: "log" });
    return !result.error;
  },

  prepareRequestContext: async () => {
    const state = get();
    const env = state.getActiveEnv();
    let runtimeVars = state.runtimeVars;
    let scriptLogs = state.scriptLogs;

    if (state.scriptEnabled) {
      const scriptResult = await runPreRequestScript(state.scriptCode, { env: env.variables });
      runtimeVars = scriptResult.variables;
      scriptLogs = scriptResult.logs;
      set({ runtimeVars, scriptLogs });
      if (scriptResult.error) {
        set({ responseTab: "log" });
        return { ok: false, variables: {}, scriptLogs, resolvedUrl: "", headers: {} };
      }
    }

    const variables = { ...env.variables, ...runtimeVars };
    const resolvedUrl =
      state.protocol === "websocket"
        ? buildWsUrl(state.url, state.params, variables)
        : buildHttpUrl(state.url, state.params, variables);
    const headers = headersFromState(state, variables);
    const headerValues = Object.values(headers);
    const missing = [resolvedUrl, ...headerValues].flatMap((t) => hasUnresolvedVariables(t, variables));

    if (missing.length > 0) {
      set({
        scriptLogs: [
          ...scriptLogs,
          {
            id: crypto.randomUUID(),
            time: formatTime(),
            level: "error",
            message: `未定义变量: ${[...new Set(missing)].join(", ")}`,
          },
        ],
        responseTab: "log",
      });
      return { ok: false, variables, scriptLogs, resolvedUrl, headers };
    }

    return { ok: true, variables, scriptLogs, resolvedUrl, headers };
  },

  connectWebSocket: async () => {
    const state = get();
    if (state.wsStatus === "connected" || state.loading) return;

    set({ loading: true, wsError: null, wsStatus: "connecting" });
    const ctx = await get().prepareRequestContext();
    if (!ctx.ok) {
      set({ loading: false, wsStatus: "error", wsError: "变量或脚本未就绪" });
      return;
    }

    try {
      const sessionId = await wsConnect(ctx.resolvedUrl, ctx.headers);
      set({
        wsSessionId: sessionId,
        history: [
          {
            id: crypto.randomUUID(),
            protocol: "websocket",
            url: state.url,
            status: "已连接",
            time: formatTime(),
          },
          ...state.history.slice(0, 99),
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ loading: false, wsStatus: "error", wsError: message, wsSessionId: null });
    }
  },

  disconnectWebSocket: async () => {
    try {
      await wsDisconnect();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ wsError: message, wsStatus: "error" });
    } finally {
      set({ wsSessionId: null, wsStatus: "disconnected", loading: false });
    }
  },

  sendWebSocketMessage: async (text) => {
    const state = get();
    const message = (text ?? state.wsInput).trim();
    if (!message || state.wsStatus !== "connected" || !state.wsSessionId) return;

    try {
      await wsSend(state.wsSessionId, message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ wsError: msg, wsStatus: "error" });
    }
  },

  handlePrimaryAction: async () => {
    const state = get();
    if (state.protocol === "websocket") {
      if (state.wsStatus === "connected") {
        await get().disconnectWebSocket();
      } else {
        await get().connectWebSocket();
      }
      return;
    }
    await get().sendRequest();
  },

  sendRequest: async () => {
    const state = get();
    if (state.protocol === "websocket") {
      if (state.wsStatus === "connected") {
        await get().sendWebSocketMessage();
      } else {
        await get().connectWebSocket();
      }
      return;
    }

    set({ loading: true, response: null });
    const ctx = await get().prepareRequestContext();
    if (!ctx.ok) {
      set({ loading: false });
      return;
    }

    let body: string | undefined;
    if (state.method === "POST" && state.bodyType === "json") {
      body = substituteVariables(state.bodyContent, ctx.variables);
    }

    try {
      const response = await sendHttpRequest({
        method: state.method,
        url: ctx.resolvedUrl,
        headers: ctx.headers,
        body,
      });
      set({
        response,
        loading: false,
        responseTab: "body",
        history: [
          {
            id: crypto.randomUUID(),
            protocol: "http",
            method: state.method,
            url: state.url,
            status: String(response.status),
            time: formatTime(),
          },
          ...state.history.slice(0, 99),
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        loading: false,
        response: {
          status: 0,
          statusText: "Error",
          headers: {},
          body: "",
          durationMs: 0,
          sizeBytes: 0,
          error: message,
        },
        responseTab: "body",
      });
    }
  },

  hydrate: (snapshot) => {
    set({
      theme: snapshot.theme,
      activeEnvId: snapshot.activeEnvId,
      environments: snapshot.environments.length > 0 ? snapshot.environments : DEFAULT_ENVS,
      history: snapshot.history,
      sidebarOpen: snapshot.sidebarOpen,
      responseSplit: snapshot.responseSplit,
      protocol: snapshot.request.protocol,
      method: snapshot.request.method,
      url: snapshot.request.url,
      params: snapshot.request.params.length > 0 ? snapshot.request.params : [createKeyValue("id", "1")],
      headers:
        snapshot.request.headers.length > 0
          ? snapshot.request.headers
          : [
              createKeyValue("X-Timestamp", "{{timestamp}}"),
              createKeyValue("X-Sign", "{{sign}}"),
            ],
      bodyType: snapshot.request.bodyType,
      bodyContent: snapshot.request.bodyContent,
      scriptEnabled: snapshot.request.scriptEnabled,
      scriptCode: snapshot.request.scriptCode || DEFAULT_SCRIPT,
      wsInput: snapshot.request.wsInput || '{"type":"ping"}',
    });
  },
}));
