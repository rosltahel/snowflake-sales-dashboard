import { useState } from "react";

import "./App.css";

import { DashboardHeader } from "./components/DashboardHeader.jsx";
import { DateFilter } from "./components/DateFilter.jsx";
import { ErrorState } from "./components/ErrorState.jsx";
import { InsightsPanel } from "./components/InsightsPanel.jsx";
import { MetricCard } from "./components/MetricCard.jsx";
import { OrdersStatusChart } from "./components/OrdersStatusChart.jsx";
import { OrdersTrendChart } from "./components/OrdersTrendChart.jsx";
import { RevenueChart } from "./components/RevenueChart.jsx";
import { DashboardSkeleton } from "./components/Skeleton.jsx";
import { TopCustomersTable } from "./components/TopCustomersTable.jsx";

import { useDashboardData } from "./hooks/useDashboardData.js";
import { DEFAULT_RANGE } from "./lib/dateRanges.js";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  percentChange,
} from "./lib/format.js";

function App() {
  const [range, setRange] = useState(DEFAULT_RANGE);
  const { data, error, isLoading, isRefetching, retry } = useDashboardData(range);

  const previous = data?.previousPeriod ?? null;
  const comparisonLabel = previous ? "vs. previous period" : undefined;

  return (
    <div className="dashboard">
      <DashboardHeader dataBounds={data?.dataBounds} isRefetching={isRefetching} />

      <DateFilter
        value={range}
        onChange={setRange}
        activeRange={data?.range}
        disabled={isLoading}
      />

      {error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div
          className={`dashboard__body ${isRefetching ? "dashboard__body--refetching" : ""}`}
          aria-busy={isRefetching}
        >
          <div className="metric-grid">
            <MetricCard
              label="Total orders"
              accent="orders"
              value={formatNumber(data.totalOrders)}
              change={previous ? percentChange(data.totalOrders, previous.totalOrders) : undefined}
              comparisonLabel={comparisonLabel}
            />
            <MetricCard
              label="Total revenue"
              accent="revenue"
              value={formatCurrencyCompact(data.totalRevenue)}
              title={formatCurrency(data.totalRevenue)}
              change={previous ? percentChange(data.totalRevenue, previous.totalRevenue) : undefined}
              comparisonLabel={comparisonLabel}
            />
            <MetricCard
              label="Average order value"
              accent="revenue"
              value={formatCurrency(data.averageOrderValue)}
              change={
                previous
                  ? percentChange(data.averageOrderValue, previous.averageOrderValue)
                  : undefined
              }
              comparisonLabel={comparisonLabel}
            />
          </div>

          <InsightsPanel data={data} />

          <RevenueChart data={data.monthlyTrend} rangeTo={data.range?.to} />

          <div className="chart-grid">
            <OrdersTrendChart data={data.monthlyTrend} rangeTo={data.range?.to} />
            <OrdersStatusChart data={data.ordersByStatus} />
          </div>

          <TopCustomersTable customers={data.topCustomers} />
        </div>
      )}

      <footer className="dashboard__footer">
        <p>
          Source: <code>SNOWFLAKE_SAMPLE_DATA.TPCH_SF1</code> · queried server-side
          through a Netlify Function
        </p>
      </footer>
    </div>
  );
}

export default App;
