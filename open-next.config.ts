import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = {
  ...defineCloudflareConfig(),
  // `opennextjs-cloudflare build` shells out to the package manager's `build`
  // script to build the Next app, and `build` is itself the OpenNext build (so
  // that Workers Builds' default `pnpm run build` produces a deployable Worker).
  // Point it at the plain Next build to break that recursion.
  buildCommand: "pnpm build:next",
};

export default config;
