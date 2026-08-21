import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "./ChartCard.jsx";
import { ChartTooltip } from "./ChartTooltip.jsx";
import { getChartTheme } from "../lib/chartTheme.js";
import { useIsDarkMode } from "../hooks/useColorScheme.js";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMonth,
  partialMonthNote,
} from "../lib/format.js";

import { EmptyChart } from "./EmptyChart.jsx";

/** Monthly revenue. One series, so the title carries identity — no legend box. */
export function RevenueChart({ data, rangeTo }) {
  const theme = getChartTheme(useIsDarkMode());
  const rows = data ?? [];

  return (
    <ChartCard
      title="Revenue over time"
      subtitle={`Total order value, aggregated by month${partialMonthNote(rows, rangeTo)}`}
      tableView={<RevenueTable rows={rows} />}
    >
      {rows.length === 0 ? (
        <EmptyChart message="No revenue recorded in this period." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="revenue-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.revenue} stopOpacity={0.16} />
                <stop offset="100%" stopColor={theme.revenue} stopOpacity={0.01} />
              </linearGradient>
            </defs>

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
              tickFormatter={formatCurrencyCompact}
              tick={{ fill: theme.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={62}
            />

            <Tooltip
              cursor={{ stroke: theme.axis, strokeWidth: 1 }}
              content={
                <ChartTooltip
                  labelFormatter={(month) => formatMonth(month)}
                  valueFormatter={(value) => formatCurrency(value)}
                />
              }
            />

            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={theme.revenue}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#revenue-wash)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function RevenueTable({ rows }) {
  return (
    <table className="data-table">
      <caption className="visually-hidden">Monthly revenue</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col" className="data-table__number">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.month}>
            <th scope="row">{formatMonth(row.month)}</th>
            <td className="data-table__number">{formatCurrency(row.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
