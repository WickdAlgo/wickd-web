import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".open-next/**",
    ".wrangler/**",
    "cloudflare-env.d.ts",

    // Local-only build and tooling artifacts. None of these exist in a fresh
    // clone, so CI never saw them — but locally they are full checkouts with
    // their own node_modules, and ESLint walks straight into them: linting the
    // repo reported thousands of problems from code that isn't ours.
    ".claude/worktrees/**",
    ".vercel/**",
  ]),
]);

export default eslintConfig;
