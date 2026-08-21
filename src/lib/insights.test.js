import { describe, expect, it } from "vitest";

import { buildInsights } from "./insights.js";
import { allTimeFixture, dashboardFixture } from "../test/fixtures.js";

const byId = (data) =>
  Object.fromEntries(buildInsights(data).map((insight) => [insight.id, insight]));

describe("buildInsights", () => {
  it("returns nothing without data", () => {
    expect(buildInsights(null)).toEqual([]);
  });

  it("is deterministic for identical input", () => {
    expect(buildInsights(dashboardFixture)).toEqual(buildInsights(dashboardFixture));
  });

  it("flags the most common order status", () => {
    expect(byId(dashboardFixture)["dominant-status"].title).toBe("Most orders are Open");
  });

  it("identifies the highest-revenue month", () => {
    expect(byId(dashboardFixture)["peak-month"].title).toBe("Jul 1998 was the strongest month");
  });

  it("identifies the highest-spending customer, not merely the first row", () => {
    const unsorted = {
      ...dashboardFixture,
      topCustomers: [...dashboardFixture.topCustomers].reverse(),
    };

    expect(byId(unsorted)["top-customer"].title).toContain("Customer#000116068");
  });

  it("marks a revenue decline as critical", () => {
    const insight = byId(dashboardFixture)["revenue-trend"];

    expect(insight.tone).toBe("critical");
    expect(insight.title).toContain("declined");
  });

  it("marks revenue growth as good", () => {
    const growing = {
      ...dashboardFixture,
      totalRevenue: 10000,
      previousPeriod: { ...dashboardFixture.previousPeriod, totalRevenue: 8000 },
    };

    const insight = byId(growing)["revenue-trend"];

    expect(insight.tone).toBe("good");
    expect(insight.title).toBe("Revenue grew +25.0%");
  });

  it("reads a negligible change as flat rather than as a direction", () => {
    const flat = {
      ...dashboardFixture,
      totalRevenue: 10000,
      previousPeriod: { ...dashboardFixture.previousPeriod, totalRevenue: 10000 },
    };

    expect(byId(flat)["revenue-trend"].tone).toBe("neutral");
    expect(byId(flat)["revenue-trend"].title).toContain("held flat");
  });

  it("omits period comparisons when there is no prior window", () => {
    const ids = buildInsights(allTimeFixture).map((insight) => insight.id);

    expect(ids).not.toContain("revenue-trend");
    expect(ids).not.toContain("order-volume");
    expect(ids).toContain("peak-month");
  });

  it("survives empty collections without throwing", () => {
    const empty = {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      previousPeriod: null,
      ordersByStatus: [],
      monthlyTrend: [],
      topCustomers: [],
    };

    expect(buildInsights(empty)).toEqual([]);
  });
});
