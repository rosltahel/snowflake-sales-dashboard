import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardApiError, fetchDashboard } from "./api.js";
import { dashboardFixture } from "../test/fixtures.js";

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe("fetchDashboard", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("requests the Netlify function with the range preset", async () => {
    fetch.mockResolvedValue(jsonResponse(dashboardFixture));

    const result = await fetchDashboard({ range: "90d" });

    expect(fetch).toHaveBeenCalledWith(
      "/.netlify/functions/dashboard?range=90d",
      expect.objectContaining({ signal: undefined })
    );
    expect(result).toEqual(dashboardFixture);
  });

  it("omits the query string when no range is given", async () => {
    fetch.mockResolvedValue(jsonResponse(dashboardFixture));

    await fetchDashboard();

    expect(fetch).toHaveBeenCalledWith("/.netlify/functions/dashboard", expect.anything());
  });

  it("throws a DashboardApiError carrying the status on a failed response", async () => {
    fetch.mockResolvedValue(jsonResponse({ error: "Failed to load Snowflake data" }, 500));

    await expect(fetchDashboard({ range: "all" })).rejects.toMatchObject({
      name: "DashboardApiError",
      status: 500,
    });
  });

  it("reports a network failure in plain language", async () => {
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchDashboard()).rejects.toThrow(/Could not reach the dashboard service/);
  });

  it("re-throws an abort so cancelled requests are not shown as errors", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    fetch.mockRejectedValue(abort);

    await expect(fetchDashboard()).rejects.toMatchObject({ name: "AbortError" });
  });

  it("surfaces an unreadable body as an API error", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });

    await expect(fetchDashboard()).rejects.toBeInstanceOf(DashboardApiError);
  });
});
