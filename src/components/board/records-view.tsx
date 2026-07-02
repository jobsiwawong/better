"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2, CheckCircle2, Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { RecordsData, RecordTask } from "@/lib/queries/board";
import {
  deleteTaskPermanently,
  restoreTask,
  uncompleteTask,
} from "@/app/actions/tasks";

function timeAgo(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TaskRow({
  task,
  meta,
  actions,
}: {
  task: RecordTask;
  meta: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-card-foreground">
            {task.title}
          </span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {task.column.name}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{meta}</span>
          {task.owners.map((o) => (
            <span key={o.owner.id} className="font-medium">
              · {o.owner.name}
            </span>
          ))}
          {task.tags.map((t) => (
            <span
              key={t.tag.id}
              className="rounded-full px-1.5 py-0.5 font-medium"
              style={{ backgroundColor: `${t.tag.color}22`, color: t.tag.color }}
            >
              {t.tag.name}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </div>
  );
}

export function RecordsView({ completed, deleted }: RecordsData) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const restoreCompleted = (task: RecordTask) => {
    uncompleteTask(task.id).then(refresh);
    toast(`Moved "${task.title}" back to the board`);
  };

  const restoreDeleted = (task: RecordTask) => {
    restoreTask(task.id).then(refresh);
    toast(`Restored "${task.title}"`);
  };

  const deleteForever = (task: RecordTask) => {
    deleteTaskPermanently(task.id).then(refresh);
    toast(`Permanently deleted "${task.title}"`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[#4f7a54]" />
          <h2 className="text-sm font-semibold text-foreground">Completed</h2>
          <span className="text-xs text-muted-foreground">{completed.length}</span>
        </div>
        {completed.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            Nothing completed yet. Check off a task on the board to see it here.
          </p>
        ) : (
          <div className="space-y-2">
            {completed.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                meta={`Completed ${timeAgo(task.completedAt)}`}
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => restoreCompleted(task)}
                  >
                    <RotateCcw className="size-3.5" /> Restore
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Deleted</h2>
          <span className="text-xs text-muted-foreground">{deleted.length}</span>
        </div>
        {deleted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            No deleted tasks.
          </p>
        ) : (
          <div className="space-y-2">
            {deleted.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                meta={`Deleted ${timeAgo(task.deletedAt)}`}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => restoreDeleted(task)}
                    >
                      <RotateCcw className="size-3.5" /> Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label="Delete permanently"
                      title="Delete permanently"
                      onClick={() => deleteForever(task)}
                    >
                      <Trash className="size-3.5" />
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
