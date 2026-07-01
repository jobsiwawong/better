"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, KanbanSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectPopover, SelectedPill } from "@/components/board/multi-select-popover";
import { createTask } from "@/app/actions/tasks";
import { createNote, updateNote } from "@/app/actions/notes";
import { createTag } from "@/app/actions/tags";
import { createOwner } from "@/app/actions/owners";
import { getQuickAddOptions } from "@/app/actions/quick-add";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  name?: string;
  color?: string;
}

export function QuickAdd() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"task" | "note">("task");
  const [title, setTitle] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [columns, setColumns] = React.useState<{ id: string; name: string }[]>([]);
  const [columnId, setColumnId] = React.useState("");
  const [tagIds, setTagIds] = React.useState<string[]>([]);
  const [ownerIds, setOwnerIds] = React.useState<string[]>([]);
  const [tags, setTags] = React.useState<Option[]>([]);
  const [owners, setOwners] = React.useState<Option[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const openDialog = React.useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
    getQuickAddOptions().then(({ columns, tags, owners }) => {
      setColumns(columns);
      setColumnId((prev) => prev || columns[0]?.id || "");
      setTags(tags);
      setOwners(owners);
    });
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setTitle("");
      setDueDate("");
      setPriority("MEDIUM");
      setTagIds([]);
      setOwnerIds([]);
      setMode("task");
    }
  };

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openDialog();
      }
    }
    window.addEventListener("keydown", handler);
    window.addEventListener("open-quick-add", openDialog);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-quick-add", openDialog);
    };
  }, [openDialog]);

  const submit = async () => {
    if (!title.trim()) return;
    if (mode === "task") {
      await createTask({
        title,
        columnId,
        dueDate: dueDate || null,
        priority,
        tagIds,
        ownerIds,
      });
      router.refresh();
    } else {
      const note = await createNote({});
      await updateNote(note.id, { title });
      router.push(`/notes/${note.id}`);
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-4">
        <DialogHeader>
          <DialogTitle className="sr-only">Quick add</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1.5 rounded-full bg-muted p-1">
          <button
            onClick={() => setMode("task")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium transition-colors",
              mode === "task" ? "bg-card shadow-sm" : "text-muted-foreground"
            )}
          >
            <KanbanSquare className="size-3.5" /> Task
          </button>
          <button
            onClick={() => setMode("note")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium transition-colors",
              mode === "note" ? "bg-card shadow-sm" : "text-muted-foreground"
            )}
          >
            <FileText className="size-3.5" /> Note
          </button>
        </div>

        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={mode === "task" ? "Task title…" : "Note title…"}
          className="h-11 text-base"
        />

        {mode === "task" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9"
              />
              <Select value={priority} onValueChange={(v: typeof priority) => setPriority(v)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap items-center gap-1.5">
              {ownerIds.map((id) => {
                const owner = owners.find((o) => o.id === id);
                if (!owner) return null;
                return (
                  <SelectedPill
                    key={id}
                    label={owner.name!}
                    onRemove={() => setOwnerIds((prev) => prev.filter((x) => x !== id))}
                  />
                );
              })}
              <MultiSelectPopover
                triggerLabel="Owner"
                items={owners.map((o) => ({ id: o.id, label: o.name! }))}
                selectedIds={ownerIds}
                onToggle={(id) =>
                  setOwnerIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
                }
                onCreate={async (name) => {
                  const created = await createOwner(name);
                  setOwners((prev) => [...prev, created]);
                  return created;
                }}
              />
              {tagIds.map((id) => {
                const tag = tags.find((t) => t.id === id);
                if (!tag) return null;
                return (
                  <SelectedPill
                    key={id}
                    label={tag.name!}
                    color={tag.color}
                    onRemove={() => setTagIds((prev) => prev.filter((x) => x !== id))}
                  />
                );
              })}
              <MultiSelectPopover
                triggerLabel="Tag"
                items={tags.map((t) => ({ id: t.id, label: t.name!, color: t.color }))}
                selectedIds={tagIds}
                onToggle={(id) =>
                  setTagIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
                }
                onCreate={async (name) => {
                  const created = await createTag(name);
                  setTags((prev) => [...prev, created]);
                  return created;
                }}
              />
            </div>
          </div>
        )}

        <Button onClick={submit} disabled={!title.trim()} className="w-full">
          {mode === "task" ? "Add task" : "Create note"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
