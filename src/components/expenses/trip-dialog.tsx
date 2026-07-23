"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrip, updateTrip } from "@/app/actions/expenses";
import {
  HOME_CURRENCIES,
  type HomeCurrency,
} from "@/lib/expense-constants";
import type { TripWithExpenses } from "@/lib/queries/expenses";

function toDateInputValue(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function TripDialog({
  trip,
  open,
  onOpenChange,
}: {
  trip: TripWithExpenses | null; // null = create
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(trip?.name ?? "");
  const [homeCurrency, setHomeCurrency] = React.useState<HomeCurrency>(
    (trip?.homeCurrency as HomeCurrency) ?? "USD"
  );
  const [startDate, setStartDate] = React.useState(
    toDateInputValue(trip?.startDate ?? null)
  );
  const [endDate, setEndDate] = React.useState(
    toDateInputValue(trip?.endDate ?? null)
  );
  const [pending, setPending] = React.useState(false);

  const currencyChanged = trip !== null && homeCurrency !== trip.homeCurrency;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      if (trip) {
        await updateTrip(trip.id, {
          name: trimmed,
          homeCurrency,
          startDate: startDate || null,
          endDate: endDate || null,
        });
      } else {
        await createTrip({
          name: trimmed,
          homeCurrency,
          startDate: startDate || null,
          endDate: endDate || null,
        });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save trip");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{trip ? "Edit trip" : "New trip"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="trip-name">Name</Label>
            <Input
              id="trip-name"
              autoFocus
              placeholder="e.g. Dubai offsite June 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reimbursement currency</Label>
            <Select
              value={homeCurrency}
              onValueChange={(v) => setHomeCurrency(v as HomeCurrency)}
            >
              <SelectTrigger aria-label="Reimbursement currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOME_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currencyChanged && (
              <p className="text-xs text-[#a97b2e]">
                Changing the currency re-converts every expense in this trip at
                its expense-date rate (manual overrides are replaced).
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trip-start">Start date</Label>
              <Input
                id="trip-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-end">End date</Label>
              <Input
                id="trip-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {trip ? "Save" : "Create trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
