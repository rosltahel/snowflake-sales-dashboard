import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Recharts' ResponsiveContainer measures its parent; jsdom reports 0x0, so the
// charts would never render. Give every container a deterministic box.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

Object.defineProperties(globalThis.HTMLElement.prototype, {
  offsetWidth: { get: () => 800, configurable: true },
  offsetHeight: { get: () => 400, configurable: true },
});

// useIsDarkMode reads matchMedia on mount.
globalThis.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
