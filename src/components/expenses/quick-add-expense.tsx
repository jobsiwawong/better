"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpense } from "@/app/actions/expenses";
import {
  CURRENCIES,
  parseAmountToMinor,
  type Currency,
} from "@/lib/expense-constants";

function todayInputValue() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function QuickAddExpense({
  tripId,
  defaultCurrency,
}: {
  tripId: string | null;
  defaultCurrency: Currency;
}) {
  const router = useRouter();
  const [merchant, setMerchant] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<Currency>(defaultCurrency);
  const [date, setDate] = React.useState(todayInputValue());
  const [pending, setPending] = React.useState(false);

  const submit = async () => {
    const name = merchant.trim();
    const amountMinor = parseAmountToMinor(amount);
    if (!name) return;
    if (amountMinor === null) {
      toast.error("Enter a valid amount");
      return;
    }
    setPending(true);
    try {
      await createExpense({
        merchant: name,
        date,
        amountMinor,
        currency,
        tripId,
      });
      setMerchant("");
      setAmount("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add expense");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2">
      <Input
        placeholder="Add an expense — merchant or description"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        onKeyDown={onKeyDown}
        className="h-8 min-w-48 flex-1"
        aria-label="Merchant"
      />
      <Input
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={onKeyDown}
        inputMode="decimal"
        className="h-8 w-24 text-right"
        aria-label="Amount"
      />
      <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
        <SelectTrigger className="h-8 w-[84px]" aria-label="Currency">
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
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-8 w-[140px]"
        aria-label="Expense date"
      />
      <Button
        size="sm"
        className="h-8 gap-1"
        onClick={submit}
        disabled={pending || !merchant.trim() || !amount.trim()}
      >
        <Plus className="size-3.5" /> Add
      </Button>
    </div>
  );
}
