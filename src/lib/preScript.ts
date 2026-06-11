import type { ScriptLogLine } from "@/types";
import { scriptCrypto } from "@/lib/crypto";

export interface ScriptContext {
  env: Record<string, string>;
  initialVars?: Record<string, string>;
}

export interface ScriptResult {
  variables: Record<string, string>;
  logs: ScriptLogLine[];
  error?: string;
  durationMs: number;
}

class VarsStore {
  private values: Record<string, string>;

  constructor(initial: Record<string, string>) {
    this.values = { ...initial };
  }

  set(key: string, value: string) {
    this.values[key] = String(value);
  }

  get(key: string) {
    return this.values[key];
  }

  snapshot() {
    return { ...this.values };
  }
}

function nowTime() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function logLine(level: ScriptLogLine["level"], message: string): ScriptLogLine {
  return {
    id: crypto.randomUUID(),
    time: nowTime(),
    level,
    message,
  };
}

export async function runPreRequestScript(
  code: string,
  context: ScriptContext,
): Promise<ScriptResult> {
  const started = performance.now();
  const logs: ScriptLogLine[] = [];
  const vars = new VarsStore(context.initialVars ?? {});

  const env = {
    get: (key: string) => {
      const value = context.env[key];
      if (value === undefined) {
        throw new Error(`Environment variable "${key}" is not defined`);
      }
      return value;
    },
  };

  const api = {
    vars: {
      set: (key: string, value: string) => vars.set(key, value),
      get: (key: string) => vars.get(key),
    },
    env,
    crypto: scriptCrypto,
    console: {
      log: (...args: unknown[]) => {
        logs.push(logLine("info", args.map(String).join(" ")));
      },
    },
  };

  logs.push(logLine("info", "预执行脚本开始"));

  try {
    const wrapped = `(async () => {\n${code}\n})()`;
    const runner = new Function(
      "vars",
      "env",
      "crypto",
      "console",
      `return ${wrapped}`,
    );
    await runner(api.vars, api.env, api.crypto, api.console);

    const variables = vars.snapshot();
    logs.push(
      logLine(
        "success",
        `预执行脚本完成 (${Math.round(performance.now() - started)}ms) · 变量: ${Object.keys(variables).join(", ") || "无"}`,
      ),
    );

    return {
      variables,
      logs,
      durationMs: Math.round(performance.now() - started),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.push(logLine("error", `脚本错误: ${message}`));
    return {
      variables: vars.snapshot(),
      logs,
      error: message,
      durationMs: Math.round(performance.now() - started),
    };
  }
}

export const DEFAULT_SCRIPT = `const ts = Date.now().toString();
vars.set('timestamp', ts);

const secret = env.get('apiSecret');
const sign = crypto.md5(ts + secret);
vars.set('sign', sign);
vars.set('accessToken', 'demo-token');

console.log('sign generated:', sign);`;
