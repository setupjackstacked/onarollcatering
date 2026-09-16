"use client";

import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { formatMoney } from "@/lib/money";

/** Brand palette — copper leads, graphite supports. Kept small on purpose. */
const COPPER = "#B06A3B";
const GRAPHITE = "#3A3A38";
const MUTED = "#9A958C";
const TONES = ["#B06A3B", "#3A3A38", "#7B8B7A", "#9A958C", "#C9A227", "#8C5A4A"];

const axis = { stroke: MUTED, fontSize: 12, tickLine: false, axisLine: false } as const;
const money = (pence: number) => formatMoney(pence, { showPence: false });
/** Recharts passes `ValueType`; every series here is numeric pence. */
const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

function ChartFrame({ children, height = 260 }: { children: React.ReactElement; height?: number }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

const tooltipStyle = { borderRadius: 8, border: "1px solid rgba(58,58,56,0.15)", background: "#FBFAF7", fontSize: 12 } as const;

export function RevenueChart({ data }: { data: { label: string; invoiced: number; received: number }[] }) {
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,58,56,0.08)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={(v: unknown) => money(num(v))} width={70} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown, name: unknown) => [money(num(v)), String(name)]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="invoiced" name="Invoiced (net)" fill={COPPER} radius={[4, 4, 0, 0]} />
        <Bar dataKey="received" name="Received" fill={GRAPHITE} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

export function ConversionChart({ data }: { data: { label: string; sent: number; accepted: number }[] }) {
  return (
    <ChartFrame>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,58,56,0.08)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} allowDecimals={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="sent" name="Quotes issued" stroke={GRAPHITE} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="accepted" name="Accepted" stroke={COPPER} strokeWidth={2} dot={false} />
      </LineChart>
    </ChartFrame>
  );
}

export function CategoryBarChart({ data, valueLabel = "Value", money: asMoney = true }: { data: { label: string; value: number }[]; valueLabel?: string; money?: boolean }) {
  return (
    <ChartFrame height={Math.max(200, data.length * 34 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,58,56,0.08)" horizontal={false} />
        <XAxis type="number" {...axis} tickFormatter={(v: unknown) => (asMoney ? money(num(v)) : String(num(v)))} />
        <YAxis type="category" dataKey="label" {...axis} width={140} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [asMoney ? money(num(v)) : num(v), valueLabel]} />
        <Bar dataKey="value" name={valueLabel} radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={TONES[i % TONES.length]} />)}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

export function StackedCostChart({ data }: { data: { label: string; committed: number; actual: number }[] }) {
  return (
    <ChartFrame height={Math.max(200, data.length * 34 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,58,56,0.08)" horizontal={false} />
        <XAxis type="number" {...axis} tickFormatter={(v: unknown) => money(num(v))} />
        <YAxis type="category" dataKey="label" {...axis} width={140} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown, name: unknown) => [money(num(v)), String(name)]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="actual" name="Actual" stackId="c" fill={COPPER} radius={[0, 0, 0, 0]} />
        <Bar dataKey="committed" name="Committed" stackId="c" fill={MUTED} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartFrame>
  );
}
