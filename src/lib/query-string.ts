/** Rebuild the current search params with `page` swapped — for pagination links. */
export function pageHref(base: string, sp: Record<string, string | string[] | undefined>) {
  return (p: number) => {
    const n = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v && k !== "page") n.set(k, v);
    n.set("page", String(p));
    return `${base}?${n}`;
  };
}
