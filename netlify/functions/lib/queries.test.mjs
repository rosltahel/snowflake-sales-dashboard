import { describe, expect, it } from "vitest";

import {
  RANGE_PRESETS,
  boundsQuery,
  kpiQuery,
  monthlyTrendQuery,
  parseDayString,
  resolveRange,
  statusQuery,
  topCustomersQuery,
} from "./queries.mjs";

const BOUNDS = { minDate: "1992-01-01", maxDate: "1998-08-02" };

describe("resolveRange", () => {
  it("returns the full dataset with no comparison window for All Time", () => {
    const range = resolveRange({ range: "all", ...BOUNDS });

    expect(range).toMatchObject({ key: "all", from: "1992-01-01", to: "1998-08-02" });
    expect(range.previous).toBeNull();
  });

  it("anchors relative presets to the newest order date, not to today", () => {
    const range = resolveRange({ range: "30d", ...BOUNDS });

    // 30 days inclusive, ending on the dataset's max date.
    expect(range).toMatchObject({ from: "1998-07-04", to: "1998-08-02" });
  });

  it.each([
    ["30d", "1998-07-04"],
    ["90d", "1998-05-05"],
    ["1y", "1997-08-03"],
  ])("resolves %s to start on %s", (key, expectedFrom) => {
    expect(resolveRange({ range: key, ...BOUNDS }).from).toBe(expectedFrom);
  });

  it("builds an equal-length preceding window for comparison", () => {
    const { from, to, previous } = resolveRange({ range: "90d", ...BOUNDS });

    const length = (a, b) =>
      (parseDayString(b) - parseDayString(a)) / 86400000 + 1;

    expect(length(previous.from, previous.to)).toBe(length(from, to));
    expect(previous.to).toBe("1998-05-04"); // the day before the window opens
  });

  it("falls back to All Time for an unknown preset", () => {
    expect(resolveRange({ range: "not-a-range", ...BOUNDS }).key).toBe("all");
    expect(resolveRange({ ...BOUNDS }).key).toBe("all");
  });

  it("clamps a custom range to the dataset and orders reversed inputs", () => {
    const range = resolveRange({
      from: "1998-06-01",
      to: "1997-01-01",
      ...BOUNDS,
    });

    expect(range).toMatchObject({ key: "custom", from: "1997-01-01", to: "1998-06-01" });
  });

  it("ignores malformed dates rather than passing them to Snowflake", () => {
    const range = resolveRange({ from: "not-a-date", to: "1998-06-01", ...BOUNDS });

    expect(range.from).toBe("1992-01-01");
    expect(range.to).toBe("1998-06-01");
  });

  it("omits the comparison window when the data does not reach back far enough", () => {
    const range = resolveRange({ range: "1y", minDate: "1998-01-01", maxDate: "1998-08-02" });

    expect(range.from).toBe("1998-01-01");
    expect(range.previous).toBeNull();
  });

  it("exposes a label for every preset", () => {
    for (const preset of RANGE_PRESETS) {
      expect(resolveRange({ range: preset.key, ...BOUNDS }).label).toBe(preset.label);
    }
  });
});

describe("query builders", () => {
  it("passes dates as binds, never interpolated into SQL", () => {
    for (const build of [kpiQuery, statusQuery, monthlyTrendQuery]) {
      const { sqlText, binds } = build("1998-05-05", "1998-08-02");

      expect(binds).toEqual(["1998-05-05", "1998-08-02"]);
      expect(sqlText).not.toContain("1998-05-05");
      expect(sqlText).toContain(":1");
    }
  });

  it("filters every query on O_ORDERDATE", () => {
    for (const build of [kpiQuery, statusQuery, monthlyTrendQuery, topCustomersQuery]) {
      expect(build("1998-05-05", "1998-08-02").sqlText).toMatch(/O_ORDERDATE BETWEEN :1 AND :2/);
    }
  });

  it("ranks top customers by revenue AND order count in one pass", () => {
    const { sqlText, binds } = topCustomersQuery("1998-05-05", "1998-08-02", 10);

    expect(binds).toEqual(["1998-05-05", "1998-08-02", 10]);
    expect(sqlText).toContain("ROW_NUMBER() OVER (ORDER BY TOTAL_SPENT DESC) <= :3");
    expect(sqlText).toContain("ROW_NUMBER() OVER (ORDER BY TOTAL_ORDERS DESC) <= :3");
  });

  it("reads bounds from the orders table without binds", () => {
    const { sqlText, binds } = boundsQuery();

    expect(binds).toEqual([]);
    expect(sqlText).toContain("MIN(O_ORDERDATE)");
    expect(sqlText).toContain("MAX(O_ORDERDATE)");
  });
});
