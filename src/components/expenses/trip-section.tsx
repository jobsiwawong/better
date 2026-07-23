"use client";

import * as React from "react";
import { Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { TripSummary } from "@/components/expenses/trip-summary";
import { QuickAddExpense } from "@/components/expenses/quick-add-expense";
import { deleteTrip } from "@/app/actions/expenses";
import {
  UNASSIGNED_HOME_CURRENCY,
  type Currency,
  type ExpenseStatusValue,
} from "@/lib/expense-constants";
import type { ExpenseRow, TripWithExpenses } from "@/lib/queries/expenses";

function formatRange(start: Date | string | null, end: Date | string | null) {
  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `from ${fmt(start)}`;
  if (end) return `until ${fmt(end)}`;
  return null;
}

export function TripSection({
  trip,
  expenses,
  onOpenExpense,
  onStatusChange,
  onDeleteExpense,
  onEditTrip,
  onTripDeleted,
}: {
  trip: TripWithExpenses | null; // null = Unassigned bucket
  expenses: ExpenseRow[];
  onOpenExpense: (expense: ExpenseRow) => void;
  onStatusChange: (expense: ExpenseRow, status: ExpenseStatusValue) => void;
  onDeleteExpense: (expense: ExpenseRow) => void;
  onEditTrip?: (trip: TripWithExpenses) => void;
  onTripDeleted?: () => void;
}) {
  const homeCurrency = trip?.homeCurrency ?? UNASSIGNED_HOME_CURRENCY;
  const range = trip ? formatRange(trip.startDate, trip.endDate) : null;
  const exportHref = `/api/export/expenses?tripId=${trip?.id ?? "unassigned"}`;

  const handleDelete = async () => {
    if (!trip) return;
    try {
      await deleteTrip(trip.id);
      toast(`Deleted trip "${trip.name}" — its expenses moved to Unassigned`);
      onTripDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete trip");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">
          {trip ? trip.name : "Unassigned"}
        </h2>
        <Badge variant="outline" className="rounded-full text-xs">
          {homeCurrency}
        </Badge>
        {range && (
          <span className="text-xs text-muted-foreground">{range}</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {expenses.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              asChild
              title="Export CSV"
            >
              <a href={exportHref} download>
                <Download className="size-4" />
              </a>
            </Button>
          )}
          {trip && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Trip options"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEditTrip?.(trip)}>
                  <Pencil className="size-3.5" /> Edit trip
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={handleDelete}
                >
                  <Trash2 className="size-3.5" /> Delete trip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <TripSummary expenses={expenses} homeCurrency={homeCurrency} />
      <ExpenseTable
        expenses={expenses}
        onOpen={onOpenExpense}
        onStatusChange={onStatusChange}
        onDelete={onDeleteExpense}
      />
      <div className="border-t border-border/60">
        <QuickAddExpense
          tripId={trip?.id ?? null}
          defaultCurrency={homeCurrency as Currency}
        />
      </div>
    </section>
  );
}
