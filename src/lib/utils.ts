const VAR_PATTERN = /\{\{([^}]+)\}\}/g;

export function extractVariableNames(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(VAR_PATTERN)) {
    const name = match[1]?.trim();
    if (name) names.add(name);
  }
  return [...names];
}

export function substituteVariables(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(VAR_PATTERN, (_, name: string) => {
    const key = name.trim();
    return variables[key] ?? `{{${key}}}`;
  });
}

export function hasUnresolvedVariables(text: string, variables: Record<string, string>): string[] {
  const missing: string[] = [];
  for (const name of extractVariableNames(text)) {
    if (!(name in variables)) missing.push(name);
  }
  return missing;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(date = new Date()): string {
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function statusTone(status: number): "success" | "warning" | "danger" | "info" {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "info";
  if (status >= 400 && status < 500) return "warning";
  if (status >= 500) return "danger";
  return "info";
}
