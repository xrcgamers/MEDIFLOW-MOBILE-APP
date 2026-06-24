import { useEffect } from "react";

export default function useAutoRefresh(callback, enabled = true, intervalMs = 15000) {
  useEffect(() => {
    if (!enabled || typeof callback !== "function") return;

    const timer = setInterval(() => {
      callback();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [callback, enabled, intervalMs]);
}