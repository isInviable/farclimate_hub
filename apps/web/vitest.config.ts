import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

/** Directory containing this config (apps/web) — stable when pnpm runs from repo root. */
const webRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Vitest does not reliably load `.env` into `process.env` for Node tests; mirror Vite’s rules.
  const loaded = loadEnv(mode, webRoot, "")
  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return {
    test: {
      include: ["tests/**/*.{test,spec}.ts"],
      environment: "node",
      env: loaded,
    },
  }
})
