"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, CornerLeftUp, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  MultiSelectPopover,
  SelectedPill,
} from "@/components/board/multi-select-popover";
import type { BoardColumn, BoardTask } from "@/lib/queries/board";
import {
  addAttachment,
  addSubtask,
  archiveTask,
  completeTask,
  deleteSubtask,
  linkNoteToTask,
  moveTask,
  nestTask,
  removeAttachment,
  restoreTask,
  toggleSubtask,
  uncompleteTask,
  unlinkNoteFromTask,
  unnestTask,
  updateTask,
} from "@/app/actions/tasks";
import { createTag } from "@/app/actions/tags";
import { createOwner } from "@/app/actions/owners";
import { pushUndo, undoSpecific } from "@/lib/undo-store";
import { fireConfetti } from "@/lib/confetti";
import { openManageLabels } from "@/components/app-shell/manage-labels-dialog";
import type { BoardChildTask } from "@/lib/queries/board";

interface TagLite {
  id: string;
  name: string;
  color: string;
}
interface OwnerLite {
  id: string;
  name: string;
}
interface NoteLite {
  id: string;
  title: string;
}

function toDateInputValue(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export function TaskModal({
  task,
  columns,
  allTags,
  allOwners,
  allNotes,
  open,
  onOpenChange,
}: {
  task: BoardTask | BoardChildTask;
  columns: BoardColumn[];
  allTags: TagLite[];
  allOwners: OwnerLite[];
  allNotes: NoteLite[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(task.title);
  const [dueDate, setDueDate] = React.useState(toDateInputValue(task.dueDate));
  const [dueTime, setDueTime] = React.useState(task.dueTime ?? "");
  const [priority, setPriority] = React.useState(task.priority);
  const [columnId, setColumnId] = React.useState(task.columnId);
  const [recurrenceType, setRecurrenceType] = React.useState(task.recurrenceType);
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(
    task.recurrenceInterval ?? 1
  );
  const [tagIds, setTagIds] = React.useState(task.tags.map((t) => t.tag.id));
  const [ownerIds, setOwnerIds] = React.useState(task.owners.map((o) => o.owner.id));
  const [noteIds, setNoteIds] = React.useState(task.notes.map((n) => n.note.id));
  const [subtaskDraft, setSubtaskDraft] = React.useState("");
  const [attachmentLabel, setAttachmentLabel] = React.useState("");
  const [attachmentUrl, setAttachmentUrl] = React.useState("");
  const [tags, setTags] = React.useState(allTags);
  const [owners, setOwners] = React.useState(allOwners);

  const refresh = () => router.refresh();

  const commitField = (patch: Parameters<typeof updateTask>[1]) => {
    updateTask(task.id, patch).then(refresh);
  };

  // Commit a field change and register it on the global ⌘Z stack.
  function undoableField<T>(
    label: string,
    prev: T,
    next: T,
    setLocal: (v: T) => void,
    toPatch: (v: T) => Parameters<typeof updateTask>[1]
  ) {
    setLocal(next);
    updateTask(task.id, toPatch(next)).then(refresh);
    pushUndo({
      label,
      undo: () => {
        setLocal(prev);
        return updateTask(task.id, toPatch(prev)).then(refresh);
      },
      redo: () => {
        setLocal(next);
        return updateTask(task.id, toPatch(next)).then(refresh);
      },
    });
  }

  const commitTitle = () => {
    const next = title.trim();
    if (next && next !== task.title) {
      undoableField(`title of "${task.title}"`, task.title, next, setTitle, (v) => ({
        title: v,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit task</DialogTitle>
        </DialogHeader>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          className="h-auto border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          placeholder="Task title"
        />

        <RichTextEditor
          content={task.description}
          onChange={(json) => commitField({ description: JSON.stringify(json) })}
          placeholder="Add a description…"
          variant="basic"
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) =>
                undoableField("due date", dueDate, e.target.value, setDueDate, (v) => ({
                  dueDate: v || null,
                }))
              }
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Time</Label>
            <Input
              type="time"
              value={dueTime}
              onChange={(e) =>
                undoableField("due time", dueTime, e.target.value, setDueTime, (v) => ({
                  dueTime: v || null,
                }))
              }
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <Select
              value={priority}
              onValueChange={(v: typeof priority) =>
                undoableField("priority", priority, v, setPriority, (p) => ({
                  priority: p,
                }))
              }
            >
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select
              value={columnId}
              onValueChange={(v) => {
                const prevCol = columnId;
                const prevOrder = task.order;
                setColumnId(v);
                moveTask(task.id, v, 0).then(refresh);
                pushUndo({
                  label: "status change",
                  undo: () => {
                    setColumnId(prevCol);
                    return moveTask(task.id, prevCol, prevOrder).then(refresh);
                  },
                  redo: () => {
                    setColumnId(v);
                    return moveTask(task.id, v, 0).then(refresh);
                  },
                });
              }}
            >
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
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Recurrence</Label>
            <Select
              value={recurrenceType}
              onValueChange={(v: typeof recurrenceType) =>
                undoableField("recurrence", recurrenceType, v, setRecurrenceType, (r) => ({
                  recurrenceType: r,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {recurrenceType !== "NONE" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Every</Label>
              <Input
                type="number"
                min={1}
                value={recurrenceInterval}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1;
                  setRecurrenceInterval(v);
                  commitField({ recurrenceInterval: v });
                }}
                className="h-9"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Owners</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {ownerIds.map((id) => {
              const owner = owners.find((o) => o.id === id);
              if (!owner) return null;
              return (
                <SelectedPill
                  key={id}
                  label={owner.name}
                  onRemove={() =>
                    undoableField(
                      "owners",
                      ownerIds,
                      ownerIds.filter((x) => x !== id),
                      setOwnerIds,
                      (v) => ({ ownerIds: v })
                    )
                  }
                />
              );
            })}
            <MultiSelectPopover
              triggerLabel="Owner"
              items={owners.map((o) => ({ id: o.id, label: o.name }))}
              selectedIds={ownerIds}
              onToggle={(id) =>
                undoableField(
                  "owners",
                  ownerIds,
                  ownerIds.includes(id)
                    ? ownerIds.filter((x) => x !== id)
                    : [...ownerIds, id],
                  setOwnerIds,
                  (v) => ({ ownerIds: v })
                )
              }
              onCreate={async (name) => {
                const created = await createOwner(name);
                setOwners((prev) => [...prev, created]);
                return created;
              }}
              onManage={() => openManageLabels("people")}
              manageLabel="Edit people…"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Team tags</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {tagIds.map((id) => {
              const tag = tags.find((t) => t.id === id);
              if (!tag) return null;
              return (
                <SelectedPill
                  key={id}
                  label={tag.name}
                  color={tag.color}
                  onRemove={() =>
                    undoableField(
                      "tags",
                      tagIds,
                      tagIds.filter((x) => x !== id),
                      setTagIds,
                      (v) => ({ tagIds: v })
                    )
                  }
                />
              );
            })}
            <MultiSelectPopover
              triggerLabel="Tag"
              items={tags.map((t) => ({ id: t.id, label: t.name, color: t.color }))}
              selectedIds={tagIds}
              onToggle={(id) =>
                undoableField(
                  "tags",
                  tagIds,
                  tagIds.includes(id)
                    ? tagIds.filter((x) => x !== id)
                    : [...tagIds, id],
                  setTagIds,
                  (v) => ({ tagIds: v })
                )
              }
              onCreate={async (name) => {
                const created = await createTag(name);
                setTags((prev) => [...prev, created]);
                return created;
              }}
              onManage={() => openManageLabels("tags")}
              manageLabel="Edit tags…"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Subtasks</Label>
          <div className="space-y-1.5">
            {task.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Checkbox
                  checked={s.completed}
                  onCheckedChange={() => toggleSubtask(s.id).then(refresh)}
                />
                <span
                  className={
                    s.completed ? "flex-1 text-sm text-muted-foreground line-through" : "flex-1 text-sm"
                  }
                >
                  {s.title}
                </span>
                <button
                  onClick={() => {
                    deleteSubtask(s.id).then(refresh);
                    // Undo recreates the subtask, so track the fresh id for redo.
                    const ref = { id: s.id };
                    pushUndo({
                      label: `delete subtask "${s.title}"`,
                      undo: async () => {
                        const created = await addSubtask(task.id, s.title);
                        if (s.completed) await toggleSubtask(created.id);
                        ref.id = created.id;
                        refresh();
                      },
                      redo: async () => {
                        await deleteSubtask(ref.id);
                        refresh();
                      },
                    });
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete subtask"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                placeholder="Add a sub-step…"
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && subtaskDraft.trim()) {
                    addSubtask(task.id, subtaskDraft.trim()).then(refresh);
                    setSubtaskDraft("");
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => {
                  if (subtaskDraft.trim()) {
                    addSubtask(task.id, subtaskDraft.trim()).then(refresh);
                    setSubtaskDraft("");
                  }
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Attachments & links</Label>
          <div className="space-y-1.5">
            {task.attachments.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-primary underline-offset-2 hover:underline"
                >
                  {a.label}
                </a>
                <button
                  onClick={() => {
                    removeAttachment(a.id).then(refresh);
                    const ref = { id: a.id };
                    pushUndo({
                      label: `remove attachment "${a.label}"`,
                      undo: async () => {
                        const created = await addAttachment(task.id, a.label, a.url);
                        ref.id = created.id;
                        refresh();
                      },
                      redo: async () => {
                        await removeAttachment(ref.id);
                        refresh();
                      },
                    });
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove attachment"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={attachmentLabel}
                onChange={(e) => setAttachmentLabel(e.target.value)}
                placeholder="Label"
                className="h-8 w-1/3 text-sm"
              />
              <Input
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://…"
                className="h-8 flex-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && attachmentUrl.trim()) {
                    addAttachment(task.id, attachmentLabel, attachmentUrl).then(refresh);
                    setAttachmentLabel("");
                    setAttachmentUrl("");
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => {
                  if (attachmentUrl.trim()) {
                    addAttachment(task.id, attachmentLabel, attachmentUrl).then(refresh);
                    setAttachmentLabel("");
                    setAttachmentUrl("");
                  }
                }}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Linked notes</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {noteIds.map((id) => {
              const note = allNotes.find((n) => n.id === id);
              if (!note) return null;
              return (
                <SelectedPill
                  key={id}
                  label={note.title}
                  onRemove={() => {
                    setNoteIds((prev) => prev.filter((x) => x !== id));
                    unlinkNoteFromTask(task.id, id).then(refresh);
                  }}
                />
              );
            })}
            <MultiSelectPopover
              triggerLabel="Note"
              items={allNotes.map((n) => ({ id: n.id, label: n.title }))}
              selectedIds={noteIds}
              onToggle={(id) => {
                if (noteIds.includes(id)) {
                  setNoteIds((prev) => prev.filter((x) => x !== id));
                  unlinkNoteFromTask(task.id, id).then(refresh);
                } else {
                  setNoteIds((prev) => [...prev, id]);
                  linkNoteToTask(task.id, id).then(refresh);
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="gap-1.5 text-primary hover:text-primary"
              onClick={(e) => {
                const title = task.title;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                fireConfetti(rect.left + rect.width / 2, rect.top);
                completeTask(task.id).then(() => {
                  onOpenChange(false);
                  refresh();
                  const entry = pushUndo({
                    label: `complete "${title}"`,
                    undo: () => uncompleteTask(task.id).then(refresh),
                    redo: () => completeTask(task.id).then(refresh),
                  });
                  toast(`Completed "${title}" 🎉`, {
                    action: { label: "Undo", onClick: () => undoSpecific(entry) },
                  });
                });
              }}
            >
              <Check className="size-3.5" /> Mark complete
            </Button>
            {"parentId" in task && task.parentId && (
              <Button
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
                onClick={() => {
                  const parentId = task.parentId as string;
                  unnestTask(task.id).then(refresh);
                  onOpenChange(false);
                  pushUndo({
                    label: `un-nest "${task.title}"`,
                    undo: () => nestTask(task.id, parentId).then(refresh),
                    redo: () => unnestTask(task.id).then(refresh),
                  });
                }}
              >
                <CornerLeftUp className="size-3.5" /> Un-nest
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => {
              const title = task.title;
              archiveTask(task.id).then(() => {
                onOpenChange(false);
                refresh();
                const entry = pushUndo({
                  label: `delete "${title}"`,
                  undo: () => restoreTask(task.id).then(refresh),
                  redo: () => archiveTask(task.id).then(refresh),
                });
                toast(`Deleted "${title}"`, {
                  action: {
                    label: "Undo",
                    onClick: () => undoSpecific(entry),
                  },
                });
              });
            }}
          >
            <Trash2 className="size-3.5" /> Delete task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
