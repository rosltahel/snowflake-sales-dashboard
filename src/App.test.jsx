import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App.jsx";
import { allTimeFixture, dashboardFixture } from "./test/fixtures.js";

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: "Failed to load Snowflake data" }),
});

/** A response whose resolution the test controls, for asserting the loading state. */
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/**
 * Read a KPI value by its card label. Figures like "56,018" legitimately appear
 * in several panels at once, so metric assertions must be scoped to the card.
 */
function metricValue(label) {
  const card = screen.getByText(label).closest(".metric-card");
  return card.querySelector(".metric-card__value").textContent;
}

const findMetricValue = (label, expected) =>
  waitFor(() => expect(metricValue(label)).toBe(expected));

describe("App", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  describe("loading state", () => {
    it("shows skeletons — not a bare Loading string — on first paint", async () => {
      const pending = deferred();
      fetch.mockReturnValue(pending.promise);

      const { container } = render(<App />);

      expect(screen.getByLabelText("Loading dashboard data")).toBeInTheDocument();
      expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
      expect(screen.queryByText(/^Loading/)).not.toBeInTheDocument();

      pending.resolve(ok(allTimeFixture));
      await waitFor(() =>
        expect(screen.queryByLabelText("Loading dashboard data")).not.toBeInTheDocument()
      );
    });

    it("renders the header before data arrives so the page never looks blank", () => {
      fetch.mockReturnValue(deferred().promise);

      render(<App />);

      expect(screen.getByRole("heading", { name: "Sales Analytics" })).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    beforeEach(() => {
      fetch.mockResolvedValue(ok(allTimeFixture));
    });

    it("requests All Time on mount", async () => {
      render(<App />);

      await screen.findByText("Total orders");
      expect(fetch).toHaveBeenCalledWith(
        "/.netlify/functions/dashboard?range=all",
        expect.anything()
      );
    });

    it("renders the three existing KPIs", async () => {
      render(<App />);

      await screen.findByText("Total orders");

      expect(metricValue("Total orders")).toBe("56,018");
      expect(metricValue("Total revenue")).toBe("$8.5B");
      expect(metricValue("Average order value")).toBe("$151,302.72");
    });

    it("renders every panel", async () => {
      render(<App />);

      await screen.findByText("Total orders");

      for (const title of [
        "Insights",
        "Revenue over time",
        "Order volume over time",
        "Orders by status",
        "Top customers",
      ]) {
        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      }
    });

    it("shows the data coverage window in the header", async () => {
      render(<App />);

      const header = await screen.findByRole("banner");

      expect(
        within(header).getByText("Jan 1, 1992 – Aug 2, 1998")
      ).toBeInTheDocument();
    });
  });

  describe("date filtering", () => {
    it("refetches with the chosen preset and updates the metrics", async () => {
      fetch.mockResolvedValueOnce(ok(allTimeFixture)).mockResolvedValueOnce(
        ok({ ...dashboardFixture, totalOrders: 4242 })
      );

      render(<App />);
      await findMetricValue("Total orders", "56,018");

      await userEvent.click(screen.getByRole("button", { name: "Last 90 Days" }));

      await waitFor(() =>
        expect(fetch).toHaveBeenLastCalledWith(
          "/.netlify/functions/dashboard?range=90d",
          expect.anything()
        )
      );
      await findMetricValue("Total orders", "4,242");
    });

    it("holds the previous render instead of flashing skeletons while refetching", async () => {
      const pending = deferred();
      fetch.mockResolvedValueOnce(ok(allTimeFixture)).mockReturnValueOnce(pending.promise);

      const { container } = render(<App />);
      await findMetricValue("Total orders", "56,018");

      await userEvent.click(screen.getByRole("button", { name: "Last Year" }));

      // Old numbers stay on screen, dimmed — no skeleton, no layout jump.
      expect(metricValue("Total orders")).toBe("56,018");
      expect(container.querySelector(".dashboard__body--refetching")).not.toBeNull();
      expect(screen.queryByLabelText("Loading dashboard data")).not.toBeInTheDocument();

      pending.resolve(ok(dashboardFixture));
      await waitFor(() =>
        expect(container.querySelector(".dashboard__body--refetching")).toBeNull()
      );
    });

    it("shows period-over-period deltas only when a prior window exists", async () => {
      fetch
        .mockResolvedValueOnce(ok(allTimeFixture))
        .mockResolvedValueOnce(ok(dashboardFixture));

      render(<App />);
      await findMetricValue("Total orders", "56,018");
      expect(screen.getAllByText("No prior period to compare")).toHaveLength(3);

      await userEvent.click(screen.getByRole("button", { name: "Last 90 Days" }));

      expect(await screen.findAllByText("vs. previous period")).toHaveLength(3);
      expect(screen.getByText("−0.6%")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows a friendly message with a retry button when Snowflake fails", async () => {
      fetch.mockResolvedValue(fail(500));

      render(<App />);

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /couldn’t load your data/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/warehouse may be paused/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    });

    it("recovers when retry succeeds", async () => {
      fetch.mockResolvedValueOnce(fail(500)).mockResolvedValueOnce(ok(allTimeFixture));

      render(<App />);
      await screen.findByRole("alert");

      await userEvent.click(screen.getByRole("button", { name: "Try again" }));

      await findMetricValue("Total orders", "56,018");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("reports an unreachable network separately from a warehouse failure", async () => {
      fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      render(<App />);

      expect(await screen.findByText(/Could not reach the dashboard service/)).toBeInTheDocument();
    });

    it("keeps the date filter usable so the reader is not stuck", async () => {
      fetch.mockResolvedValue(fail(500));

      render(<App />);
      await screen.findByRole("alert");

      expect(screen.getByRole("button", { name: "All Time" })).toBeEnabled();
    });
  });

  describe("chart accessibility", () => {
    it("offers a table view twin for each chart", async () => {
      fetch.mockResolvedValue(ok(allTimeFixture));

      render(<App />);
      await screen.findByText("Total orders");

      const revenueCard = screen
        .getByRole("heading", { name: "Revenue over time" })
        .closest("section");

      const toggle = within(revenueCard).getByRole("button", { name: "View as table" });
      await userEvent.click(toggle);

      expect(within(revenueCard).getByRole("table")).toBeInTheDocument();
      expect(within(revenueCard).getByText("$2,935,593,508.98")).toBeInTheDocument();
    });
  });
});
