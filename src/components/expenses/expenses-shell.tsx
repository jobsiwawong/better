"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TripSection } from "@/components/expenses/trip-section";
import { TripDialog } from "@/components/expenses/trip-dialog";
import { ExpenseModal } from "@/components/expenses/expense-modal";
import {
  applyExpenseFilters,
  EMPTY_EXPENSE_FILTERS,
  ExpenseFilterBar,
  type ExpenseFilters,
} from "@/components/expenses/expense-filter-bar";
import { updateExpense, deleteExpense, restoreExpense } from "@/app/actions/expenses";
import { pushUndo, undoSpecific } from "@/lib/undo-store";
import {
  STATUS_META,
  type ExpenseStatusValue,
} from "@/lib/expense-constants";
import type {
  ExpenseCategoryRow,
  ExpenseRow,
  ExpensesData,
  OwnerRow,
  TripWithExpenses,
} from "@/lib/queries/expenses";

export function ExpensesShell({
  trips,
  unassigned,
  categories,
  owners,
}: {
  trips: ExpensesData["trips"];
  unassigned: ExpenseRow[];
  categories: ExpenseCategoryRow[];
  owners: OwnerRow[];
}) {
  const router = useRouter();
  const [tripFilter, setTripFilter] = React.useState<string>("all");
  const [filters, setFilters] = React.useState<ExpenseFilters>(
    EMPTY_EXPENSE_FILTERS
  );
  const [openExpenseId, setOpenExpenseId] = React.useState<string | null>(null);
  const [tripDialogOpen, setTripDialogOpen] = React.useState(false);
  const [editingTrip, setEditingTrip] = React.useState<TripWithExpenses | null>(
    null
  );

  const refresh = () => router.refresh();

  // Derive the open expense from fresh props so edits show live.
  const allExpenses = React.useMemo(
    () => [...trips.flatMap((t) => t.expenses), ...unassigned],
    [trips, unassigned]
  );
  const openExpense = openExpenseId
    ? allExpenses.find((e) => e.id === openExpenseId) ?? null
    : null;

  const handleStatusChange = (
    expense: ExpenseRow,
    status: ExpenseStatusValue
  ) => {
    if (status === expense.status) return;
    const prev = expense.status as ExpenseStatusValue;
    updateExpense(expense.id, { status }).then(refresh);
    pushUndo({
      label: `status of "${expense.merchant}"`,
      undo: () => updateExpense(expense.id, { status: prev }).then(refresh),
      redo: () => updateExpense(expense.id, { status }).then(refresh),
    });
    toast(`${expense.merchant}: ${STATUS_META[status].label}`);
  };

  const handleDeleteExpense = async (expense: ExpenseRow) => {
    const snapshot = await deleteExpense(expense.id);
    if (openExpenseId === expense.id) setOpenExpenseId(null);
    refresh();
    const entry = pushUndo({
      label: `delete expense "${expense.merchant}"`,
      undo: () => restoreExpense(snapshot).then(refresh),
      redo: () => deleteExpense(expense.id).then(refresh),
    });
    toast(`Deleted "${expense.merchant}"`, {
      action: { label: "Undo", onClick: () => undoSpecific(entry) },
    });
  };

  const visibleTrips =
    tripFilter === "all"
      ? trips
      : tripFilter === "unassigned"
        ? []
        : trips.filter((t) => t.id === tripFilter);
  const showUnassigned =
    (tripFilter === "all" && unassigned.length > 0) ||
    tripFilter === "unassigned";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 px-6 pb-1 pt-5">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <Select value={tripFilter} onValueChange={setTripFilter}>
          <SelectTrigger className="h-8 w-56" aria-label="Trip">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trips</SelectItem>
            {trips.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 rounded-full"
          onClick={() => {
            setEditingTrip(null);
            setTripDialogOpen(true);
          }}
        >
          <Plus className="size-3.5" /> New trip
        </Button>
      </div>

      <ExpenseFilterBar
        filters={filters}
        onChange={setFilters}
        categories={categories}
      />

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {visibleTrips.length === 0 && !showUnassigned && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No trips yet. Create one to start logging expenses, or add
            one-off expenses to the Unassigned bucket below.
          </p>
        )}
        {visibleTrips.map((trip) => (
          <TripSection
            key={trip.id}
            trip={trip}
            expenses={applyExpenseFilters(trip.expenses, filters)}
            onOpenExpense={(e) => setOpenExpenseId(e.id)}
            onStatusChange={handleStatusChange}
            onDeleteExpense={handleDeleteExpense}
            onEditTrip={(t) => {
              setEditingTrip(t);
              setTripDialogOpen(true);
            }}
            onTripDeleted={refresh}
          />
        ))}
        {(showUnassigned || tripFilter === "all") && (
          <TripSection
            trip={null}
            expenses={applyExpenseFilters(unassigned, filters)}
            onOpenExpense={(e) => setOpenExpenseId(e.id)}
            onStatusChange={handleStatusChange}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </div>

      {tripDialogOpen && (
        <TripDialog
          key={editingTrip?.id ?? "new"}
          trip={editingTrip}
          open={tripDialogOpen}
          onOpenChange={setTripDialogOpen}
        />
      )}

      {openExpense && (
        <ExpenseModal
          key={openExpense.id}
          expense={openExpense}
          trips={trips}
          categories={categories}
          owners={owners}
          open
          onOpenChange={(open) => {
            if (!open) setOpenExpenseId(null);
          }}
        />
      )}
    </>
  );
}
