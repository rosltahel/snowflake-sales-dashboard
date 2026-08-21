import {
  formatCurrencyCompact,
  formatMonth,
  formatNumber,
  formatOrderStatus,
  formatPercentChange,
  formatShare,
  percentChange,
} from "./format.js";

/**
 * Deterministic business insights derived entirely from the payload already on
 * screen — no extra request, no model call. Same input always yields the same
 * output, which is what makes this testable.
 *
 * Each insight: { id, tone: "good"|"critical"|"neutral", title, detail }
 */
export function buildInsights(data) {
  if (!data) return [];

  return [
    revenueTrendInsight(data),
    peakMonthInsight(data),
    topCustomerInsight(data),
    dominantStatusInsight(data),
    orderVolumeInsight(data),
  ].filter(Boolean);
}

function revenueTrendInsight({ totalRevenue, previousPeriod }) {
  if (!previousPeriod) return null;

  const change = percentChange(totalRevenue, previousPeriod.totalRevenue);
  if (change === null) return null;

  const flat = Math.abs(change) < 0.05;
  const direction = flat ? "held flat" : change > 0 ? "grew" : "declined";

  return {
    id: "revenue-trend",
    tone: flat ? "neutral" : change > 0 ? "good" : "critical",
    title: `Revenue ${direction} ${formatPercentChange(change)}`,
    detail: `${formatCurrencyCompact(totalRevenue)} this period versus ${formatCurrencyCompact(
      previousPeriod.totalRevenue
    )} in the preceding one.`,
  };
}

function peakMonthInsight({ monthlyTrend }) {
  if (!monthlyTrend?.length) return null;

  const peak = monthlyTrend.reduce((best, row) => (row.revenue > best.revenue ? row : best));
  const average =
    monthlyTrend.reduce((sum, row) => sum + row.revenue, 0) / monthlyTrend.length;
  const aboveAverage = percentChange(peak.revenue, average);

  return {
    id: "peak-month",
    tone: "neutral",
    title: `${formatMonth(peak.month)} was the strongest month`,
    detail:
      `${formatCurrencyCompact(peak.revenue)} in revenue` +
      (aboveAverage !== null && aboveAverage > 0.05
        ? `, ${formatPercentChange(aboveAverage)} above the period average.`
        : "."),
  };
}

function topCustomerInsight({ topCustomers, totalRevenue }) {
  if (!topCustomers?.length) return null;

  const leader = topCustomers.reduce((best, row) => (row.totalSpent > best.totalSpent ? row : best));
  const share = totalRevenue > 0 ? formatShare((leader.totalSpent / totalRevenue) * 100) : null;

  return {
    id: "top-customer",
    tone: "neutral",
    title: `${leader.name} is the highest-spending customer`,
    detail:
      `${formatCurrencyCompact(leader.totalSpent)} across ${formatNumber(leader.orders)} ` +
      `${leader.orders === 1 ? "order" : "orders"}` +
      (share ? `, ${share} of period revenue.` : "."),
  };
}

function dominantStatusInsight({ ordersByStatus, totalOrders }) {
  if (!ordersByStatus?.length) return null;

  const leader = ordersByStatus.reduce((best, row) => (row.total > best.total ? row : best));
  const share = totalOrders > 0 ? formatShare((leader.total / totalOrders) * 100) : null;

  return {
    id: "dominant-status",
    tone: "neutral",
    title: `Most orders are ${formatOrderStatus(leader.status)}`,
    detail: `${formatNumber(leader.total)} orders` + (share ? ` — ${share} of the period.` : "."),
  };
}

function orderVolumeInsight({ totalOrders, previousPeriod }) {
  if (!previousPeriod) return null;

  const change = percentChange(totalOrders, previousPeriod.totalOrders);
  if (change === null) return null;

  const flat = Math.abs(change) < 0.05;

  return {
    id: "order-volume",
    tone: flat ? "neutral" : change > 0 ? "good" : "critical",
    title: `Order volume ${flat ? "held flat" : change > 0 ? "rose" : "fell"} ${formatPercentChange(change)}`,
    detail: `${formatNumber(totalOrders)} orders versus ${formatNumber(
      previousPeriod.totalOrders
    )} in the preceding period.`,
  };
}
