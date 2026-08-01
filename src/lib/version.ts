/**
 * Build markers. Rendered in the marketing footer (both, via VersionList) and
 * the platform sidebar (WEB_VERSION only) — not in the nav bar or drawer.
 *
 * Both strings are resolved and inlined by next.config.ts, which is the only place
 * that can read the manifests — see the notes there. This module is just the typed
 * accessor; the fallbacks below never fire in a real build and exist only because
 * process.env is typed as possibly undefined.
 */

/** From package.json — bump it there and every surface follows. */
export const WEB_VERSION = `v${process.env.NEXT_PUBLIC_WEB_VERSION ?? "0.0.0"}`;

/** From core-version.json, synced from wickd-dotnet releases. */
export const CORE_VERSION = `v${
  process.env.NEXT_PUBLIC_WICKD_CORE_VERSION ?? "0.0.0"
}`;
