import { formatDay } from "../lib/format.js";

/** Page masthead: identity on the left, data provenance on the right. */
export function DashboardHeader({ dataBounds, isRefetching }) {
  return (
    <header className="dashboard__header">
      <div className="dashboard__identity">
        <span className="dashboard__eyebrow">
          <span className="dashboard__dot" aria-hidden="true" />
          Snowflake · TPCH_SF1
        </span>
        <h1 className="dashboard__title">Sales Analytics</h1>
        <p className="dashboard__subtitle">
          Order performance, revenue trends and customer concentration.
        </p>
      </div>

      <div className="dashboard__meta">
        {dataBounds ? (
          <p className="dashboard__meta-line">
            Data coverage{" "}
            <strong>
              {formatDay(dataBounds.min)} – {formatDay(dataBounds.max)}
            </strong>
          </p>
        ) : null}
        <p className="dashboard__meta-line dashboard__meta-line--status">
          <span
            className={`status-dot ${isRefetching ? "status-dot--busy" : "status-dot--live"}`}
            aria-hidden="true"
          />
          {isRefetching ? "Refreshing…" : "Up to date"}
        </p>
      </div>
    </header>
  );
}
