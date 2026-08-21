import snowflake from "snowflake-sdk";

import {
  boundsQuery,
  kpiQuery,
  monthlyTrendQuery,
  resolveRange,
  statusQuery,
  topCustomersQuery,
} from "./lib/queries.mjs";

/**
 * Warm-instance caches. The dataset bounds never change, and repeated requests
 * for the same range (a user toggling back and forth) are served without
 * touching the warehouse.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map();
let cachedBounds = null;

function connectToSnowflake() {
  return snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USER,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
  });
}

function executeQuery(connection, { sqlText, binds }) {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows ?? []);
      },
    });
  });
}

const num = (value) => Number(value ?? 0);

function mapKpis(rows) {
  const row = rows[0] ?? {};
  return {
    totalOrders: num(row.TOTAL_ORDERS),
    totalRevenue: num(row.TOTAL_REVENUE),
    averageOrderValue: num(row.AVG_ORDER_VALUE),
  };
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export default async (request) => {
  const url = new URL(request.url);
  const requested = {
    range: url.searchParams.get("range") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };

  const cacheKey = `${requested.range ?? ""}|${requested.from ?? ""}|${requested.to ?? ""}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return jsonResponse(cached.body, 200, { "X-Cache": "HIT" });
  }

  const connection = connectToSnowflake();

  try {
    await new Promise((resolve, reject) => {
      connection.connect((err) => (err ? reject(err) : resolve()));
    });

    // Bounds first — relative presets are anchored to the newest order date.
    if (!cachedBounds) {
      const boundsRows = await executeQuery(connection, boundsQuery());
      cachedBounds = {
        minDate: boundsRows[0].MIN_DATE,
        maxDate: boundsRows[0].MAX_DATE,
      };
    }

    const range = resolveRange({ ...requested, ...cachedBounds });

    // Independent queries run concurrently on the one open connection.
    const [kpiRows, previousRows, statusRows, monthlyRows, customerRows] =
      await Promise.all([
        executeQuery(connection, kpiQuery(range.from, range.to)),
        range.previous
          ? executeQuery(connection, kpiQuery(range.previous.from, range.previous.to))
          : Promise.resolve(null),
        executeQuery(connection, statusQuery(range.from, range.to)),
        executeQuery(connection, monthlyTrendQuery(range.from, range.to)),
        executeQuery(connection, topCustomersQuery(range.from, range.to)),
      ]);

    const body = {
      range: { key: range.key, label: range.label, from: range.from, to: range.to },
      dataBounds: { min: cachedBounds.minDate, max: cachedBounds.maxDate },

      ...mapKpis(kpiRows),

      previousPeriod: previousRows
        ? { from: range.previous.from, to: range.previous.to, ...mapKpis(previousRows) }
        : null,

      ordersByStatus: statusRows.map((row) => ({
        status: row.STATUS,
        total: num(row.TOTAL),
      })),

      monthlyTrend: monthlyRows.map((row) => ({
        month: row.MONTH,
        orders: num(row.TOTAL_ORDERS),
        revenue: num(row.TOTAL_REVENUE),
      })),

      topCustomers: customerRows.map((row) => ({
        name: row.CUSTOMER_NAME,
        orders: num(row.TOTAL_ORDERS),
        totalSpent: num(row.TOTAL_SPENT),
        averageOrderValue: num(row.AVG_ORDER_VALUE),
      })),
    };

    responseCache.set(cacheKey, { at: Date.now(), body });

    return jsonResponse(body, 200, {
      "X-Cache": "MISS",
      "Cache-Control": "public, max-age=0, s-maxage=300",
    });
  } catch (error) {
    console.error("Snowflake error:", error);

    return jsonResponse({ error: "Failed to load Snowflake data" }, 500);
  } finally {
    connection.destroy(() => {});
  }
};
