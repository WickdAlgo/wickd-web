import { spawnSync } from "node:child_process";
import type { NextConfig } from "next";
import { version } from "./package.json";

/** What the nav shows for Core when neither the env var nor the CLI answers. */
const CORE_FALLBACK = "0.1.0";

/**
 * Wickd.CLI wraps Wickd.Core, so `wickd --version` is the closest thing this repo
 * has to a source of truth for Core's number.
 *
 * It only resolves where the CLI is installed — a local build, or a CI runner that
 * installs it first. Cloudflare's Workers Builds container does not have it, and the
 * Workers runtime has no shell at all, so this can never be anything but build time.
 * Every failure path is non-fatal: a missing CLI falls through to the constant rather
 * than breaking the build.
 */
function coreVersionFromCli(): string | undefined {
  const res = spawnSync("wickd", ["--version"], {
    encoding: "utf8",
    timeout: 5_000,
  });
  if (res.error) return undefined;
  // Some CLIs print the banner to stderr; a semver match is the real validation.
  const out = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  const semver = /\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.]+)*/;
  // Prefer a Core-labelled number. A wrapper that reports both — "Wickd.CLI 1.2.3
  // (Wickd.Core 0.7.1)" — leads with its own version, which is not what we want.
  const labelled = out.match(new RegExp(`core[^0-9]*(${semver.source})`, "i"));
  return labelled?.[1] ?? out.match(semver)?.[0];
}

/* Explicit env var wins, so a build host without the CLI can still pin the number. */
const coreVersion =
  process.env.NEXT_PUBLIC_WICKD_CORE_VERSION ??
  coreVersionFromCli() ??
  CORE_FALLBACK;

const nextConfig: NextConfig = {
  env: {
    /* Read here rather than in the component: importing package.json from client
     * code ships the whole manifest — scripts, dependencies and their exact
     * versions — to every visitor. This inlines just the string. */
    NEXT_PUBLIC_WEB_VERSION: version,
    NEXT_PUBLIC_WICKD_CORE_VERSION: coreVersion,
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
