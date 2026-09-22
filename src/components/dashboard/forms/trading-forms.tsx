"use client";

import { useState } from "react";
import { Form, FormRow, TextField, TextArea, SelectField, DateField, MoneyField, CheckboxField, SubmitButton, Hidden } from "../form";
import { saveDailySales, saveSiteBudget } from "@/features/trading/actions";
import { formatMoney, toPence } from "@/lib/money";

type Opt = { value: string; label: string };

/**
 * The end-of-day takings for one kitchen.
 *
 * Three numbers and a running total, because that is what the till gives you
 * and the total is what the manager checks against the drawer before they
 * leave. Built for a phone: full-width fields, a decimal keypad, no grid.
 */
export function DailySalesForm({
  siteId,
  sites,
  date,
  existing,
  locked,
}: {
  siteId: string;
  sites?: Opt[];
  date: string;
  existing?: { cash: string; card: string; account: string; transactions: number | null; notes: string | null } | null;
  locked?: boolean;
}) {
  const [cash, setCash] = useState(existing?.cash ?? "");
  const [card, setCard] = useState(existing?.card ?? "");
  const [account, setAccount] = useState(existing?.account ?? "");
  const total = (Number(cash) || 0) + (Number(card) || 0) + (Number(account) || 0);

  if (locked) {
    return (
      <div className="rounded-md bg-graphite/5 px-4 py-3 text-sm">
        Finance has signed this day off. The figures are fixed at{" "}
        <strong className="num-lining">{formatMoney(toPence(String(total)))}</strong>. Ask finance to reopen it if
        something is wrong.
      </div>
    );
  }

  return (
    <Form action={saveDailySales}>
      {sites ? (
        <SelectField name="site_id" label="Site" options={sites} defaultValue={siteId} />
      ) : (
        <Hidden name="site_id" value={siteId} />
      )}
      <DateField name="sale_date" label="Day" defaultValue={date} max={new Date().toISOString().slice(0, 10)} required />

      <div className="space-y-4">
        <MoneyField name="cash" label="Cash" value={cash} onChange={(e) => setCash(e.target.value)} />
        <MoneyField name="card" label="Card" value={card} onChange={(e) => setCard(e.target.value)} />
        <MoneyField name="account" label="Charged to account" value={account} onChange={(e) => setAccount(e.target.value)}
          hint="Taken on account rather than paid at the counter" />
      </div>

      <div className="flex items-baseline justify-between rounded-md bg-obsidian px-4 py-3 text-ivory">
        <span className="text-sm">Day&rsquo;s total</span>
        <span className="font-display num-lining text-2xl">{formatMoney(toPence(total.toFixed(2)))}</span>
      </div>

      <FormRow cols={2}>
        <TextField name="transactions" label="Transactions" inputMode="numeric" optional
          defaultValue={existing?.transactions ?? ""} hint="From the till, if you have it" />
        <TextField name="notes" label="Note" optional defaultValue={existing?.notes ?? ""} hint="Anything unusual about the day" />
      </FormRow>

      <SubmitButton variant="copper">Save the day</SubmitButton>
    </Form>
  );
}

/** The operating budget the client approved for a kitchen. Finance only. */
export function SiteBudgetForm({
  siteId,
  month,
  existing,
}: {
  siteId: string;
  month: string;
  existing?: { food_budget: string; labour_budget: string; other_budget: string; revenue_target: string; approved_by_client: boolean; notes: string | null } | null;
}) {
  return (
    <Form action={saveSiteBudget}>
      <Hidden name="site_id" value={siteId} />
      <FormRow cols={2}>
        <TextField name="month" label="Month" type="month" defaultValue={month} required />
        <MoneyField name="revenue_target" label="Revenue target" defaultValue={existing?.revenue_target ?? ""} optional />
      </FormRow>
      <FormRow cols={3}>
        <MoneyField name="food_budget" label="Food" defaultValue={existing?.food_budget ?? ""} />
        <MoneyField name="labour_budget" label="Labour" defaultValue={existing?.labour_budget ?? ""} />
        <MoneyField name="other_budget" label="Other" defaultValue={existing?.other_budget ?? ""} />
      </FormRow>
      <CheckboxField name="approved_by_client" label="The client has approved this budget" defaultChecked={existing?.approved_by_client} />
      <TextArea name="notes" label="Notes" optional rows={2} defaultValue={existing?.notes ?? ""} />
      <SubmitButton>Save budget</SubmitButton>
    </Form>
  );
}
