"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { calcTotals, marginFromTotals } from "@/lib/money/calc";
import { formatMoney } from "@/lib/money";
import { QUOTE_CATEGORIES } from "@/features/quotes/schema";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils/cn";

export type BuilderLine = { key: string; catalogue_item_id: string | null; description: string; category: string; quantity: string; unit: string; cost_price: string; sell_price: string; discount_pct: string; vat_rate: string; internal_notes: string };
export type CatalogueOption = { id: string; name: string; category: string; description: string | null; unit: string; cost_price: string; sell_price: string; vat_rate_key: string };
export type VatOption = { key: string; label: string; rate: string; is_default: boolean };

const uid = () => Math.random().toString(36).slice(2, 10);
const blank = (vat: string): BuilderLine => ({ key: uid(), catalogue_item_id: null, description: "", category: "other", quantity: "1", unit: "each", cost_price: "", sell_price: "", discount_pct: "0", vat_rate: vat, internal_notes: "" });

/**
 * Line-item editor for quotes and invoices. Live totals use lib/money/calc
 * (mirrors the SQL); the server recalculates on save and is authoritative.
 * `showCost` is false for invoices (no cost concept) — cost never leaves the org anyway.
 */
export function LineBuilder({
  initial, vatRates, catalogue, docDiscountPct, showCost, onSave, disabled,
}: { initial: BuilderLine[]; vatRates: VatOption[]; catalogue: CatalogueOption[]; docDiscountPct: number; showCost: boolean; onSave: (lines: Omit<BuilderLine, "key">[]) => Promise<FormState>; disabled?: boolean }) {
  const defaultVat = vatRates.find((v) => v.is_default)?.rate ?? vatRates[0]?.rate ?? "20";
  const [lines, setLines] = useState<BuilderLine[]>(initial.length ? initial : [blank(defaultVat)]);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const router = useRouter();

  const totals = useMemo(() => calcTotals(lines.map((l) => ({ quantity: l.quantity, sellPrice: l.sell_price, costPrice: l.cost_price, discountPct: l.discount_pct, vatRate: l.vat_rate })), docDiscountPct), [lines, docDiscountPct]);
  const margin = marginFromTotals(totals);

  const update = (key: string, patch: Partial<BuilderLine>) => { setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l))); setDirty(true); };
  const remove = (key: string) => { setLines((ls) => ls.filter((l) => l.key !== key)); setDirty(true); };
  const move = (idx: number, dir: -1 | 1) => { setLines((ls) => { const n = [...ls]; const j = idx + dir; if (j < 0 || j >= n.length) return ls; [n[idx], n[j]] = [n[j]!, n[idx]!]; return n; }); setDirty(true); };
  const add = () => { setLines((ls) => [...ls, blank(defaultVat)]); setDirty(true); };
  const fromCatalogue = (key: string, id: string) => {
    const c = catalogue.find((x) => x.id === id);
    if (!c) return update(key, { catalogue_item_id: null });
    const rate = vatRates.find((v) => v.key === c.vat_rate_key)?.rate ?? defaultVat;
    update(key, { catalogue_item_id: c.id, description: c.description ? `${c.name} — ${c.description}` : c.name, category: c.category, unit: c.unit, cost_price: c.cost_price, sell_price: c.sell_price, vat_rate: rate });
  };
  const save = () => start(async () => {
    const res = await onSave(lines.map(({ key: _k, ...rest }) => { void _k; return rest; }));
    setState(res);
    if (res.success) { setDirty(false); router.refresh(); }
  });

  const cell = "h-10 w-full rounded-md border border-graphite/15 bg-white/70 px-2 text-sm focus:border-copper focus:outline-none disabled:opacity-60";
  const cols = showCost ? "md:grid-cols-[minmax(0,3fr)_1.1fr_0.8fr_0.9fr_1fr_1fr_0.8fr_0.9fr_auto]" : "md:grid-cols-[minmax(0,3fr)_1.1fr_0.8fr_0.9fr_1fr_0.8fr_0.9fr_auto]";

  return (
    <div className="space-y-4">
      <div className={cn("hidden gap-2 px-1 text-[0.6875rem] uppercase tracking-wider text-muted-light md:grid", cols)}>
        <span>Description</span><span>Category</span><span className="text-right">Qty</span><span>Unit</span>{showCost ? <span className="text-right">Cost</span> : null}<span className="text-right">Sell</span><span className="text-right">Disc %</span><span className="text-right">VAT %</span><span />
      </div>
      <ul className="space-y-3 md:space-y-2">
        {lines.map((l, idx) => {
          const t = totals.lines[idx]!;
          return (
            <li key={l.key} className={cn("grid grid-cols-2 gap-2 rounded-lg border border-graphite/10 bg-white/40 p-3 md:border-0 md:bg-transparent md:p-0", cols)}>
              <div className="col-span-2 md:col-span-1">
                {catalogue.length ? (
                  <select value={l.catalogue_item_id ?? ""} onChange={(e) => fromCatalogue(l.key, e.target.value)} disabled={disabled} className={cn(cell, "mb-1 text-xs text-muted-light")} aria-label="Catalogue item">
                    <option value="">— from catalogue —</option>
                    {catalogue.map((c) => <option key={c.id} value={c.id}>{c.name} · {formatMoney(Number(c.sell_price) * 100, { showPence: false })}</option>)}
                  </select>
                ) : null}
                <textarea value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} disabled={disabled} rows={2} placeholder="Line description (customer-facing)" className={cn(cell, "h-auto min-h-10 py-2")} aria-label="Description" />
                {showCost ? <input value={l.internal_notes} onChange={(e) => update(l.key, { internal_notes: e.target.value })} disabled={disabled} placeholder="Internal note (never shown to customer)" className={cn(cell, "mt-1 h-8 text-xs")} aria-label="Internal note" /> : null}
              </div>
              <select value={l.category} onChange={(e) => update(l.key, { category: e.target.value })} disabled={disabled} className={cell} aria-label="Category">{QUOTE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
              <input value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} disabled={disabled} inputMode="decimal" className={cn(cell, "text-right num-lining")} aria-label="Quantity" />
              <input value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} disabled={disabled} className={cell} aria-label="Unit" placeholder="each" />
              {showCost ? <input value={l.cost_price} onChange={(e) => update(l.key, { cost_price: e.target.value })} disabled={disabled} inputMode="decimal" placeholder="0.00" className={cn(cell, "text-right num-lining")} aria-label="Cost price" /> : null}
              <input value={l.sell_price} onChange={(e) => update(l.key, { sell_price: e.target.value })} disabled={disabled} inputMode="decimal" placeholder="0.00" className={cn(cell, "text-right num-lining")} aria-label="Sell price" />
              <input value={l.discount_pct} onChange={(e) => update(l.key, { discount_pct: e.target.value })} disabled={disabled} inputMode="decimal" className={cn(cell, "text-right num-lining")} aria-label="Discount %" />
              <select value={l.vat_rate} onChange={(e) => update(l.key, { vat_rate: e.target.value })} disabled={disabled} className={cell} aria-label="VAT rate">
                {vatRates.map((v) => <option key={v.key} value={v.rate}>{Number(v.rate)}%</option>)}
                {!vatRates.some((v) => v.rate === l.vat_rate) ? <option value={l.vat_rate}>{Number(l.vat_rate)}%</option> : null}
              </select>
              <div className="col-span-2 flex items-center justify-between gap-1 md:col-span-1 md:justify-end">
                <span className="text-sm num-lining md:hidden">Net {formatMoney(t.net)}</span>
                {!disabled ? (
                  <span className="flex gap-0.5">
                    <button type="button" onClick={() => move(idx, -1)} aria-label="Move up" className="inline-flex size-8 items-center justify-center rounded-full text-muted-light hover:bg-graphite/5"><ArrowUp className="size-3.5" /></button>
                    <button type="button" onClick={() => move(idx, 1)} aria-label="Move down" className="inline-flex size-8 items-center justify-center rounded-full text-muted-light hover:bg-graphite/5"><ArrowDown className="size-3.5" /></button>
                    <button type="button" onClick={() => remove(l.key)} aria-label="Remove line" className="inline-flex size-8 items-center justify-center rounded-full text-muted-light hover:bg-status-danger/10 hover:text-status-danger"><Trash2 className="size-3.5" /></button>
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {!disabled ? <button type="button" onClick={add} className="inline-flex h-10 items-center gap-2 rounded-full border border-dashed border-graphite/30 px-4 text-sm hover:border-copper"><Plus className="size-4" /> Add line</button> : null}

      <div className="flex flex-col gap-4 border-t border-graphite/10 pt-4 md:flex-row md:items-start md:justify-between">
        {showCost ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
            <dt className="text-muted-light">Cost total</dt><dd className="num-lining md:col-span-2">{formatMoney(totals.costTotal)}</dd>
            <dt className="text-muted-light">Expected profit</dt><dd className="num-lining md:col-span-2">{formatMoney(totals.subtotal - totals.discountAmount - totals.costTotal)}</dd>
            <dt className="text-muted-light">Margin</dt><dd className={cn("num-lining md:col-span-2", margin !== null && margin < 15 && "text-status-warning")}>{margin === null ? "—" : `${margin}%`}</dd>
          </dl>
        ) : <span />}
        <dl className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted-light">Subtotal</dt><dd className="num-lining">{formatMoney(totals.subtotal)}</dd></div>
          {totals.discountAmount ? <div className="flex justify-between"><dt className="text-muted-light">Discount ({docDiscountPct}%)</dt><dd className="num-lining">−{formatMoney(totals.discountAmount)}</dd></div> : null}
          <div className="flex justify-between"><dt className="text-muted-light">VAT</dt><dd className="num-lining">{formatMoney(totals.vatAmount)}</dd></div>
          <div className="flex justify-between border-t border-graphite/15 pt-1 text-base font-medium"><dt>Total</dt><dd className="num-lining">{formatMoney(totals.total)}</dd></div>
        </dl>
      </div>

      {state.error ? <p role="alert" className="text-sm text-status-danger">{state.error}</p> : null}
      {!disabled ? (
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={pending || !dirty} className="inline-flex h-11 items-center gap-2 rounded-full bg-obsidian px-5 text-sm font-medium text-ivory hover:bg-graphite disabled:opacity-50">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null} Save lines
          </button>
          {dirty ? <span className="text-xs text-status-warning">Unsaved changes</span> : state.success ? <span className="text-xs text-status-success">{state.success}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
