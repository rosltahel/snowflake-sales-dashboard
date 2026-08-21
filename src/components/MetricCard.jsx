import { formatPercentChange } from "../lib/format.js";

/**
 * A stat tile: label, value, and an optional signed delta against the
 * preceding period. The delta pairs an arrow glyph with the sign so direction
 * never rests on color alone.
 */
export function MetricCard({ label, value, title, change, comparisonLabel, accent }) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const flat = hasChange && Math.abs(change) < 0.05;
  const tone = !hasChange || flat ? "neutral" : change > 0 ? "good" : "critical";

  return (
    <div className={`card metric-card metric-card--${accent ?? "revenue"}`}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value" title={title}>
        {value}
      </p>

      {hasChange ? (
        <p className={`metric-card__delta metric-card__delta--${tone}`}>
          <span aria-hidden="true">{flat ? "→" : change > 0 ? "↑" : "↓"}</span>
          <span>{formatPercentChange(change)}</span>
          <span className="metric-card__delta-label">{comparisonLabel}</span>
        </p>
      ) : (
        <p className="metric-card__delta metric-card__delta--empty">
          {comparisonLabel ?? "No prior period to compare"}
        </p>
      )}
    </div>
  );
}
