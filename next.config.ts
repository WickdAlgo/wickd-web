import type { NextConfig } from "next";
import { version } from "./package.json";
import { version as coreVersion } from "./core-version.json";

const nextConfig: NextConfig = {
  env: {
    /* Both read here rather than in a component: importing a manifest from client
     * code ships the whole file — for package.json that means every script,
     * dependency and exact version — to every visitor. This inlines just the
     * two strings.
     *
     * Core ships from wickd-dotnet, so core-version.json is this repo's record of
     * it, kept current by .github/workflows/core-version.yml. Deliberately not
     * probed from `wickd --version` at build time: Wickd.CLI and Wickd.Core share
     * one number under unified versioning, so the CLI adds nothing the committed
     * file doesn't already say — and any machine with a different CLI installed
     * would quietly build a different number than production. */
    NEXT_PUBLIC_WEB_VERSION: version,
    NEXT_PUBLIC_WICKD_CORE_VERSION:
      process.env.NEXT_PUBLIC_WICKD_CORE_VERSION ?? coreVersion,
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
