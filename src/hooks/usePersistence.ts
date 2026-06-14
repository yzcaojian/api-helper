import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { loadSnapshot, saveSnapshot, type PersistedSnapshot } from "@/lib/storage";

export function usePersistence() {
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const snapshot = await loadSnapshot();
      if (cancelled) return;
      if (snapshot) {
        useAppStore.getState().hydrate(snapshot);
      }
      hydrated.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      if (!hydrated.current) return;
      void persist(state);
    });

    return unsub;
  }, []);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSaved = "";

function persist(state: ReturnType<typeof useAppStore.getState>) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const snapshot: PersistedSnapshot = {
      version: 1,
      theme: state.theme,
      activeEnvId: state.activeEnvId,
      environments: state.environments,
      history: state.history,
      sidebarOpen: state.sidebarOpen,
      responseSplit: state.responseSplit,
      request: {
        protocol: state.protocol,
        method: state.method,
        url: state.url,
        params: state.params,
        headers: state.headers,
        bodyType: state.bodyType,
        bodyContent: state.bodyContent,
        scriptEnabled: state.scriptEnabled,
        scriptCode: state.scriptCode,
        wsInput: state.wsInput,
      },
    };
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSaved) return;
    lastSaved = serialized;
    void saveSnapshot(snapshot);
  }, 400);
}
