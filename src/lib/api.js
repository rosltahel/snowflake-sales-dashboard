/** All network access lives here — components never call fetch directly. */

const ENDPOINT = "/.netlify/functions/dashboard";

export class DashboardApiError extends Error {
  constructor(message, { status } = {}) {
    super(message);
    this.name = "DashboardApiError";
    this.status = status;
  }
}

/**
 * Fetch dashboard data for a range preset.
 *
 * @param {{ range?: string, signal?: AbortSignal }} options
 * @returns {Promise<object>} the dashboard payload
 * @throws {DashboardApiError} on a non-2xx response or unparseable body
 */
export async function fetchDashboard({ range, signal } = {}) {
  const query = range ? `?range=${encodeURIComponent(range)}` : "";

  let response;
  try {
    response = await fetch(`${ENDPOINT}${query}`, { signal });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new DashboardApiError(
      "Could not reach the dashboard service. Check your connection and try again."
    );
  }

  if (!response.ok) {
    throw new DashboardApiError(
      "Snowflake could not be reached. The warehouse may be paused or the query timed out.",
      { status: response.status }
    );
  }

  try {
    return await response.json();
  } catch {
    throw new DashboardApiError("The dashboard service returned an unreadable response.");
  }
}
