import { load } from "@tauri-apps/plugin-store";
import type {
  BodyType,
  Environment,
  HistoryItem,
  HttpMethod,
  KeyValue,
  Protocol,
} from "@/types";

const STORE_FILE = "api-helper.json";

export interface RequestSnapshot {
  protocol: Protocol;
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  bodyType: BodyType;
  bodyContent: string;
  scriptEnabled: boolean;
  scriptCode: string;
  wsInput: string;
}

export interface PersistedSnapshot {
  version: 1;
  theme: "system" | "light" | "dark";
  activeEnvId: string;
  environments: Environment[];
  history: HistoryItem[];
  sidebarOpen: boolean;
  responseSplit: number;
  request: RequestSnapshot;
}

const DEFAULT_SNAPSHOT: PersistedSnapshot = {
  version: 1,
  theme: "system",
  activeEnvId: "dev",
  environments: [],
  history: [],
  sidebarOpen: true,
  responseSplit: 45,
  request: {
    protocol: "http",
    method: "GET",
    url: "{{baseUrl}}/get",
    params: [],
    headers: [],
    bodyType: "json",
    bodyContent: '{\n  "username": "admin"\n}',
    scriptEnabled: true,
    scriptCode: "",
    wsInput: '{"type":"ping"}',
  },
};

let storePromise: ReturnType<typeof load> | null = null;

async function getStore() {
  if (!storePromise) {
    storePromise = load(STORE_FILE, { autoSave: false, defaults: {} });
  }
  return storePromise;
}

export async function loadSnapshot(): Promise<PersistedSnapshot | null> {
  try {
    const store = await getStore();
    const data = await store.get<PersistedSnapshot>("snapshot");
    if (!data || data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export async function saveSnapshot(snapshot: PersistedSnapshot): Promise<void> {
  const store = await getStore();
  await store.set("snapshot", snapshot);
  await store.save();
}

export { DEFAULT_SNAPSHOT };
