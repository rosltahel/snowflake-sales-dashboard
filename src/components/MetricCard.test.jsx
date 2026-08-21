import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricCard } from "./MetricCard.jsx";

describe("MetricCard", () => {
  it("renders the label and value", () => {
    render(<MetricCard label="Total orders" value="1,500,000" />);

    expect(screen.getByText("Total orders")).toBeInTheDocument();
    expect(screen.getByText("1,500,000")).toBeInTheDocument();
  });

  it("exposes the exact figure as a title when the value is compacted", () => {
    render(
      <MetricCard label="Total revenue" value="$226.8B" title="$226,829,306,447.46" />
    );

    expect(screen.getByText("$226.8B")).toHaveAttribute(
      "title",
      "$226,829,306,447.46"
    );
  });

  it("shows an upward delta for growth, with an arrow beside the sign", () => {
    const { container } = render(
      <MetricCard label="Revenue" value="$10K" change={12.5} comparisonLabel="vs. previous period" />
    );

    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(screen.getByText("↑")).toBeInTheDocument();
    expect(container.querySelector(".metric-card__delta--good")).not.toBeNull();
  });

  it("shows a downward delta for decline", () => {
    const { container } = render(
      <MetricCard label="Revenue" value="$8K" change={-6.4} comparisonLabel="vs. previous period" />
    );

    expect(screen.getByText("−6.4%")).toBeInTheDocument();
    expect(screen.getByText("↓")).toBeInTheDocument();
    expect(container.querySelector(".metric-card__delta--critical")).not.toBeNull();
  });

  it("treats a negligible change as flat rather than as a direction", () => {
    const { container } = render(<MetricCard label="Revenue" value="$8K" change={0.01} />);

    expect(screen.getByText("→")).toBeInTheDocument();
    expect(container.querySelector(".metric-card__delta--neutral")).not.toBeNull();
  });

  it("explains the absence of a delta instead of rendering a blank row", () => {
    render(<MetricCard label="Revenue" value="$8K" />);

    expect(screen.getByText("No prior period to compare")).toBeInTheDocument();
  });
});
