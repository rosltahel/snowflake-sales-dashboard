import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InsightsPanel } from "./InsightsPanel.jsx";
import { allTimeFixture, dashboardFixture } from "../test/fixtures.js";

describe("InsightsPanel", () => {
  it("renders one item per generated insight", () => {
    render(<InsightsPanel data={dashboardFixture} />);

    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("surfaces the headline observations", () => {
    render(<InsightsPanel data={dashboardFixture} />);

    expect(screen.getByText("Most orders are Open")).toBeInTheDocument();
    expect(screen.getByText("Jul 1998 was the strongest month")).toBeInTheDocument();
    expect(
      screen.getByText(/Customer#000116068 is the highest-spending customer/)
    ).toBeInTheDocument();
  });

  it("drops the period comparisons for All Time", () => {
    render(<InsightsPanel data={allTimeFixture} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText(/Revenue declined/)).not.toBeInTheDocument();
  });

  it("renders nothing at all when there is no data", () => {
    const { container } = render(<InsightsPanel data={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
