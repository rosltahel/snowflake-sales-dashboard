import { useEffect, useState } from "react";

const QUERY = "(prefers-color-scheme: dark)";

/** Tracks the OS color scheme so charts can pick steps built for their surface. */
export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(QUERY).matches === true
  );

  useEffect(() => {
    const media = window.matchMedia?.(QUERY);
    if (!media) return;

    const onChange = (event) => setIsDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isDark;
}
