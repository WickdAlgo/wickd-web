/**
 * Build markers shown in the site chrome (nav bar, mobile drawer, platform sidebar).
 *
 * Both strings are resolved and inlined by next.config.ts, which is the only place
 * that can read package.json or shell out to the Wickd.CLI — see the notes there.
 * This module is just the typed accessor; the fallbacks below never fire in a real
 * build and exist only because process.env is typed as possibly undefined.
 */

/** From package.json — bump it there and every surface follows. */
export const WEB_VERSION = `v${process.env.NEXT_PUBLIC_WEB_VERSION ?? "0.0.0"}`;

/** From NEXT_PUBLIC_WICKD_CORE_VERSION, else `wickd --version`, else a constant. */
export const CORE_VERSION = `v${
  process.env.NEXT_PUBLIC_WICKD_CORE_VERSION ?? "0.0.0"
}`;
