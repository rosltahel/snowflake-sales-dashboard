import { buildInsights } from "../lib/insights.js";

const TONE_ICONS = {
  good: "▲",
  critical: "▼",
  neutral: "•",
};

/**
 * Deterministic observations computed from the payload already on screen.
 * Tone is paired with an icon and the wording states the direction, so nothing
 * depends on color alone.
 */
export function InsightsPanel({ data }) {
  const insights = buildInsights(data);

  if (insights.length === 0) return null;

  return (
    <section className="card insights-card">
      <div className="chart-card__head">
        <div>
          <h2 className="chart-card__title">Insights</h2>
          <p className="chart-card__subtitle">
            Generated from the selected period — no estimates, no external calls
          </p>
        </div>
      </div>

      <ul className="insights-list">
        {insights.map((insight) => (
          <li key={insight.id} className={`insight insight--${insight.tone}`}>
            <span className="insight__icon" aria-hidden="true">
              {TONE_ICONS[insight.tone]}
            </span>
            <div>
              <p className="insight__title">{insight.title}</p>
              <p className="insight__detail">{insight.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
