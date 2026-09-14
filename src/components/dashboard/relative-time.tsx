"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { formatDateUK } from "@/lib/dates";

/** Relative timestamp rendered after mount to avoid server/client drift. */
export function RelativeTime({ value, className }: { value: string; className?: string }) {
  const [text, setText] = useState(() => formatDateUK(value));
  useEffect(() => {
    const update = () => setText(formatDistanceToNowStrict(new Date(value), { addSuffix: true }));
    const id = requestAnimationFrame(update);
    const t = setInterval(update, 60_000);
    return () => { cancelAnimationFrame(id); clearInterval(t); };
  }, [value]);
  return <time dateTime={value} title={formatDateUK(value, true)} className={className}>{text}</time>;
}
