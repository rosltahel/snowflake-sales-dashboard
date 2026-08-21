/**
 * Pure query-building + date-range logic for the dashboard function.
 *
 * Kept free of any Snowflake I/O so it can be unit tested without credentials.
 *
 * NOTE ON DATE ANCHORING: the TPCH_SF1 sample dataset ends on 1998-08-02, so
 * relative presets ("last 30 days") are anchored to the newest O_ORDERDATE in
 * the table rather than to today. Anchoring to CURRENT_DATE would make every
 * preset except "All Time" return zero rows.
 */

const ORDERS = "SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS";
const CUSTOMER = "SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER";

/** Number of customers returned per ranking (revenue and order count). */
export const TOP_CUSTOMER_LIMIT = 10;

export const RANGE_PRESETS = [
  { key: "all", label: "All Time", days: null },
  { key: "30d", label: "Last 30 Days", days: 30 },
  { key: "90d", label: "Last 90 Days", days: 90 },
  { key: "1y", label: "Last Year", days: 365 },
];

export const DEFAULT_RANGE = "all";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86400000;

/** Format a Date (or date-like value) as an ISO `YYYY-MM-DD` day string. */
export function toDayString(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

/** Parse `YYYY-MM-DD` into a UTC Date. Returns null for anything malformed. */
export function parseDayString(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shiftDays(dayString, delta) {
  const date = parseDayString(dayString);
  return toDayString(new Date(date.getTime() + delta * MS_PER_DAY));
}

function clampDay(dayString, minDay, maxDay) {
  if (dayString < minDay) return minDay;
  if (dayString > maxDay) return maxDay;
  return dayString;
}

/**
 * Resolve a requested range against the dataset bounds.
 *
 * Explicit `from`/`to` win over `range`; both are clamped to the dataset so a
 * caller can never ask for a window the warehouse has no rows for.
 *
 * @returns {{key, label, from, to, previous: {from, to} | null}}
 */
export function resolveRange({ range, from, to, minDate, maxDate }) {
  const customFrom = parseDayString(from) ? clampDay(from, minDate, maxDate) : null;
  const customTo = parseDayString(to) ? clampDay(to, minDate, maxDate) : null;

  if (customFrom || customTo) {
    const start = customFrom ?? minDate;
    const end = customTo ?? maxDate;
    const ordered = start <= end ? [start, end] : [end, start];
    return {
      key: "custom",
      label: "Custom Range",
      from: ordered[0],
      to: ordered[1],
      previous: previousWindow(ordered[0], ordered[1], minDate),
    };
  }

  const preset =
    RANGE_PRESETS.find((entry) => entry.key === range) ??
    RANGE_PRESETS.find((entry) => entry.key === DEFAULT_RANGE);

  if (preset.days === null) {
    // All Time has no comparable prior window.
    return { key: preset.key, label: preset.label, from: minDate, to: maxDate, previous: null };
  }

  const start = clampDay(shiftDays(maxDate, -(preset.days - 1)), minDate, maxDate);
  return {
    key: preset.key,
    label: preset.label,
    from: start,
    to: maxDate,
    previous: previousWindow(start, maxDate, minDate),
  };
}

/** The equal-length window immediately preceding [from, to], or null if the data doesn't reach. */
function previousWindow(from, to, minDate) {
  const lengthDays = Math.round(
    (parseDayString(to).getTime() - parseDayString(from).getTime()) / MS_PER_DAY
  ) + 1;
  const previousTo = shiftDays(from, -1);
  if (previousTo < minDate) return null;
  return { from: clampDay(shiftDays(previousTo, -(lengthDays - 1)), minDate, previousTo), to: previousTo };
}

/* ------------------------------------------------------------------ *
 * SQL builders. Every date is passed as a bind, never interpolated.
 * ------------------------------------------------------------------ */

export const boundsQuery = () => ({
  sqlText: `
    SELECT
      TO_CHAR(MIN(O_ORDERDATE), 'YYYY-MM-DD') AS MIN_DATE,
      TO_CHAR(MAX(O_ORDERDATE), 'YYYY-MM-DD') AS MAX_DATE
    FROM ${ORDERS}
  `,
  binds: [],
});

export const kpiQuery = (from, to) => ({
  sqlText: `
    SELECT
      COUNT(*) AS TOTAL_ORDERS,
      ROUND(COALESCE(SUM(O_TOTALPRICE), 0), 2) AS TOTAL_REVENUE,
      ROUND(COALESCE(AVG(O_TOTALPRICE), 0), 2) AS AVG_ORDER_VALUE
    FROM ${ORDERS}
    WHERE O_ORDERDATE BETWEEN :1 AND :2
  `,
  binds: [from, to],
});

export const statusQuery = (from, to) => ({
  sqlText: `
    SELECT
      O_ORDERSTATUS AS STATUS,
      COUNT(*) AS TOTAL
    FROM ${ORDERS}
    WHERE O_ORDERDATE BETWEEN :1 AND :2
    GROUP BY O_ORDERSTATUS
    ORDER BY TOTAL DESC
  `,
  binds: [from, to],
});

export const monthlyTrendQuery = (from, to) => ({
  sqlText: `
    SELECT
      TO_CHAR(DATE_TRUNC('MONTH', O_ORDERDATE), 'YYYY-MM') AS MONTH,
      COUNT(*) AS TOTAL_ORDERS,
      ROUND(SUM(O_TOTALPRICE), 2) AS TOTAL_REVENUE
    FROM ${ORDERS}
    WHERE O_ORDERDATE BETWEEN :1 AND :2
    GROUP BY 1
    ORDER BY 1
  `,
  binds: [from, to],
});

/**
 * Top customers by BOTH revenue and order count in a single pass.
 *
 * The dual QUALIFY means the client can re-sort between the two rankings
 * without a refetch, and without the bias of sorting a revenue-only top-N by
 * order count.
 */
export const topCustomersQuery = (from, to, limit = TOP_CUSTOMER_LIMIT) => ({
  sqlText: `
    SELECT
      C.C_NAME AS CUSTOMER_NAME,
      COUNT(*) AS TOTAL_ORDERS,
      ROUND(SUM(O.O_TOTALPRICE), 2) AS TOTAL_SPENT,
      ROUND(AVG(O.O_TOTALPRICE), 2) AS AVG_ORDER_VALUE
    FROM ${ORDERS} O
    JOIN ${CUSTOMER} C ON O.O_CUSTKEY = C.C_CUSTKEY
    WHERE O.O_ORDERDATE BETWEEN :1 AND :2
    GROUP BY C.C_NAME
    QUALIFY ROW_NUMBER() OVER (ORDER BY TOTAL_SPENT DESC) <= :3
         OR ROW_NUMBER() OVER (ORDER BY TOTAL_ORDERS DESC) <= :3
    ORDER BY TOTAL_SPENT DESC
  `,
  binds: [from, to, limit],
});
