"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, Link2, NotebookText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardTask } from "@/lib/queries/board";

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-destructive",
  MEDIUM: "bg-primary",
  LOW: "bg-muted-foreground/40",
};

function isOverdue(task: BoardTask) {
  if (!task.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}

export function TaskCard({
  task,
  onOpen,
  disableDrag,
}: {
  task: BoardTask;
  onOpen: () => void;
  disableDrag?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: "task", columnId: task.columnId },
      disabled: disableDrag,
    });

  const overdue = isOverdue(task);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1.5 size-1.5 shrink-0 rounded-full",
            PRIORITY_STYLES[task.priority]
          )}
          title={`${task.priority} priority`}
        />
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-card-foreground">
          {task.title}
        </p>
      </div>

      {(task.owners.length > 0 || task.tags.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-3.5 text-xs">
          {task.owners.map((o) => (
            <span key={o.owner.id} className="font-medium text-muted-foreground">
              {o.owner.name}
            </span>
          ))}
          {task.tags.map((t) => (
            <span
              key={t.tag.id}
              className="rounded-full px-2 py-0.5 font-medium"
              style={{ backgroundColor: `${t.tag.color}22`, color: t.tag.color }}
            >
              {t.tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-3 pl-3.5 text-xs text-muted-foreground">
        {task.dueDate && (
          <span className={cn(overdue && "font-semibold text-destructive")}>
            {new Date(task.dueDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="size-3" />
            {completedSubtasks}/{task.subtasks.length}
          </span>
        )}
        {task.notes.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <NotebookText className="size-3" />
            {task.notes.length}
          </span>
        )}
        {task.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Link2 className="size-3" />
            {task.attachments.length}
          </span>
        )}
      </div>
    </div>
  );
}
