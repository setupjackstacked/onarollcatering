import "server-only";

type Level = "info" | "warn" | "error";
type Meta = Record<string, unknown>;

const REDACT = /password|token|secret|key|authorization/i;

function sanitise(meta: Meta = {}): Meta {
  return Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, REDACT.test(k) ? "[redacted]" : v]));
}

function emit(level: Level, event: string, meta?: Meta) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...sanitise(meta) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** Structured server logger. Never log passwords or tokens. */
export const logger = {
  info: (event: string, meta?: Meta) => emit("info", event, meta),
  warn: (event: string, meta?: Meta) => emit("warn", event, meta),
  error: (event: string, meta?: Meta) => emit("error", event, meta),
};
