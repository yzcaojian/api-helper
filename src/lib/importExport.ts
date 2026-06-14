import type { BodyType, Environment, HistoryItem, HttpMethod, KeyValue, Protocol } from "@/types";
import { createKeyValue } from "@/types";

export interface ImportedRequest {
  name: string;
  protocol: Protocol;
  method?: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  bodyType: BodyType;
  bodyContent: string;
  scriptCode?: string;
}

export interface ImportResult {
  environments: Environment[];
  requests: ImportedRequest[];
  source: "postman" | "apipost" | "api-helper";
}

type JsonObject = Record<string, unknown>;

function asObject(v: unknown): JsonObject | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as JsonObject) : null;
}

function kvFromPairs(pairs: unknown): KeyValue[] {
  if (!Array.isArray(pairs)) return [];
  return pairs
    .map((item) => {
      const row = asObject(item);
      if (!row) return null;
      const key = String(row.key ?? row.name ?? "");
      const value = String(row.value ?? row.val ?? row.content ?? "");
      const enabled = row.disabled !== true && row.enable !== false;
      if (!key.trim()) return null;
      return { ...createKeyValue(key, value), enabled };
    })
    .filter((x): x is KeyValue => x !== null);
}

function postmanUrlToString(url: unknown): string {
  if (typeof url === "string") return url;
  const obj = asObject(url);
  if (!obj) return "";
  if (typeof obj.raw === "string") return obj.raw;
  return "";
}

function postmanQuery(url: unknown): KeyValue[] {
  const obj = asObject(url);
  if (!obj || !Array.isArray(obj.query)) return [];
  return kvFromPairs(obj.query);
}

function parsePostmanRequest(item: JsonObject): ImportedRequest | null {
  const request = asObject(item.request);
  if (!request) return null;

  const method = String(request.method ?? "GET").toUpperCase();
  const url = postmanUrlToString(request.url);
  if (!url) return null;

  const headers = kvFromPairs(request.header);
  const params = postmanQuery(request.url);
  const body = asObject(request.body);
  let bodyType: BodyType = "none";
  let bodyContent = "";

  if (body) {
    const mode = String(body.mode ?? "raw");
    if (mode === "raw") {
      bodyType = "json";
      bodyContent = String(body.raw ?? "");
    } else if (mode === "urlencoded" || mode === "formdata") {
      bodyType = "form";
      bodyContent = JSON.stringify(kvFromPairs(body.urlencoded ?? body.formdata), null, 2);
    }
  }

  const events = Array.isArray(item.event) ? item.event : [];
  const prerequest = events.find((e) => asObject(e)?.listen === "prerequest");
  const scriptCode =
    typeof asObject(asObject(prerequest)?.script)?.exec === "object"
      ? (asObject(asObject(prerequest)?.script)?.exec as string[]).join("\n")
      : undefined;

  return {
    name: String(item.name ?? url),
    protocol: "http",
    method: method === "POST" ? "POST" : "GET",
    url,
    params,
    headers,
    bodyType,
    bodyContent,
    scriptCode,
  };
}

function parseApipostApi(api: JsonObject): ImportedRequest | null {
  const url = String(api.url ?? api.path ?? "");
  if (!url) return null;
  const method = String(api.method ?? api.requestMethod ?? "GET").toUpperCase();

  const headerObj = asObject(api.header) ?? asObject(api.headers);
  const queryObj = asObject(api.query) ?? asObject(api.params);
  const headers = kvFromPairs(headerObj?.parameter ?? headerObj?.params ?? api.headerList);
  const params = kvFromPairs(queryObj?.parameter ?? queryObj?.params ?? api.queryList);

  const body = asObject(api.body) ?? asObject(api.requestBody);
  let bodyType: BodyType = "none";
  let bodyContent = "";
  if (body) {
    const mode = String(body.mode ?? body.type ?? "raw");
    bodyContent = String(body.raw ?? body.content ?? body.text ?? "");
    bodyType = bodyContent ? (mode.includes("json") ? "json" : "raw") : "none";
  }

  return {
    name: String(api.name ?? api.title ?? url),
    protocol: url.startsWith("ws") ? "websocket" : "http",
    method: method === "POST" ? "POST" : "GET",
    url,
    params,
    headers,
    bodyType,
    bodyContent,
  };
}

function postmanVariables(data: JsonObject): Environment[] {
  const vars = Array.isArray(data.variable) ? data.variable : [];
  if (vars.length === 0) return [];
  const variables: Record<string, string> = {};
  for (const v of vars) {
    const row = asObject(v);
    if (!row) continue;
    const key = String(row.key ?? "");
    if (key) variables[key] = String(row.value ?? "");
  }
  return [{ id: "imported", name: "导入环境", variables }];
}

function apipostEnvironments(data: JsonObject): Environment[] {
  const envs: Environment[] = [];
  const list = Array.isArray(data.env) ? data.env : Array.isArray(data.environments) ? data.environments : [];
  for (const item of list) {
    const row = asObject(item);
    if (!row) continue;
    const variables: Record<string, string> = {};
    const values = Array.isArray(row.values) ? row.values : Array.isArray(row.variable) ? row.variable : [];
    for (const v of values) {
      const vr = asObject(v);
      if (!vr) continue;
      const key = String(vr.key ?? vr.name ?? "");
      if (key) variables[key] = String(vr.value ?? vr.val ?? "");
    }
    if (Object.keys(row).some((k) => !["name", "values", "variable", "id"].includes(k)) && values.length === 0) {
      for (const [k, val] of Object.entries(row)) {
        if (typeof val === "string") variables[k] = val;
      }
    }
    envs.push({
      id: String(row.id ?? row.name ?? crypto.randomUUID()),
      name: String(row.name ?? "导入环境"),
      variables,
    });
  }
  return envs;
}

