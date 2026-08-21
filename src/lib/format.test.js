import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatCurrencyCompact,
  formatDay,
  formatMonth,
  formatNumber,
  formatNumberCompact,
  formatOrderStatus,
  formatPercentChange,
  formatShare,
  isPartialMonth,
  partialMonthNote,
  percentChange,
} from "./format.js";

describe("currency formatting", () => {
  it("compacts large figures so headline numbers stay readable", () => {
    expect(formatCurrencyCompact(226829306447.46)).toBe("$226.8B");
    expect(formatCurrencyCompact(8475675778.23)).toBe("$8.5B");
    expect(formatCurrencyCompact(1500)).toBe("$1.5K");
  });

  it("keeps full precision where the reader expects exact numbers", () => {
    expect(formatCurrency(151219.54)).toBe("$151,219.54");
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("renders an em dash rather than NaN for missing values", () => {
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrencyCompact(null)).toBe("—");
    expect(formatNumber(Number.NaN)).toBe("—");
  });
});

describe("number formatting", () => {
  it("groups thousands", () => {
    expect(formatNumber(1500000)).toBe("1,500,000");
  });

  it("compacts for axis ticks", () => {
    expect(formatNumberCompact(19380)).toBe("19.4K");
  });
});

describe("date formatting", () => {
  it("renders month keys", () => {
    expect(formatMonth("1998-05")).toBe("May 1998");
    expect(formatMonth("1998-05", { short: true })).toBe("May '98");
  });

  it("renders day keys", () => {
    expect(formatDay("1998-08-02")).toBe("Aug 2, 1998");
  });

  it("passes through unparseable input instead of throwing", () => {
    expect(formatMonth("garbage")).toBe("garbage");
    expect(formatDay(undefined)).toBe("—");
  });
});

describe("percentChange", () => {
  it("computes signed change", () => {
    expect(percentChange(110, 100)).toBeCloseTo(10);
    expect(percentChange(90, 100)).toBeCloseTo(-10);
  });

  it("returns null when there is no usable baseline", () => {
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(100, undefined)).toBeNull();
  });

  it("formats with an explicit sign", () => {
    expect(formatPercentChange(4.23)).toBe("+4.2%");
    expect(formatPercentChange(-1.55)).toBe("−1.6%");
    expect(formatPercentChange(0)).toBe("0.0%");
    expect(formatPercentChange(null)).toBe("—");
  });
});

describe("partial month detection", () => {
  it("flags a final month the range cuts short", () => {
    // TPCH stops on Aug 2, so August 1998 holds two days of orders.
    expect(isPartialMonth("1998-08", "1998-08-02")).toBe(true);
  });

  it("does not flag a month that runs to its last day", () => {
    expect(isPartialMonth("1998-07", "1998-07-31")).toBe(false);
    expect(isPartialMonth("1996-02", "1996-02-29")).toBe(false); // leap year
  });

  it("does not flag a month the range end does not belong to", () => {
    expect(isPartialMonth("1998-06", "1998-08-02")).toBe(false);
  });

  it("builds a subtitle clause only when the last bucket is truncated", () => {
    const rows = [{ month: "1998-07" }, { month: "1998-08" }];

    expect(partialMonthNote(rows, "1998-08-02")).toBe(" · Aug 1998 is a partial month");
    expect(partialMonthNote(rows, "1998-08-31")).toBe("");
    expect(partialMonthNote([], "1998-08-02")).toBe("");
  });
});

describe("formatShare", () => {
  it("renders an ordinary share to two decimals", () => {
    expect(formatShare(48.79)).toBe("48.79%");
    expect(formatShare(0.0)).toBe("0.00%");
  });

  it("never reports a real contribution as a flat zero", () => {
    // One customer against 1.5M orders is a genuine, tiny share.
    expect(formatShare(0.0031)).toBe("<0.01%");
  });

  it("returns null for unusable input so callers can drop the clause", () => {
    expect(formatShare(Number.NaN)).toBeNull();
    expect(formatShare(undefined)).toBeNull();
  });
});

describe("order status labels", () => {
  it("expands the TPCH single-letter codes", () => {
    expect(formatOrderStatus("O")).toBe("Open");
    expect(formatOrderStatus("F")).toBe("Fulfilled");
    expect(formatOrderStatus("P")).toBe("Pending");
  });

  it("falls back to the raw code for anything unknown", () => {
    expect(formatOrderStatus("X")).toBe("X");
  });
});
