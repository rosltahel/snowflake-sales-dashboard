/** Friendly failure state with a retry affordance. */
export function ErrorState({ error, onRetry }) {
  const message =
    error?.message ?? "Something went wrong while loading the dashboard.";

  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5" />
          <path d="M12 16.4v.1" />
        </svg>
      </div>

      <h2 className="error-state__title">We couldn&rsquo;t load your data</h2>
      <p className="error-state__message">{message}</p>

      <button type="button" className="button button--primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
