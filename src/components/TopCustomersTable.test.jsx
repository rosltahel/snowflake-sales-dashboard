import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TopCustomersTable } from "./TopCustomersTable.jsx";
import { dashboardFixture } from "../test/fixtures.js";

const customers = dashboardFixture.topCustomers;

const rowNames = () =>
  screen
    .getAllByRole("row")
    .slice(1) // drop the header row
    .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("TopCustomersTable", () => {
  it("shows name, orders, total spent and average order value", () => {
    render(<TopCustomersTable customers={customers} />);

    const row = screen.getByRole("row", { name: /Customer#000116068/ });

    expect(within(row).getByText("5")).toBeInTheDocument();
    expect(within(row).getByText("$1,268,982.35")).toBeInTheDocument();
    expect(within(row).getByText("$253,796.47")).toBeInTheDocument();
  });

  it("ranks by revenue by default", () => {
    render(<TopCustomersTable customers={customers} />);

    expect(screen.getByRole("rowheader", { name: "Customer#000116068" })).toBeInTheDocument();
    expect(rowNames()).toEqual(["1", "2", "3", "4", "5"]);
    expect(
      screen.getByRole("columnheader", { name: "Total spent" })
    ).toHaveAttribute("aria-sort", "descending");
  });

  it("re-ranks by order count when the sort is switched", async () => {
    render(<TopCustomersTable customers={customers} />);

    // Customer#000999999 has the most orders but the least revenue, so it only
    // appears once the ranking actually changes.
    expect(screen.queryByText("Customer#000999999")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Order count" }));

    const rows = screen.getAllByRole("rowheader");
    expect(rows[0]).toHaveTextContent("Customer#000999999");
    expect(
      screen.getByRole("columnheader", { name: "Orders" })
    ).toHaveAttribute("aria-sort", "descending");
  });

  it("limits the table to five rows regardless of how many the API returns", () => {
    render(<TopCustomersTable customers={customers} />);

    expect(customers.length).toBeGreaterThan(5);
    expect(screen.getAllByRole("rowheader")).toHaveLength(5);
  });

  it("shows an empty message rather than a bare table when there is no activity", () => {
    render(<TopCustomersTable customers={[]} />);

    expect(screen.getByText("No customer activity in this period.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
