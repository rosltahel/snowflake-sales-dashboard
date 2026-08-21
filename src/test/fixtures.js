/** A realistically shaped payload, trimmed down from a live TPCH_SF1 response. */
export const dashboardFixture = {
  range: { key: "90d", label: "Last 90 Days", from: "1998-05-05", to: "1998-08-02" },
  dataBounds: { min: "1992-01-01", max: "1998-08-02" },
  totalOrders: 56018,
  totalRevenue: 8475675778.23,
  averageOrderValue: 151302.72,
  previousPeriod: {
    from: "1998-02-04",
    to: "1998-05-04",
    totalOrders: 56402,
    totalRevenue: 8528159134.48,
    averageOrderValue: 151203.13,
  },
  ordersByStatus: [
    { status: "O", total: 56018 },
    { status: "F", total: 12000 },
    { status: "P", total: 900 },
  ],
  monthlyTrend: [
    { month: "1998-05", orders: 16856, revenue: 2549199824.92 },
    { month: "1998-06", orders: 18590, revenue: 2809087921.63 },
    { month: "1998-07", orders: 19373, revenue: 2935593508.98 },
    { month: "1998-08", orders: 1199, revenue: 181794522.7 },
  ],
  topCustomers: [
    { name: "Customer#000116068", orders: 5, totalSpent: 1268982.35, averageOrderValue: 253796.47 },
    { name: "Customer#000119539", orders: 4, totalSpent: 1100000.0, averageOrderValue: 275000.0 },
    { name: "Customer#000000019", orders: 9, totalSpent: 900000.0, averageOrderValue: 100000.0 },
    { name: "Customer#000026518", orders: 7, totalSpent: 800000.0, averageOrderValue: 114285.71 },
    { name: "Customer#000143500", orders: 11, totalSpent: 700000.0, averageOrderValue: 63636.36 },
    { name: "Customer#000999999", orders: 12, totalSpent: 100000.0, averageOrderValue: 8333.33 },
  ],
};

/** All Time has no comparison window. */
export const allTimeFixture = {
  ...dashboardFixture,
  range: { key: "all", label: "All Time", from: "1992-01-01", to: "1998-08-02" },
  previousPeriod: null,
};
