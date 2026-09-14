export const PAGE_SIZE = 25;

export function pageParams(searchParams: Record<string, string | string[] | undefined>, size = PAGE_SIZE) {
  const raw = Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page);
  const page = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  return { page, from: (page - 1) * size, to: page * size - 1, size };
}

export function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}
