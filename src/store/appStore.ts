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
import { pickJsonFile, saveJsonFile } from "@/lib/files";
import type { ImportedRequest } from "@/lib/importExport";
import {
  exportApipostProject,
  exportEnvironmentsJson,
  exportPostmanCollection,
  parseImportFile,
} from "@/lib/importExport";
import {
  extractVariableNames,
  formatTime,
  hasUnresolvedVariables,
  substituteVariables,
} from "@/lib/utils";

function assertWebSocketUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith("ws://") && !trimmed.startsWith("wss://")) {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return "WebSocket 地址不能使用 http/https，请改为 ws:// 或 wss://";
    }
    return "WebSocket 地址须以 ws:// 或 wss:// 开头";
  }
  return null;
}

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
  historyFilter: "all" | "favorites";
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
  setHistoryFilter: (filter: "all" | "favorites") => void;
  toggleHistoryFavorite: (id: string) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
  applyHistoryItem: (item: HistoryItem) => void;
  setActiveEnvId: (id: string) => void;
  updateEnvVariable: (envId: string, key: string, value: string) => void;
  updateEnvVariableKey: (envId: string, oldKey: string, newKey: string) => void;
  removeEnvVariable: (envId: string, key: string) => void;
  addEnvVariable: (envId: string) => void;
  applyImportedRequest: (request: ImportedRequest) => void;
  importFromJson: (text: string) => { ok: boolean; message: string };
  importFromFile: () => Promise<{ ok: boolean; message: string }>;
  exportPostman: () => Promise<{ ok: boolean; message: string }>;
  exportApipost: () => Promise<{ ok: boolean; message: string }>;
  exportEnvironments: () => Promise<{ ok: boolean; message: string }>;
  recordWsHistory: (status: string, error?: string) => void;
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
  if (extractVariableNames(state.wsInput).includes(name)) places.push("消息");
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
  historyFilter: "all",
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
  setHistoryFilter: (historyFilter) => set({ historyFilter }),
  toggleHistoryFavorite: (id) =>
    set((s) => ({
      history: s.history.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item,
      ),
    })),
  removeHistoryItem: (id) =>
    set((s) => ({
      history: s.history.filter((item) => item.id !== id),
    })),
  clearHistory: () => set({ history: [] }),
  applyHistoryItem: (item) =>
    set({
      protocol: item.protocol,
      method: item.method ?? "GET",
      url: item.url,
      configTab: item.protocol === "websocket" ? "headers" : item.method === "POST" ? "body" : "headers",
    }),
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
  updateEnvVariableKey: (envId, oldKey, newKey) =>
    set((s) => ({
      environments: s.environments.map((env) => {
        if (env.id !== envId || oldKey === newKey) return env;
        const next = { ...env.variables };
        const val = next[oldKey] ?? "";
        delete next[oldKey];
        if (newKey.trim()) next[newKey.trim()] = val;
        return { ...env, variables: next };
      }),
    })),
  removeEnvVariable: (envId, key) =>
    set((s) => ({
      environments: s.environments.map((env) => {
        if (env.id !== envId) return env;
        const next = { ...env.variables };
        delete next[key];
        return { ...env, variables: next };
      }),
    })),
  applyImportedRequest: (request) =>
    set({
      protocol: request.protocol,
      method: request.method ?? "GET",
      url: request.url,
      params: request.params.length > 0 ? request.params : [createKeyValue()],
      headers: request.headers.length > 0 ? request.headers : [createKeyValue()],
      bodyType: request.bodyType,
      bodyContent: request.bodyContent,
      scriptCode: request.scriptCode || DEFAULT_SCRIPT,
      configTab: request.protocol === "websocket" ? "headers" : "params",
    }),
  importFromJson: (text) => {
    try {
      const result = parseImportFile(text);
      let message = `已从 ${result.source} 格式导入`;
      if (result.environments.length > 0) {
        const merged = result.environments.map((e, i) => ({
          ...e,
          id: `${e.id}_${i}_${Date.now()}`,
        }));
        set((s) => ({
          environments: [...s.environments, ...merged],
          activeEnvId: merged[0].id,
        }));
        message += ` ${merged.length} 套环境`;
      }
      if (result.requests.length > 0) {
        get().applyImportedRequest(result.requests[0]);
        const historyItems: HistoryItem[] = result.requests.map((r) => ({
          id: crypto.randomUUID(),
          protocol: r.protocol,
          method: r.method,
          url: r.url,
          status: "导入",
          time: formatTime(),
          favorite: false,
        }));
        set((s) => ({ history: [...historyItems, ...s.history].slice(0, 100) }));
        message += ` ${result.requests.length} 条接口`;
      }
      if (result.environments.length === 0 && result.requests.length === 0) {
        return { ok: false, message: "未识别到可导入的环境或接口" };
      }
      return { ok: true, message };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "JSON 解析失败" };
    }
  },
  importFromFile: async () => {
    const text = await pickJsonFile();
    if (text === null) {
      return { ok: false, message: "已取消" };
    }
    return get().importFromJson(text);
  },
  exportPostman: async () => {
    const s = get();
    const ok = await saveJsonFile(
      "api-helper-postman.json",
      exportPostmanCollection({
        name: "API Helper",
        url: s.url,
        method: s.method,
        params: s.params,
        headers: s.headers,
        bodyType: s.bodyType,
        bodyContent: s.bodyContent,
        scriptCode: s.scriptCode,
        environments: s.environments,
        history: s.history,
      }),
    );
    return ok
      ? { ok: true, message: "Postman 集合已保存" }
      : { ok: false, message: "已取消保存" };
  },
  exportApipost: async () => {
    const s = get();
    const ok = await saveJsonFile(
      "api-helper-apipost.json",
      exportApipostProject({
        name: "API Helper",
        url: s.url,
        method: s.method,
        params: s.params,
        headers: s.headers,
        bodyContent: s.bodyContent,
        environments: s.environments,
      }),
    );
    return ok
      ? { ok: true, message: "Apipost 项目已保存" }
      : { ok: false, message: "已取消保存" };
  },
  exportEnvironments: async () => {
    const ok = await saveJsonFile(
      "api-helper-environments.json",
      exportEnvironmentsJson(get().environments),
    );
    return ok
      ? { ok: true, message: "环境变量已保存" }
      : { ok: false, message: "已取消保存" };
  },
  recordWsHistory: (status, error) => {
    const state = get();
    set({
      history: [
        {
          id: crypto.randomUUID(),
          protocol: "websocket",
          url: state.url,
          status: error ? `${status}: ${error}` : status,
          time: formatTime(),
        },
        ...state.history.slice(0, 99),
      ],
    });
  },
  setProtocol: (protocol) =>
    set((s) => ({
      protocol,
      configTab: protocol === "websocket" ? "body" : s.configTab,
      response: protocol === "websocket" ? null : s.response,
      wsError: protocol === "http" ? null : s.wsError,
      url:
        protocol === "websocket" && s.url.includes("/get")
          ? "wss://{{wsHost}}"
          : protocol === "http" && (s.url.startsWith("ws") || s.url.startsWith("wss"))
            ? "{{baseUrl}}/get"
            : s.url,
    })),
  setMethod: (method) =>
    set((s) => ({
      method,
      configTab: method === "GET" && s.configTab === "body" ? "headers" : s.configTab,
    })),
  setUrl: (url) => set({ url }),
  setParams: (params) => set({ params }),
  setHeaders: (headers) => set({ headers }),
  setBodyType: (bodyType) => set({ bodyType }),
  setBodyContent: (bodyContent) => set({ bodyContent }),
  setScriptEnabled: (scriptEnabled) => set({ scriptEnabled }),
  setScriptCode: (scriptCode) => set({ scriptCode }),
  setConfigTab: (configTab) => {
    const state = get();
    if (configTab === "body" && state.protocol === "http" && state.method === "GET") {
      set({ method: "POST", configTab: "body" });
      return;
    }
    set({ configTab });
  },
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
      ...extractVariableNames(state.wsInput),
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

    set({ loading: true, wsError: null, wsStatus: "connecting", response: null });
    const ctx = await get().prepareRequestContext();
    if (!ctx.ok) {
      set({ loading: false, wsStatus: "error", wsError: "变量或脚本未就绪" });
      get().recordWsHistory("失败", "变量或脚本未就绪");
      return;
    }

    const urlError = assertWebSocketUrl(ctx.resolvedUrl);
    if (urlError) {
      set({ loading: false, wsStatus: "error", wsError: urlError, wsSessionId: null });
      get().recordWsHistory("失败", urlError);
      return;
    }

    try {
      const sessionId = await wsConnect(ctx.resolvedUrl, ctx.headers);
      set({ wsSessionId: sessionId, wsStatus: "connected", loading: false, wsError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const friendly = message.includes("200 OK")
        ? "服务器返回 HTTP 200 而非 WebSocket 握手（101），请确认地址为 ws:// 或 wss://"
        : message;
      set({ loading: false, wsStatus: "error", wsError: friendly, wsSessionId: null });
      get().recordWsHistory("失败", friendly);
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
    const raw = (text ?? state.wsInput).trim();
    if (!raw) {
      set({ wsError: "消息内容不能为空" });
      return;
    }
    if (state.wsStatus !== "connected" || !state.wsSessionId) {
      set({ wsError: "请先连接 WebSocket" });
      return;
    }

    const ctx = await get().prepareRequestContext();
    const variables = ctx.ok ? ctx.variables : get().getMergedVariables();
    const message = substituteVariables(raw, variables);
    const missing = hasUnresolvedVariables(message, variables);
    if (missing.length > 0) {
      set({ wsError: `未定义变量: ${[...new Set(missing)].join(", ")}` });
      return;
    }

    set({ wsError: null });
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
        await get().sendWebSocketMessage();
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
    if (state.method === "POST" && state.bodyType !== "none") {
      if (state.bodyType === "json" || state.bodyType === "raw") {
        body = substituteVariables(state.bodyContent, ctx.variables);
      }
    }

    const headers = { ...ctx.headers };
    if (state.method === "POST" && body && !Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
      headers["Content-Type"] =
        state.bodyType === "json" ? "application/json" : "text/plain";
    }

    try {
      const response = await sendHttpRequest({
        method: state.method,
        url: ctx.resolvedUrl,
        headers,
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
