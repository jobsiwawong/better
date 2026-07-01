"use client";

import * as React from "react";
import { AlertCircle, Bookmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelectPopover } from "@/components/board/multi-select-popover";
import type { TaskFilters } from "@/app/actions/saved-views";
import { cn } from "@/lib/utils";

export const EMPTY_FILTERS: TaskFilters = {
  tagIds: [],
  ownerIds: [],
  priorities: [],
  columnIds: [],
  overdueOnly: false,
};

export function filtersActive(filters: TaskFilters) {
  return (
    filters.tagIds.length > 0 ||
    filters.ownerIds.length > 0 ||
    filters.priorities.length > 0 ||
    filters.columnIds.length > 0 ||
    filters.overdueOnly
  );
}

const PRIORITY_ITEMS = [
  { id: "HIGH", label: "High" },
  { id: "MEDIUM", label: "Medium" },
  { id: "LOW", label: "Low" },
];

export function TaskFilterBar({
  filters,
  onChange,
  tags,
  owners,
  columns,
  savedViews,
  onSaveView,
  onApplyView,
  onDeleteView,
}: {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  tags: { id: string; name: string; color: string }[];
  owners: { id: string; name: string }[];
  columns: { id: string; name: string }[];
  savedViews?: { id: string; name: string; filters: TaskFilters }[];
  onSaveView?: (name: string) => void;
  onApplyView?: (filters: TaskFilters) => void;
  onDeleteView?: (id: string) => void;
}) {
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [saveName, setSaveName] = React.useState("");

  const toggle = (key: keyof TaskFilters, id: string) => {
    const current = filters[key] as string[];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
      <MultiSelectPopover
        triggerLabel="Tag"
        items={tags.map((t) => ({ id: t.id, label: t.name, color: t.color }))}
        selectedIds={filters.tagIds}
        onToggle={(id) => toggle("tagIds", id)}
      />
      <MultiSelectPopover
        triggerLabel="Owner"
        items={owners.map((o) => ({ id: o.id, label: o.name }))}
        selectedIds={filters.ownerIds}
        onToggle={(id) => toggle("ownerIds", id)}
      />
      <MultiSelectPopover
        triggerLabel="Priority"
        items={PRIORITY_ITEMS}
        selectedIds={filters.priorities}
        onToggle={(id) => toggle("priorities", id)}
      />
      <MultiSelectPopover
        triggerLabel="Status"
        items={columns.map((c) => ({ id: c.id, label: c.name }))}
        selectedIds={filters.columnIds}
        onToggle={(id) => toggle("columnIds", id)}
      />
      <Button
        type="button"
        variant={filters.overdueOnly ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5 rounded-full"
        onClick={() => onChange({ ...filters, overdueOnly: !filters.overdueOnly })}
      >
        <AlertCircle className="size-3.5" />
        Overdue
      </Button>

      {filtersActive(filters) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 rounded-full text-muted-foreground"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <X className="size-3.5" /> Clear
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        {savedViews && savedViews.length > 0 && (
          <div className="flex items-center gap-1.5">
            {savedViews.map((v) => (
              <span key={v.id} className="group inline-flex items-center">
                <button
                  type="button"
                  onClick={() => onApplyView?.(v.filters)}
                  className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {v.name}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${v.name}`}
                  onClick={() => onDeleteView?.(v.id)}
                  className="-ml-1 hidden text-muted-foreground hover:text-destructive group-hover:inline"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {onSaveView && filtersActive(filters) && (
          <Popover open={saveOpen} onOpenChange={setSaveOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full">
                <Bookmark className="size-3.5" /> Save view
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-64")} align="end">
              <div className="space-y-2">
                <Input
                  autoFocus
                  placeholder="e.g. My Sales Follow-ups"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && saveName.trim()) {
                      onSaveView(saveName.trim());
                      setSaveName("");
                      setSaveOpen(false);
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (saveName.trim()) {
                      onSaveView(saveName.trim());
                      setSaveName("");
                      setSaveOpen(false);
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

export function applyFilters<
  T extends {
    priority: string;
    columnId: string;
    dueDate: Date | string | null;
    tags: { tag: { id: string } }[];
    owners: { owner: { id: string } }[];
  }
>(tasks: T[], filters: TaskFilters): T[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.filter((task) => {
    if (filters.tagIds.length && !task.tags.some((t) => filters.tagIds.includes(t.tag.id)))
      return false;
    if (
      filters.ownerIds.length &&
      !task.owners.some((o) => filters.ownerIds.includes(o.owner.id))
    )
      return false;
    if (filters.priorities.length && !filters.priorities.includes(task.priority))
      return false;
    if (filters.columnIds.length && !filters.columnIds.includes(task.columnId))
      return false;
    if (filters.overdueOnly) {
      if (!task.dueDate || new Date(task.dueDate) >= today) return false;
    }
    return true;
  });
}
