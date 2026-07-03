"use client";

import { CreditCard, Paperclip, Wallet } from "lucide-react";
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
  "grid grid-cols-[76px_minmax(0,1fr)_120px_110px_120px_150px_88px_96px_44px] items-center gap-2";

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
      <p className="px-4 py-6 text-sm text-muted-foreground">
        No expenses yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div
          className={cn(
            GRID,
            "border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          )}
        >
          <span>Date</span>
          <span>Merchant</span>
          <span>Category</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Converted</span>
          <span>Status</span>
          <span>Payment</span>
          <span>Approver</span>
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
            <span className="truncate font-medium">{e.merchant}</span>
            <span>
              {e.category ? (
                <span
                  className="inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${e.category.color}22`,
                    color: e.category.color,
                  }}
                >
                  {e.category.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </span>
            <span className="text-right tabular-nums">
              {formatMinor(e.amountMinor, e.currency)}
            </span>
            <span
              className="text-right tabular-nums text-muted-foreground"
              title={`Rate ${e.fxRate.toFixed(4)} (${e.fxSource})`}
            >
              {e.currency === e.homeCurrency
                ? "—"
                : formatMinor(e.convertedMinor, e.homeCurrency)}
            </span>
            <span>
              <StatusPill
                status={e.status as ExpenseStatusValue}
                onChange={(s) => onStatusChange(e, s)}
              />
            </span>
            <span
              className="flex items-center gap-1 text-xs text-muted-foreground"
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
              {e.paymentMethod === "PERSONAL" ? "Personal" : "Corp"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {e.approver?.name ?? "—"}
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
