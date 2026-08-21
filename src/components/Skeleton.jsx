/** Shimmer placeholders sized like the content they stand in for. */
export function Skeleton({ width, height, radius = 6, className = "" }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="card metric-card">
      <Skeleton width="55%" height={13} />
      <Skeleton width="75%" height={34} className="metric-card__value-skeleton" />
      <Skeleton width="40%" height={12} />
    </div>
  );
}

export function ChartSkeleton({ height = 260 }) {
  return (
    <div className="card">
      <Skeleton width="35%" height={18} />
      <Skeleton width="55%" height={12} className="skeleton--subtitle" />
      <Skeleton width="100%" height={height} radius={10} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="card">
      <Skeleton width="30%" height={18} />
      <Skeleton width="50%" height={12} className="skeleton--subtitle" />
      <div className="skeleton-rows">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} width="100%" height={40} />
        ))}
      </div>
    </div>
  );
}

/** The full first-paint layout, matching the real grid so nothing jumps. */
export function DashboardSkeleton() {
  return (
    <div className="dashboard__body" aria-busy="true" aria-label="Loading dashboard data">
      <div className="metric-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>
      <ChartSkeleton />
      <div className="chart-grid">
        <ChartSkeleton height={220} />
        <ChartSkeleton height={220} />
      </div>
      <TableSkeleton />
    </div>
  );
}
