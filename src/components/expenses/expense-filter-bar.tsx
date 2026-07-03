"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MultiSelectPopover,
  SelectedPill,
} from "@/components/board/multi-select-popover";
import {
  PAYMENT_META,
  STATUS_META,
  STATUS_ORDER,
} from "@/lib/expense-constants";
import type { ExpenseCategoryRow, ExpenseRow } from "@/lib/queries/expenses";
import { openManageLabels } from "@/components/app-shell/manage-labels-dialog";

export interface ExpenseFilters {
  statuses: string[];
  categoryIds: string[];
  paymentMethods: string[];
}

export const EMPTY_EXPENSE_FILTERS: ExpenseFilters = {
  statuses: [],
  categoryIds: [],
  paymentMethods: [],
};

export function expenseFiltersActive(filters: ExpenseFilters) {
  return (
    filters.statuses.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.paymentMethods.length > 0
  );
}

export function applyExpenseFilters(
  expenses: ExpenseRow[],
  filters: ExpenseFilters
) {
  return expenses.filter((e) => {
    if (filters.statuses.length && !filters.statuses.includes(e.status))
      return false;
    if (
      filters.categoryIds.length &&
      (!e.categoryId || !filters.categoryIds.includes(e.categoryId))
    )
      return false;
    if (
      filters.paymentMethods.length &&
      !filters.paymentMethods.includes(e.paymentMethod)
    )
      return false;
    return true;
  });
}

const STATUS_ITEMS = STATUS_ORDER.map((s) => ({
  id: s,
  label: STATUS_META[s].label,
}));

const PAYMENT_ITEMS = (
  Object.keys(PAYMENT_META) as (keyof typeof PAYMENT_META)[]
).map((p) => ({ id: p, label: PAYMENT_META[p].label }));

export function ExpenseFilterBar({
  filters,
  onChange,
  categories,
}: {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  categories: ExpenseCategoryRow[];
}) {
  const toggle = (key: keyof ExpenseFilters, id: string) => {
    const current = filters[key];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
      <MultiSelectPopover
        triggerLabel="Status"
        items={STATUS_ITEMS}
        selectedIds={filters.statuses}
        onToggle={(id) => toggle("statuses", id)}
      />
      <MultiSelectPopover
        triggerLabel="Category"
        items={categories.map((c) => ({ id: c.id, label: c.name, color: c.color }))}
        selectedIds={filters.categoryIds}
        onToggle={(id) => toggle("categoryIds", id)}
        onManage={() => openManageLabels("categories")}
        manageLabel="Edit categories…"
      />
      <MultiSelectPopover
        triggerLabel="Payment"
        items={PAYMENT_ITEMS}
        selectedIds={filters.paymentMethods}
        onToggle={(id) => toggle("paymentMethods", id)}
      />

      {filters.categoryIds.map((id) => {
        const cat = categories.find((c) => c.id === id);
        if (!cat) return null;
        return (
          <SelectedPill
            key={id}
            label={cat.name}
            color={cat.color}
            onRemove={() => toggle("categoryIds", id)}
          />
        );
      })}

      {expenseFiltersActive(filters) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 rounded-full text-muted-foreground"
          onClick={() => onChange(EMPTY_EXPENSE_FILTERS)}
        >
          <X className="size-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}