export function parseImportFile(text: string): ImportResult {
  const data = JSON.parse(text) as JsonObject;
  const requests: ImportedRequest[] = [];
  let environments: Environment[] = [];
  let source: ImportResult["source"] = "api-helper";

  const schema = String((asObject(data.info)?.schema) ?? "");
  if (schema.includes("postman.com") || Array.isArray(data.item)) {
    source = "postman";
    environments = postmanVariables(data);
    const walk = (items: unknown[]) => {
      for (const item of items) {
        const obj = asObject(item);
        if (!obj) continue;
        if (Array.isArray(obj.item)) walk(obj.item);
        else {
          const req = parsePostmanRequest(obj);
          if (req) requests.push(req);
        }
      }
    };
    if (Array.isArray(data.item)) walk(data.item);
  } else if (asObject(data.project)?.apis || Array.isArray(data.apis)) {
    source = "apipost";
    environments = apipostEnvironments(data);
    const apis = (asObject(data.project)?.apis as unknown[]) ?? (data.apis as unknown[]) ?? [];
    for (const api of apis) {
      const parsed = parseApipostApi(asObject(api) ?? {});
      if (parsed) requests.push(parsed);
    }
  } else if (Array.isArray(data.values)) {
    environments = [
      {
        id: "imported",
        name: String(data.name ?? "导入环境"),
        variables: Object.fromEntries(
          (data.values as unknown[])
            .map((v) => asObject(v))
            .filter(Boolean)
            .map((v) => [String(v!.key), String(v!.value ?? "")]),
        ),
      },
    ];
  } else if (Array.isArray(data.environments)) {
    environments = data.environments as Environment[];
  } else if (data.version === 1 && asObject(data.request)) {
    source = "api-helper";
    const req = asObject(data.request)!;
    requests.push({
      name: "API Helper 请求",
      protocol: (req.protocol as Protocol) ?? "http",
      method: (req.method as HttpMethod) ?? "GET",
      url: String(req.url ?? ""),
      params: (req.params as KeyValue[]) ?? [],
      headers: (req.headers as KeyValue[]) ?? [],
      bodyType: (req.bodyType as BodyType) ?? "json",
      bodyContent: String(req.bodyContent ?? ""),
      scriptCode: String(req.scriptCode ?? ""),
    });
    if (Array.isArray(data.environments)) environments = data.environments as Environment[];
  }

  return { environments, requests, source };
}

export function exportPostmanCollection(input: {
  name: string;
  url: string;
  method: HttpMethod;
  params: KeyValue[];
  headers: KeyValue[];
  bodyType: BodyType;
  bodyContent: string;
  scriptCode: string;
  environments: Environment[];
  history: HistoryItem[];
}) {
  const toItem = (name: string, url: string, method?: HttpMethod) => ({
    name,
    request: {
      method: method ?? "GET",
      header: input.headers.filter((h) => h.enabled).map((h) => ({ key: h.key, value: h.value })),
      url: {
        raw: url,
        query: input.params.filter((p) => p.enabled).map((p) => ({ key: p.key, value: p.value })),
      },
      body:
        input.bodyType === "none"
          ? undefined
          : { mode: "raw", raw: input.bodyContent },
    },
    event: input.scriptCode
      ? [{ listen: "prerequest", script: { type: "text/javascript", exec: input.scriptCode.split("\n") } }]
      : undefined,
  });

  const items = [
    toItem("当前请求", input.url, input.method),
    ...input.history
      .filter((h) => h.protocol === "http")
      .slice(0, 50)
      .map((h) => toItem(h.url, h.url, h.method)),
  ];

  const activeEnv = input.environments[0];
  return {
    info: {
      name: input.name,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
    variable: activeEnv
      ? Object.entries(activeEnv.variables).map(([key, value]) => ({ key, value }))
      : [],
  };
}

export function exportApipostProject(input: {
  name: string;
  url: string;
  method: HttpMethod;
  params: KeyValue[];
  headers: KeyValue[];
  bodyContent: string;
  environments: Environment[];
}) {
  return {
    project: {
      name: input.name,
      apis: [
        {
          name: "当前请求",
          method: input.method,
          url: input.url,
          header: { parameter: input.headers.filter((h) => h.enabled).map((h) => ({ key: h.key, value: h.value })) },
          query: { parameter: input.params.filter((p) => p.enabled).map((p) => ({ key: p.key, value: p.value })) },
          body: { mode: "raw", raw: input.bodyContent },
        },
      ],
    },
    env: input.environments.map((e) => ({
      name: e.name,
      values: Object.entries(e.variables).map(([key, value]) => ({ key, value, enable: true })),
    })),
  };
}

export function exportEnvironmentsJson(environments: Environment[]) {
  return { environments };
}
