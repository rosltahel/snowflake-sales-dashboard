/**
 * Shared Recharts tooltip. The value leads and the series name follows,
 * keyed by a short stroke of the series color rather than a filled box.
 */
export function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">
        {labelFormatter ? labelFormatter(label) : label}
      </p>

      {payload.map((entry) => (
        <p key={entry.dataKey} className="chart-tooltip__row">
          <span
            className="chart-tooltip__key"
            style={{ background: entry.color ?? entry.stroke ?? entry.fill }}
            aria-hidden="true"
          />
          <span className="chart-tooltip__value">
            {valueFormatter ? valueFormatter(entry.value, entry.dataKey) : entry.value}
          </span>
          <span className="chart-tooltip__name">{entry.name}</span>
        </p>
      ))}
    </div>
  );
}
