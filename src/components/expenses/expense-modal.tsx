"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/expenses/status-pill";
import {
  MultiSelectPopover,
  SelectedPill,
} from "@/components/board/multi-select-popover";
import {
  addReceipt,
  deleteExpense,
  deleteReceipt,
  listReceipts,
  refreshExpenseRate,
  restoreExpense,
  updateExpense,
} from "@/app/actions/expenses";
import { createExpenseCategory } from "@/app/actions/expense-categories";
import { pushUndo, undoSpecific } from "@/lib/undo-store";
import { uploadImage, MAX_IMAGE_BYTES } from "@/lib/upload-image";
import { openManageLabels } from "@/components/app-shell/manage-labels-dialog";
import {
  CURRENCIES,
  FX_SOURCE_LABEL,
  PAYMENT_META,
  formatMinor,
  parseAmountToMinor,
  type Currency,
  type ExpenseStatusValue,
  type PaymentMethodValue,
} from "@/lib/expense-constants";
import type {
  ExpenseCategoryRow,
  ExpenseRow,
  ExpensesData,
  OwnerRow,
} from "@/lib/queries/expenses";

const NONE = "__none";
const MANAGE = "__manage";

function toDateInputValue(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function ExpenseModal({
  expense,
  trips,
  categories,
  owners,
  open,
  onOpenChange,
}: {
  expense: ExpenseRow;
  trips: ExpensesData["trips"];
  categories: ExpenseCategoryRow[];
  owners: OwnerRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [merchant, setMerchant] = React.useState(expense.merchant);
  const [amount, setAmount] = React.useState(
    (expense.amountMinor / 100).toFixed(2)
  );
  const [notes, setNotes] = React.useState(expense.notes ?? "");
  const [manualRate, setManualRate] = React.useState("");
  const [receipts, setReceipts] = React.useState<
    { id: string; image: string }[] | null
  >(null);
  const [enlargedId, setEnlargedId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const refresh = () => router.refresh();

  React.useEffect(() => {
    let cancelled = false;
    listReceipts(expense.id).then((r) => {
      if (!cancelled) setReceipts(r);
    });
    return () => {
      cancelled = true;
    };
  }, [expense.id]);

  const commit = (patch: Parameters<typeof updateExpense>[1], label: string) => {
    updateExpense(expense.id, patch)
      .then(refresh)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : `Could not save ${label}`)
      );
  };

  const commitMerchant = () => {
    const next = merchant.trim();
    if (!next || next === expense.merchant) return;
    const prev = expense.merchant;
    commit({ merchant: next }, "merchant");
    pushUndo({
      label: `merchant of "${prev}"`,
      undo: () => updateExpense(expense.id, { merchant: prev }).then(refresh),
      redo: () => updateExpense(expense.id, { merchant: next }).then(refresh),
    });
  };

  const commitAmount = () => {
    const minor = parseAmountToMinor(amount);
    if (minor === null) {
      toast.error("Enter a valid amount");
      setAmount((expense.amountMinor / 100).toFixed(2));
      return;
    }
    if (minor === expense.amountMinor) return;
    const prev = expense.amountMinor;
    commit({ amountMinor: minor }, "amount");
    pushUndo({
      label: `amount of "${expense.merchant}"`,
      undo: () => updateExpense(expense.id, { amountMinor: prev }).then(refresh),
      redo: () => updateExpense(expense.id, { amountMinor: minor }).then(refresh),
    });
  };

  const commitNotes = () => {
    const next = notes.trim() || null;
    if (next === (expense.notes ?? null)) return;
    commit({ notes: next }, "notes");
  };

  const handleCategoryToggle = (id: string) => {
    // Single-select semantics on a multi-select picker: re-picking clears.
    commit({ categoryId: id === expense.categoryId ? null : id }, "category");
  };

  const handleUpload = async (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large (max 8 MB)");
      return;
    }
    try {
      const url = await uploadImage(file, "receipts");
      await addReceipt(expense.id, url);
      setReceipts(await listReceipts(expense.id));
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    await deleteReceipt(id);
    setReceipts((r) => r?.filter((x) => x.id !== id) ?? null);
    refresh();
  };

  const handleDelete = async () => {
    const snapshot = await deleteExpense(expense.id);
    onOpenChange(false);
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

  const applyManualRate = () => {
    const rate = parseFloat(manualRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error("Enter a valid rate");
      return;
    }
    commit({ manualRate: rate }, "rate");
    setManualRate("");
  };

  const sameCurrency = expense.currency === expense.homeCurrency;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit expense</DialogTitle>
          <Input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            onBlur={commitMerchant}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            aria-label="Merchant"
          />
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              defaultValue={toDateInputValue(expense.date)}
              onChange={(e) => {
                if (e.target.value) commit({ date: e.target.value }, "date");
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Trip</Label>
            <Select
              value={expense.tripId ?? NONE}
              onValueChange={(v) =>
                commit({ tripId: v === NONE ? null : v }, "trip")
              }
            >
              <SelectTrigger aria-label="Trip">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {trips.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="expense-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={commitAmount}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                inputMode="decimal"
                className="text-right tabular-nums"
              />
              <Select
                value={expense.currency}
                onValueChange={(v) =>
                  commit({ currency: v as Currency }, "currency")
                }
              >
                <SelectTrigger className="w-[92px]" aria-label="Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              <MultiSelectPopover
                triggerLabel={expense.category ? "Change" : "Category"}
                items={categories.map((c) => ({
                  id: c.id,
                  label: c.name,
                  color: c.color,
                }))}
                selectedIds={expense.categoryId ? [expense.categoryId] : []}
                onToggle={handleCategoryToggle}
                onCreate={(name) => createExpenseCategory(name)}
                onManage={() => openManageLabels("categories")}
                manageLabel="Edit categories…"
              />
              {expense.category && (
                <SelectedPill
                  label={expense.category.name}
                  color={expense.category.color}
                  onRemove={() => commit({ categoryId: null }, "category")}
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <div>
              <StatusPill
                status={expense.status as ExpenseStatusValue}
                onChange={(s) => commit({ status: s }, "status")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select
              value={expense.paymentMethod}
              onValueChange={(v) =>
                commit({ paymentMethod: v as PaymentMethodValue }, "payment method")
              }
            >
              <SelectTrigger aria-label="Payment method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_META) as PaymentMethodValue[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PAYMENT_META[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Approver</Label>
            <Select
              value={expense.approverId ?? NONE}
              onValueChange={(v) => {
                if (v === MANAGE) {
                  openManageLabels("people");
                  return;
                }
                commit({ approverId: v === NONE ? null : v }, "approver");
              }}
            >
              <SelectTrigger aria-label="Approver">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
                <SelectItem value={MANAGE} className="text-muted-foreground">
                  Edit people…
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* FX panel */}
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
          {sameCurrency ? (
            <p className="text-muted-foreground">
              Same currency as the trip ({expense.homeCurrency}) — no conversion.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>
                <span className="font-medium tabular-nums">
                  {formatMinor(expense.convertedMinor, expense.homeCurrency)}
                </span>{" "}
                <span className="text-muted-foreground">
                  at {expense.fxRate.toFixed(4)} ·{" "}
                  {FX_SOURCE_LABEL[expense.fxSource] ?? expense.fxSource}
                </span>
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <Input
                  placeholder="Manual rate"
                  value={manualRate}
                  onChange={(e) => setManualRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyManualRate();
                  }}
                  inputMode="decimal"
                  className="h-7 w-28 text-right text-xs"
                  aria-label="Manual rate"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={applyManualRate}
                  disabled={!manualRate.trim()}
                >
                  Set
                </Button>
                {expense.fxSource === "manual" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => commit({ manualRate: null }, "rate")}
                  >
                    Clear override
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  title="Refresh market rate"
                  onClick={() =>
                    refreshExpenseRate(expense.id)
                      .then(refresh)
                      .catch((err) =>
                        toast.error(
                          err instanceof Error ? err.message : "Refresh failed"
                        )
                      )
                  }
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="expense-notes">Notes</Label>
          <Textarea
            id="expense-notes"
            placeholder="Context for this expense…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={commitNotes}
            rows={2}
          />
        </div>

        {/* Receipts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Receipts</Label>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-3.5" /> Add receipt
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </div>
          {receipts === null ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : receipts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No receipts yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {receipts.map((r) => (
                <div key={r.id} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image}
                    alt="Receipt"
                    onClick={() =>
                      setEnlargedId(enlargedId === r.id ? null : r.id)
                    }
                    className={
                      enlargedId === r.id
                        ? "max-h-96 cursor-zoom-out rounded-lg border border-border"
                        : "size-20 cursor-zoom-in rounded-lg border border-border object-cover"
                    }
                  />
                  <button
                    type="button"
                    aria-label="Delete receipt"
                    onClick={() => handleDeleteReceipt(r.id)}
                    className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-destructive p-0.5 text-white group-hover:block"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" /> Delete expense
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
