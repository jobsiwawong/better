"use client";

import { AlertTriangle } from "lucide-react";
import {
  formatMinor,
  PAYMENT_META,
  STATUS_META,
  STATUS_ORDER,
  type ExpenseStatusValue,
} from "@/lib/expense-constants";
import type { ExpenseRow } from "@/lib/queries/expenses";

export function TripSummary({
  expenses,
  homeCurrency,
}: {
  expenses: ExpenseRow[];
  homeCurrency: string;
}) {
  if (expenses.length === 0) return null;

  let total = 0;
  let personal = 0;
  let corporate = 0;
  const byStatus: Record<string, number> = {};
  let hasStale = false;

  for (const e of expenses) {
    total += e.convertedMinor;
    if (e.paymentMethod === "PERSONAL") personal += e.convertedMinor;
    else corporate += e.convertedMinor;
    byStatus[e.status] = (byStatus[e.status] ?? 0) + e.convertedMinor;
    if (e.fxSource === "stale-cache") hasStale = true;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
      <span className="text-base font-semibold tabular-nums">
        {formatMinor(total, homeCurrency)}
      </span>
      <span className="text-muted-foreground">
        {PAYMENT_META.PERSONAL.shortLabel}{" "}
        <span className="font-medium text-foreground tabular-nums">
          {formatMinor(personal, homeCurrency)}
        </span>
        {corporate > 0 && (
          <>
            {" · "}
            {PAYMENT_META.CORPORATE_CARD.shortLabel}{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatMinor(corporate, homeCurrency)}
            </span>
          </>
        )}
      </span>
      <span className="text-xs text-muted-foreground">
        {STATUS_ORDER.filter((s) => byStatus[s]).map((s, i) => (
          <span key={s}>
            {i > 0 && " · "}
            <span className="tabular-nums">
              {formatMinor(byStatus[s], homeCurrency)}
            </span>{" "}
            {STATUS_META[s as ExpenseStatusValue].label.toLowerCase()}
          </span>
        ))}
      </span>
      {hasStale && (
        <span
          className="inline-flex items-center gap-1 text-xs text-[#a97b2e]"
          title="Some conversions used a cached rate because the exchange-rate service was unreachable"
        >
          <AlertTriangle className="size-3.5" /> approximate rates
        </span>
      )}
    </div>
  );
}
