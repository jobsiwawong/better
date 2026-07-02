"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/board/task-modal";
import type { BoardData, BoardColumn, BoardChildTask, BoardTask } from "@/lib/queries/board";
import { createTask } from "@/app/actions/tasks";
import { pushUndo } from "@/lib/undo-store";
import { archiveTask, restoreTask } from "@/app/actions/tasks";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function TaskCalendarView({
  columns,
  tags,
  owners,
  notes,
}: {
  columns: BoardColumn[];
  tags: BoardData["tags"];
  owners: BoardData["owners"];
  notes: BoardData["notes"];
}) {
  const router = useRouter();
  const [cursor, setCursor] = React.useState(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [addingDay, setAddingDay] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  const allTasks = React.useMemo(
    () => columns.flatMap((c) => c.tasks.flatMap((t) => [t, ...t.children])),
    [columns]
  );
  const selectedTask: BoardTask | BoardChildTask | null = React.useMemo(
    () => allTasks.find((t) => t.id === selectedTaskId) ?? null,
    [allTasks, selectedTaskId]
  );

  const addTaskOnDay = async (day: Date) => {
    const title = draft.trim();
    const columnId = columns[0]?.id;
    if (!title || !columnId) {
      setAddingDay(null);
      setDraft("");
      return;
    }
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    // Noon-local avoids the task landing on the previous day in negative tz.
    const dueDate = `${y}-${m}-${d}T12:00:00`;
    setDraft("");
    setAddingDay(null);
    const created = await createTask({ title, columnId, dueDate });
    router.refresh();
    pushUndo({
      label: `create "${created.title}"`,
      undo: () => archiveTask(created.id).then(() => router.refresh()),
      redo: () => restoreTask(created.id).then(() => router.refresh()),
    });
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const gridDays = React.useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [year, month]);

  const tasksByDay = React.useMemo(() => {
    const map = new Map<string, (BoardTask | BoardChildTask)[]>();
    for (const task of allTasks) {
      if (!task.dueDate) continue;
      const key = new Date(task.dueDate).toDateString();
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [allTasks]);

  const today = new Date();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs"
            onClick={() => setCursor(new Date())}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border px-6 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 gap-px overflow-y-auto bg-border px-6 pb-4">
        {gridDays.map((day) => {
          const inMonth = day.getMonth() === month;
          const dayTasks = tasksByDay.get(day.toDateString()) ?? [];
          const isToday = sameDay(day, today);
          const dayKey = day.toDateString();
          const isAdding = addingDay === dayKey;
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "group/day min-h-28 space-y-1 bg-background p-1.5",
                !inMonth && "opacity-40"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-xs",
                    isToday && "bg-primary font-semibold text-primary-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
                <button
                  type="button"
                  aria-label={`Add task on ${day.toLocaleDateString()}`}
                  onClick={() => {
                    setDraft("");
                    setAddingDay(dayKey);
                  }}
                  className="rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus:opacity-100 group-hover/day:opacity-100"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {isAdding && (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => addTaskOnDay(day)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTaskOnDay(day);
                      if (e.key === "Escape") {
                        setDraft("");
                        setAddingDay(null);
                      }
                    }}
                    placeholder="Task title…"
                    className="w-full rounded-lg border border-border bg-card px-1.5 py-0.5 text-xs outline-none focus:border-primary"
                  />
                )}
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="block w-full truncate rounded-lg px-1.5 py-0.5 text-left text-xs font-medium hover:opacity-80"
                    style={{
                      backgroundColor: task.tags[0]
                        ? `${task.tags[0].tag.color}22`
                        : "var(--muted)",
                      color: task.tags[0] ? task.tags[0].tag.color : "var(--muted-foreground)",
                    }}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="block px-1.5 text-xs text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskModal
          key={selectedTask.id}
          task={selectedTask}
          columns={columns}
          allTags={tags}
          allOwners={owners}
          allNotes={notes}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
