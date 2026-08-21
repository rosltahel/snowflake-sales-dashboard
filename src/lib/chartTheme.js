/**
 * Chart colors, kept in JS because Recharts writes them as SVG presentation
 * attributes (which do not resolve CSS `var()`).
 *
 * Both modes are validated categorical steps: worst adjacent CVD ΔE 24.7 light /
 * 26.8 dark, normal-vision ΔE 33.6 / 31.8, all above 3:1 against their surface.
 *
 * Colors follow the *measure*, not the chart: money is always blue, order
 * counts are always orange, so a reader who learns one panel can read them all.
 */
const LIGHT = {
  revenue: "#2a78d6",
  orders: "#eb6834",
  surface: "#ffffff",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
};

const DARK = {
  revenue: "#3987e5",
  orders: "#d95926",
  surface: "#1c1d24",
  grid: "#2c2c2a",
  axis: "#383835",
  muted: "#898781",
};

export function getChartTheme(isDark) {
  return isDark ? DARK : LIGHT;
}
