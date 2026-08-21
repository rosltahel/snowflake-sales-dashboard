import { RANGE_PRESETS } from "../lib/dateRanges.js";
import { formatDay } from "../lib/format.js";

/**
 * The single filter row. It scopes every card below it, so there are
 * deliberately no per-chart date controls.
 */
export function DateFilter({ value, onChange, activeRange, disabled = false }) {
  return (
    <div className="filter-bar">
      <div
        className="segmented"
        role="group"
        aria-label="Date range"
      >
        {RANGE_PRESETS.map((preset) => {
          const isActive = preset.key === value;
          return (
            <button
              key={preset.key}
              type="button"
              className={`segmented__option ${isActive ? "segmented__option--active" : ""}`}
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onChange(preset.key)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {activeRange ? (
        <p className="filter-bar__caption">
          Showing{" "}
          <strong>
            {formatDay(activeRange.from)} – {formatDay(activeRange.to)}
          </strong>
          <span className="filter-bar__hint">
            Relative presets are anchored to the newest order date in the sample
            dataset, not to today.
          </span>
        </p>
      ) : null}
    </div>
  );
}
