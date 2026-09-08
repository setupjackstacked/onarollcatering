"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics/events";

/** Delegated click tracking for elements carrying data-analytics="event_name". */
export function AnalyticsLinks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-analytics]");
      const name = el?.dataset.analytics as AnalyticsEvent | undefined;
      if (name) track(name);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
