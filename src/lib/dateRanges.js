/**
 * Range presets shown in the UI. The `key` values are the contract with the
 * Netlify function (see netlify/functions/lib/queries.mjs).
 */
export const RANGE_PRESETS = [
  { key: "all", label: "All Time" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "1y", label: "Last Year" },
];

export const DEFAULT_RANGE = "all";

export function isValidRange(key) {
  return RANGE_PRESETS.some((preset) => preset.key === key);
}
