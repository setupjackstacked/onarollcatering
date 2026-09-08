/**
 * Privacy-conscious conversion events. No third-party tracker is wired yet —
 * events are dispatched as a CustomEvent on window and logged in dev, so an
 * approved analytics provider (Vercel Analytics, Plausible…) can subscribe
 * later without touching call sites.
 */
export type AnalyticsEvent =
  | "quote_started"
  | "quote_step_completed"
  | "quote_submitted"
  | "contact_submitted"
  | "contact_clicked"
  | "phone_clicked"
  | "service_viewed"
  | "case_study_viewed";

export function track(event: AnalyticsEvent, props: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("oar:analytics", { detail: { event, props, ts: Date.now() } }));
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event, props);
  }
}
