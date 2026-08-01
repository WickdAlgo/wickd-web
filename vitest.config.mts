import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vitest does not read tsconfig `paths`. Declaring the alias here avoids a
    // vite-tsconfig-paths dependency for the one mapping this repo has.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Scoped to src/ deliberately. `.claude/worktrees/` holds full checkouts of
    // this project, and the default `**/*.test.*` glob collects a second copy of
    // the entire suite from them. `eslint.config.mjs` carries the same guard.
    include: ["src/**/*.test.{ts,tsx}"],
    // Explicit imports rather than injected globals, so ESLint and the type
    // checker see the same thing the runtime does.
    globals: false,
  },
});
