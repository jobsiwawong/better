"use client";

import { AlertTriangle } from "lucide-react";
import {
  formatMinor,
  STATUS_META,
  STATUS_ORDER,
  type ExpenseStatusValue,
} from "@/lib/expense-constants";
import type { ExpenseRow } from "@/lib/queries/expenses";

interface StatusSegment {
  status: ExpenseStatusValue;
  label: string;
  chartColor: string;
  value: number;
}

export function TripSummary({
  expenses,
  homeCurrency,
}: {
  expenses: ExpenseRow[];
  homeCurrency: string;
}) {
  if (expenses.length === 0) return null;

  let total = 0;
  const byStatus = new Map<ExpenseStatusValue, number>();
  let hasStale = false;

  for (const e of expenses) {
    total += e.convertedMinor;
    const status = e.status as ExpenseStatusValue;
    byStatus.set(status, (byStatus.get(status) ?? 0) + e.convertedMinor);
    if (e.fxSource === "stale-cache") hasStale = true;
  }

  const segments: StatusSegment[] = STATUS_ORDER.filter((s) =>
    byStatus.get(s)
  ).map((s) => ({
    status: s,
    label: STATUS_META[s].label,
    chartColor: STATUS_META[s].chartColor,
    value: byStatus.get(s)!,
  }));

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border/60 px-4 py-3">
      <StatusDonut segments={segments} total={total} count={expenses.length} />

      <ul className="grid gap-1">
        {segments.map((s) => (
          <li key={s.status} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.chartColor }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-medium tabular-nums">
              {formatMinor(s.value, homeCurrency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="ml-auto text-right">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Total
        </p>
        <p className="text-2xl font-semibold tabular-nums">
          {formatMinor(total, homeCurrency)}
        </p>
        {hasStale && (
          <p
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#a97b2e]"
            title="Some conversions used a cached rate because the exchange-rate service was unreachable"
          >
            <AlertTriangle className="size-3" /> approximate rates
          </p>
        )}
      </div>
    </div>
  );
}

function StatusDonut({
  segments,
  total,
  count,
}: {
  segments: StatusSegment[];
  total: number;
  count: number;
}) {
  const size = 88;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Small gaps between segments; none when a single status fills the ring.
  const gap = segments.length > 1 ? 3 : 0;

  const fracs = segments.map((s) => (total > 0 ? s.value / total : 0));
  const arcs = segments.map((s, i) => {
    const before = fracs.slice(0, i).reduce((a, b) => a + b, 0);
    const len = Math.max(fracs[i] * circ - gap, 1);
    const start = before * circ + gap / 2;
    return { ...s, len, start };
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`Expense status breakdown, ${count} ${count === 1 ? "expense" : "expenses"}`}
      >
        {arcs.map((a) => (
          <circle
            key={a.status}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.chartColor}
            strokeWidth={stroke}
            strokeDasharray={`${a.len} ${circ - a.len}`}
            strokeDashoffset={-a.start}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-semibold tabular-nums">{count}</span>
        <span className="-mt-0.5 text-[10px] text-muted-foreground">
          {count === 1 ? "item" : "items"}
        </span>
      </div>
    </div>
  );
}
