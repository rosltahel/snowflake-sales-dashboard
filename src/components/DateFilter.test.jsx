import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DateFilter } from "./DateFilter.jsx";
import { RANGE_PRESETS } from "../lib/dateRanges.js";

const activeRange = { key: "90d", label: "Last 90 Days", from: "1998-05-05", to: "1998-08-02" };

describe("DateFilter", () => {
  it("renders every preset", () => {
    render(<DateFilter value="all" onChange={() => {}} />);

    for (const preset of RANGE_PRESETS) {
      expect(screen.getByRole("button", { name: preset.label })).toBeInTheDocument();
    }
  });

  it("marks the selected preset as pressed", () => {
    render(<DateFilter value="90d" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Last 90 Days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "All Time" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("reports the chosen preset key", async () => {
    const onChange = vi.fn();
    render(<DateFilter value="all" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Last 30 Days" }));

    expect(onChange).toHaveBeenCalledWith("30d");
  });

  it("shows the resolved window so the anchoring is never a surprise", () => {
    render(<DateFilter value="90d" onChange={() => {}} activeRange={activeRange} />);

    expect(screen.getByText("May 5, 1998 – Aug 2, 1998")).toBeInTheDocument();
    expect(screen.getByText(/anchored to the newest order date/i)).toBeInTheDocument();
  });

  it("disables the presets while the first load is in flight", () => {
    render(<DateFilter value="all" onChange={() => {}} disabled />);

    expect(screen.getByRole("button", { name: "Last Year" })).toBeDisabled();
  });
});
