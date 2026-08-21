import { useId, useState } from "react";

/**
 * Shared shell for every chart panel.
 *
 * Each chart ships a table-view twin: the tooltip is an enhancement, never the
 * only route to a value.
 */
export function ChartCard({ title, subtitle, children, tableView }) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  return (
    <section className="card chart-card">
      <div className="chart-card__head">
        <div>
          <h2 className="chart-card__title">{title}</h2>
          {subtitle ? <p className="chart-card__subtitle">{subtitle}</p> : null}
        </div>

        {tableView ? (
          <button
            type="button"
            className="button button--ghost"
            aria-expanded={showTable}
            aria-controls={tableId}
            onClick={() => setShowTable((open) => !open)}
          >
            {showTable ? "Hide table" : "View as table"}
          </button>
        ) : null}
      </div>

      <div className="chart-card__body">{children}</div>

      {tableView ? (
        <div id={tableId} hidden={!showTable} className="chart-card__table">
          {tableView}
        </div>
      ) : null}
    </section>
  );
}
