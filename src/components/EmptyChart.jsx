/** Shown when a range produces no rows — never a blank plot area. */
export function EmptyChart({ message }) {
  return (
    <p className="empty-chart">{message}</p>
  );
}
