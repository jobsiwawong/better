"use client";

import { CreditCard, Paperclip, Wallet } from "lucide-react";
import { DailyMonster } from "@/components/monsters";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/expenses/status-pill";
import {
  formatMinor,
  type ExpenseStatusValue,
} from "@/lib/expense-constants";
import type { ExpenseRow } from "@/lib/queries/expenses";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const GRID =
  "grid grid-cols-[72px_minmax(160px,1fr)_130px_150px_36px_40px] items-center gap-3";

export function ExpenseTable({
  expenses,
  onOpen,
  onStatusChange,
}: {
  expenses: ExpenseRow[];
  onOpen: (expense: ExpenseRow) => void;
  onStatusChange: (expense: ExpenseRow, status: ExpenseStatusValue) => void;
}) {
  if (expenses.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-4">
        <DailyMonster seed={3} size={56} />
        <p className="text-sm text-muted-foreground">No expenses yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[620px]">
        <div
          className={cn(
            GRID,
            "border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          )}
        >
          <span>Date</span>
          <span>Merchant</span>
          <span className="text-right">Amount</span>
          <span>Status</span>
          <span />
          <span />
        </div>
        {expenses.map((e) => (
          <div
            key={e.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(e)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" && ev.target === ev.currentTarget) onOpen(e);
            }}
            className={cn(
              GRID,
              "w-full cursor-pointer border-b border-border/60 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent/40"
            )}
          >
            <span className="text-muted-foreground">{formatDate(e.date)}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{e.merchant}</span>
              {e.category && (
                <span
                  className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${e.category.color}22`,
                    color: e.category.color,
                  }}
                >
                  {e.category.name}
                </span>
              )}
            </span>
            <span
              className="text-right tabular-nums"
              title={
                e.currency === e.homeCurrency
                  ? undefined
                  : `Rate ${e.fxRate.toFixed(4)} (${e.fxSource})`
              }
            >
              <span className="block font-medium">
                {formatMinor(e.convertedMinor, e.homeCurrency)}
              </span>
              {e.currency !== e.homeCurrency && (
                <span className="block text-xs text-muted-foreground">
                  {formatMinor(e.amountMinor, e.currency)}
                </span>
              )}
            </span>
            <span>
              <StatusPill
                status={e.status as ExpenseStatusValue}
                onChange={(s) => onStatusChange(e, s)}
              />
            </span>
            <span
              className="flex items-center justify-center text-muted-foreground"
              title={
                e.paymentMethod === "PERSONAL"
                  ? "Personal (reimbursable)"
                  : "Corporate card"
              }
            >
              {e.paymentMethod === "PERSONAL" ? (
                <Wallet className="size-3.5" />
              ) : (
                <CreditCard className="size-3.5" />
              )}
            </span>
            <span className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
              {e.receipts.length > 0 && (
                <>
                  <Paperclip className="size-3.5" />
                  {e.receipts.length}
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
