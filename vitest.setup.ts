import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

/**
 * jsdom implements neither of these, and both are called unconditionally by
 * hooks this codebase mounts everywhere — `use-reduced-motion.ts` and
 * `use-theme-epoch.ts` subscribe to `matchMedia`, and the chart observes its
 * container. Without them, rendering almost any component throws.
 *
 * `matches: false` is the honest default: tests run as if the reader has no
 * reduced-motion or dark-mode preference. A test that cares overrides it.
 */
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
