import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "./ChartCard.jsx";
import { ChartTooltip } from "./ChartTooltip.jsx";
import { EmptyChart } from "./EmptyChart.jsx";
import { getChartTheme } from "../lib/chartTheme.js";
import { useIsDarkMode } from "../hooks/useColorScheme.js";
import {
  formatMonth,
  formatNumber,
  formatNumberCompact,
  partialMonthNote,
} from "../lib/format.js";

/**
 * Monthly order volume — deliberately its own panel rather than a second axis
 * on the revenue chart. Two y-scales on one plot invent a correlation that
 * isn't in the data; stacked panels share the x-axis honestly.
 */
export function OrdersTrendChart({ data, rangeTo }) {
  const theme = getChartTheme(useIsDarkMode());
  const rows = data ?? [];

  return (
    <ChartCard
      title="Order volume over time"
      subtitle={`Orders placed per month, on the same period as revenue${partialMonthNote(
        rows,
        rangeTo
      )}`}
      tableView={<OrdersTable rows={rows} />}
    >
      {rows.length === 0 ? (
        <EmptyChart message="No orders recorded in this period." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />

            <XAxis
              dataKey="month"
              tickFormatter={(month) => formatMonth(month, { short: true })}
              tick={{ fill: theme.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.axis }}
              minTickGap={18}
            />
            <YAxis
              tickFormatter={formatNumberCompact}
              tick={{ fill: theme.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />

            <Tooltip
              cursor={{ fill: theme.grid, fillOpacity: 0.35 }}
              content={
                <ChartTooltip
                  labelFormatter={(month) => formatMonth(month)}
                  valueFormatter={(value) => formatNumber(value)}
                />
              }
            />

            <Bar
              dataKey="orders"
              name="Orders"
              fill={theme.orders}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function OrdersTable({ rows }) {
  return (
    <table className="data-table">
      <caption className="visually-hidden">Monthly order volume</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col" className="data-table__number">Orders</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.month}>
            <th scope="row">{formatMonth(row.month)}</th>
            <td className="data-table__number">{formatNumber(row.orders)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
