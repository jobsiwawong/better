"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, CheckSquare, CornerLeftUp, Link2, NotebookText } from "lucide-react";
import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import type { BoardTask, BoardChildTask } from "@/lib/queries/board";

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-destructive",
  MEDIUM: "bg-primary",
  LOW: "bg-muted-foreground/40",
};

function isOverdue(task: { dueDate: Date | string | null }) {
  if (!task.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}

// A round check button; fires confetti from its own position on complete.
function CompleteButton({
  onComplete,
  size = "md",
}: {
  onComplete: () => void;
  size?: "md" | "sm";
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Mark complete"
      onClick={(e) => {
        e.stopPropagation();
        const rect = ref.current?.getBoundingClientRect();
        if (rect) fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        onComplete();
      }}
      className={cn(
        "group/check flex shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-transparent transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground",
        size === "md" ? "size-5" : "size-4"
      )}
    >
      <Check className={size === "md" ? "size-3" : "size-2.5"} strokeWidth={3.5} />
    </button>
  );
}

function ChildRow({
  child,
  onOpen,
  onComplete,
  onUnnest,
}: {
  child: BoardChildTask;
  onOpen: () => void;
  onComplete: () => void;
  onUnnest: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className="group/child flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs hover:bg-accent/50"
    >
      <CompleteButton size="sm" onComplete={onComplete} />
      <span className="min-w-0 flex-1 truncate">{child.title}</span>
      {child.dueDate && (
        <span
          className={cn(
            "shrink-0 text-[10px]",
            isOverdue(child) ? "font-semibold text-destructive" : "text-muted-foreground"
          )}
        >
          {new Date(child.dueDate).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
      <button
        type="button"
        aria-label="Move out of parent"
        title="Un-nest"
        onClick={(e) => {
          e.stopPropagation();
          onUnnest();
        }}
        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/child:opacity-100"
      >
        <CornerLeftUp className="size-3" />
      </button>
    </div>
  );
}

export function TaskCard({
  task,
  onOpenTask,
  onCompleteTask,
  onUnnestTask,
  disableDrag,
  nestActive,
}: {
  task: BoardTask;
  onOpenTask: (task: BoardTask | BoardChildTask) => void;
  onCompleteTask: (task: BoardTask | BoardChildTask) => void;
  onUnnestTask: (task: BoardChildTask) => void;
  disableDrag?: boolean;
  /** True when a different task is being dragged and could nest here. */
  nestActive?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: "task", columnId: task.columnId },
      disabled: disableDrag,
    });

  // Center-band droppable that captures "drop onto this card to nest".
  const { setNodeRef: setNestRef, isOver: isNestOver } = useDroppable({
    id: `nest:${task.id}`,
    data: { type: "nest", taskId: task.id },
  });

  const overdue = isOverdue(task);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const children = task.children ?? [];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpenTask(task)}
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <CompleteButton onComplete={() => onCompleteTask(task)} />
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span
            className={cn(
              "mt-1.5 size-1.5 shrink-0 rounded-full",
              PRIORITY_STYLES[task.priority]
            )}
            title={`${task.priority} priority`}
          />
          <p className="min-w-0 flex-1 cursor-pointer text-sm font-medium leading-snug text-card-foreground">
            {task.title}
          </p>
        </div>
      </div>

      {(task.owners.length > 0 || task.tags.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-7 text-xs">
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

      <div className="mt-2.5 flex items-center gap-3 pl-7 text-xs text-muted-foreground">
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

      {children.length > 0 && (
        <div className="mt-2 space-y-0.5 border-l-2 border-border pl-2">
          {children.map((child) => (
            <ChildRow
              key={child.id}
              child={child}
              onOpen={() => onOpenTask(child)}
              onComplete={() => onCompleteTask(child)}
              onUnnest={() => onUnnestTask(child)}
            />
          ))}
        </div>
      )}

      {/* Drop-to-nest target: middle band only, so top/bottom edges still reorder. */}
      {nestActive && (
        <div
          ref={setNestRef}
          className={cn(
            "pointer-events-none absolute inset-x-0 top-1/4 z-10 flex h-1/2 items-center justify-center rounded-xl border-2 border-dashed border-transparent transition-colors",
            isNestOver && "border-primary bg-primary/10"
          )}
        >
          {isNestOver && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              Drop to nest
            </span>
          )}
        </div>
      )}
    </div>
  );
}
