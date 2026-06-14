import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const host = process.env.TAURI_DEV_HOST;

/** Tauri production loads via asset:// — paths must be relative, no leading slash. */
function tauriAssetPaths() {
  return {
    name: "tauri-asset-paths",
    transformIndexHtml(html: string) {
      return html
        .replace(/\scrossorigin/g, "")
        .replace(/src="\.\//g, 'src="')
        .replace(/href="\.\//g, 'href="')
        .replace(/src="\/assets\//g, 'src="assets/')
        .replace(/href="\/assets\//g, 'href="assets/');
    },
  };
}

export default defineConfig(async () => ({
  plugins: [react(), tauriAssetPaths()],
  // Empty base → `assets/foo.js` (not `/assets/` which breaks Tauri)
  base: "",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target:
      process.env.TAURI_ENV_PLATFORM === "windows"
        ? "chrome105"
        : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}));
