import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function saveJsonFile(filename: string, data: unknown): Promise<boolean> {
  const content = JSON.stringify(data, null, 2);

  if (!isTauri()) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  const path = await save({
    defaultPath: filename,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!path) return false;

  await writeTextFile(path, content);
  return true;
}

export async function pickJsonFile(): Promise<string | null> {
  if (!isTauri()) return null;

  const path = await open({
    multiple: false,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!path || Array.isArray(path)) return null;

  return readTextFile(path);
}
