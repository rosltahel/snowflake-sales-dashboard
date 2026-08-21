import { useMemo, useState } from "react";

import { formatCurrency, formatNumber } from "../lib/format.js";

/** Kept module-private so this file only exports its component. */
const CUSTOMER_SORTS = {
  revenue: { key: "totalSpent", label: "Revenue" },
  orders: { key: "orders", label: "Order count" },
};

const VISIBLE_ROWS = 5;

/**
 * Top customers, sortable between the two rankings.
 *
 * The function returns the top N by revenue *and* the top N by order count in
 * one query, so switching sort re-ranks a genuinely complete list rather than
 * re-sorting a revenue-biased sample — and costs no extra round trip.
 */
export function TopCustomersTable({ customers }) {
  const [sortBy, setSortBy] = useState("revenue");

  const rows = useMemo(() => {
    const field = CUSTOMER_SORTS[sortBy].key;
    return [...(customers ?? [])]
      .sort((a, b) => b[field] - a[field] || a.name.localeCompare(b.name))
      .slice(0, VISIBLE_ROWS);
  }, [customers, sortBy]);

  const ariaSort = (column) => (sortBy === column ? "descending" : "none");

  return (
    <section className="card customers-card">
      <div className="chart-card__head">
        <div>
          <h2 className="chart-card__title">Top customers</h2>
          <p className="chart-card__subtitle">
            Top {VISIBLE_ROWS} by {CUSTOMER_SORTS[sortBy].label.toLowerCase()} for the selected period
          </p>
        </div>

        <div className="segmented segmented--compact" role="group" aria-label="Sort customers by">
          {Object.entries(CUSTOMER_SORTS).map(([key, sort]) => (
            <button
              key={key}
              type="button"
              className={`segmented__option ${sortBy === key ? "segmented__option--active" : ""}`}
              aria-pressed={sortBy === key}
              onClick={() => setSortBy(key)}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="empty-chart">No customer activity in this period.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table data-table--customers">
            <thead>
              <tr>
                <th scope="col" className="data-table__rank">#</th>
                <th scope="col">Customer</th>
                <th scope="col" className="data-table__number" aria-sort={ariaSort("orders")}>
                  Orders
                </th>
                <th scope="col" className="data-table__number" aria-sort={ariaSort("revenue")}>
                  Total spent
                </th>
                <th scope="col" className="data-table__number">Avg. order value</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((customer, index) => (
                <tr key={customer.name}>
                  <td className="data-table__rank">{index + 1}</td>
                  <th scope="row" className="data-table__name">{customer.name}</th>
                  <td className="data-table__number">{formatNumber(customer.orders)}</td>
                  <td className="data-table__number data-table__number--strong">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="data-table__number">
                    {formatCurrency(customer.averageOrderValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
