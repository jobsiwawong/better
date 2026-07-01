"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface PickableItem {
  id: string;
  label: string;
  color?: string;
}

export function MultiSelectPopover({
  items,
  selectedIds,
  onToggle,
  onCreate,
  placeholder = "Search…",
  triggerLabel,
  emptyLabel = "No results.",
}: {
  items: PickableItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate?: (name: string) => Promise<{ id: string; name?: string; label?: string }>;
  placeholder?: string;
  triggerLabel: React.ReactNode;
  emptyLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const exactMatch = items.some(
    (i) => i.label.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-full border-dashed"
        >
          <Plus className="size-3.5" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty className="px-3 py-2 text-sm text-muted-foreground">
              {emptyLabel}
            </CommandEmpty>
            <CommandGroup>
              {items
                .filter((i) =>
                  i.label.toLowerCase().includes(query.trim().toLowerCase())
                )
                .map((item) => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.label}
                      onSelect={() => onToggle(item.id)}
                    >
                      {item.color && (
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <span className="flex-1">{item.label}</span>
                      {selected && <Check className="size-3.5" />}
                    </CommandItem>
                  );
                })}
              {onCreate && query.trim() && !exactMatch && (
                <CommandItem
                  value={`create-${query}`}
                  onSelect={async () => {
                    const created = await onCreate(query.trim());
                    onToggle(created.id);
                    setQuery("");
                  }}
                >
                  <Plus className="size-3.5" />
                  Create &ldquo;{query.trim()}&rdquo;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function SelectedPill({
  label,
  color,
  onRemove,
}: {
  label: string;
  color?: string;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      )}
      style={
        color
          ? { backgroundColor: `${color}22`, color }
          : undefined
      }
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="opacity-60 hover:opacity-100"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  );
}
