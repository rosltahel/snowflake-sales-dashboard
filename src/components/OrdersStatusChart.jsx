import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
import { formatNumber, formatNumberCompact, formatOrderStatus } from "../lib/format.js";

/**
 * Orders by status. One measure across nominal categories, so every bar takes
 * the same hue — shading bars by size would double-encode the bar length.
 */
export function OrdersStatusChart({ data }) {
  const theme = getChartTheme(useIsDarkMode());
  const rows = (data ?? []).map((row) => ({
    ...row,
    label: formatOrderStatus(row.status),
  }));

  return (
    <ChartCard
      title="Orders by status"
      subtitle="Order count grouped by fulfilment state"
      tableView={<StatusTable rows={rows} />}
    >
      {rows.length === 0 ? (
        <EmptyChart message="No orders recorded in this period." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ top: 24, right: 8, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />

            <XAxis
              dataKey="label"
              tick={{ fill: theme.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.axis }}
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
              content={<ChartTooltip valueFormatter={(value) => formatNumber(value)} />}
            />

            <Bar
              dataKey="total"
              name="Orders"
              fill={theme.orders}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              {/* Few enough bars that every cap can carry its value legibly. */}
              <LabelList
                dataKey="total"
                position="top"
                offset={8}
                formatter={formatNumberCompact}
                fill={theme.muted}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function StatusTable({ rows }) {
  return (
    <table className="data-table">
      <caption className="visually-hidden">Orders by status</caption>
      <thead>
        <tr>
          <th scope="col">Status</th>
          <th scope="col" className="data-table__number">Orders</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.status}>
            <th scope="row">{row.label}</th>
            <td className="data-table__number">{formatNumber(row.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
