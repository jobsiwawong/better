"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  STATUS_META,
  STATUS_ORDER,
  type ExpenseStatusValue,
} from "@/lib/expense-constants";

export function StatusPill({
  status,
  onChange,
  className,
}: {
  status: ExpenseStatusValue;
  onChange: (status: ExpenseStatusValue) => void;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80",
            meta.className,
            className
          )}
          aria-label={`Status: ${meta.label}`}
        >
          <span className={cn("size-1.5 rounded-full", meta.dotClassName)} />
          {meta.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {STATUS_ORDER.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onChange(s)}>
            <span
              className={cn("size-2 rounded-full", STATUS_META[s].dotClassName)}
            />
            <span className="flex-1">{STATUS_META[s].label}</span>
            {s === status && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
