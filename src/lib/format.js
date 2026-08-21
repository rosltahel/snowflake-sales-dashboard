/** Presentation-only number/date formatting. No data fetching lives here. */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const plainNumber = new Intl.NumberFormat("en-US");

const isFinite_ = (value) => typeof value === "number" && Number.isFinite(value);

/** `$226.8B` — for headline figures and axis ticks where space is tight. */
export function formatCurrencyCompact(value) {
  return isFinite_(value) ? compactCurrency.format(value) : "—";
}

/** `$226,829,306,447.46` — for tables and tooltips, where precision is expected. */
export function formatCurrency(value) {
  return isFinite_(value) ? fullCurrency.format(value) : "—";
}

/** `1.5M` */
export function formatNumberCompact(value) {
  return isFinite_(value) ? compactNumber.format(value) : "—";
}

/** `1,500,000` */
export function formatNumber(value) {
  return isFinite_(value) ? plainNumber.format(value) : "—";
}

/** `1998-05` → `May 1998`; pass `short` for `May '98` (axis ticks). */
export function formatMonth(month, { short = false } = {}) {
  if (typeof month !== "string") return "—";
  const [year, monthIndex] = month.split("-");
  const name = MONTH_NAMES[Number(monthIndex) - 1];
  if (!name || !year) return month;
  return short ? `${name} '${year.slice(2)}` : `${name} ${year}`;
}

/** `1998-08-02` → `Aug 2, 1998` */
export function formatDay(day) {
  if (typeof day !== "string") return "—";
  const [year, month, date] = day.split("-");
  const name = MONTH_NAMES[Number(month) - 1];
  if (!name || !year || !date) return day;
  return `${name} ${Number(date)}, ${year}`;
}

/**
 * Percentage change from `previous` to `current`.
 * Returns null when there is no meaningful baseline to compare against.
 */
export function percentChange(current, previous) {
  if (!isFinite_(current) || !isFinite_(previous) || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** `+4.2%` / `-1.6%` / `—` */
export function formatPercentChange(value) {
  if (!isFinite_(value)) return "—";
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded).toFixed(1)}%`;
}

/**
 * True when `month` (`YYYY-MM`) is cut short by `rangeTo` (`YYYY-MM-DD`).
 *
 * The final bucket of a range is usually a few days long, which plots as a
 * near-vertical drop. Flagging it keeps the chart honest without discarding
 * real data.
 */
export function isPartialMonth(month, rangeTo) {
  if (typeof month !== "string" || typeof rangeTo !== "string") return false;
  if (!rangeTo.startsWith(`${month}-`)) return false;

  const [year, monthIndex] = month.split("-").map(Number);
  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  return Number(rangeTo.slice(8, 10)) < lastDayOfMonth;
}

/**
 * Trailing subtitle clause flagging a truncated final bucket, or `""` when the
 * last month is complete.
 */
export function partialMonthNote(rows, rangeTo) {
  const last = rows?.[rows.length - 1]?.month;
  return isPartialMonth(last, rangeTo) ? ` · ${formatMonth(last)} is a partial month` : "";
}

/**
 * A share of the whole, e.g. `4.82%`. Values that would round to `0.00%` are
 * reported as `<0.01%` instead — a literal zero misstates a real contribution.
 */
export function formatShare(percent) {
  if (!Number.isFinite(percent)) return null;
  if (percent > 0 && percent < 0.01) return "<0.01%";
  return `${percent.toFixed(2)}%`;
}

/** The full order-status names TPCH abbreviates to single letters. */
export const ORDER_STATUS_LABELS = {
  O: "Open",
  F: "Fulfilled",
  P: "Pending",
};

export function formatOrderStatus(code) {
  return ORDER_STATUS_LABELS[code] ?? code ?? "—";
}
