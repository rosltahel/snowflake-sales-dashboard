import { useCallback, useEffect, useState } from "react";

import { fetchDashboard } from "../lib/api.js";

/**
 * Owns every piece of dashboard fetch state so components stay presentational.
 *
 * Only the settled result is stored; the loading flags are *derived* during
 * render by comparing the request the caller wants against the one that last
 * settled. That keeps the effect free of synchronous setState calls (which
 * would trigger a cascading render) and makes the two loading modes fall out
 * naturally:
 *
 *   - `isLoading`    first paint, nothing to show yet — render skeletons
 *   - `isRefetching` a range change with data already on screen — hold the
 *                    previous render, dimmed, so the layout never jumps
 *
 * @param {string} range preset key, e.g. "90d"
 */
export function useDashboardData(range) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const key = `${range}|${attempt}`;

    fetchDashboard({ range, signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setSettled({ key, data, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        setSettled({ key, data: null, error });
      });

    return () => controller.abort();
  }, [range, attempt]);

  const isPending = settled.key !== `${range}|${attempt}`;
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    data: settled.data,
    error: isPending ? null : settled.error,
    isLoading: isPending && settled.data === null,
    isRefetching: isPending && settled.data !== null,
    retry,
  };
}
