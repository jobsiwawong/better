"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskModal } from "@/components/board/task-modal";
import {
  EMPTY_FILTERS,
  TaskFilterBar,
  applyFilters,
} from "@/components/board/task-filter-bar";
import {
  createSavedView,
  deleteSavedView,
  type TaskFilters,
} from "@/app/actions/saved-views";
import type { BoardData, BoardColumn } from "@/lib/queries/board";
import { useTaskUrlParam } from "@/lib/use-task-url-param";

type SortField = "title" | "owner" | "priority" | "dueDate" | "status";
type SortDir = "asc" | "desc";

const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function isDoneColumn(name: string) {
  return /\b(done|complete|completed|shipped)\b/i.test(name);
}

function isOverdue(task: { dueDate: Date | string | null }) {
  if (!task.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate) < today;
}

export function TaskListView({
  columns,
  tags,
  owners,
  notes,
  savedViews,
}: {
  columns: BoardColumn[];
  tags: BoardData["tags"];
  owners: BoardData["owners"];
  notes: BoardData["notes"];
  savedViews: { id: string; name: string; filters: TaskFilters }[];
}) {
  const router = useRouter();
  const [filters, setFilters] = React.useState<TaskFilters>(EMPTY_FILTERS);
  const [sortField, setSortField] = React.useState<SortField>("dueDate");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [selectedTaskId, setSelectedTaskId] = useTaskUrlParam();

  const columnById = React.useMemo(
    () => new Map(columns.map((c) => [c.id, c])),
    [columns]
  );

  const allTasks = React.useMemo(
    () => columns.flatMap((c) => c.tasks.flatMap((t) => [t, ...t.children])),
    [columns]
  );

  const filtered = React.useMemo(
    () => applyFilters(allTasks, filters),
    [allTasks, filters]
  );

  const sorted = React.useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortField) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "priority":
          return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * dir;
        case "owner": {
          const an = a.owners[0]?.owner.name ?? "";
          const bn = b.owners[0]?.owner.name ?? "";
          return an.localeCompare(bn) * dir;
        }
        case "status": {
          const an = columnById.get(a.columnId)?.name ?? "";
          const bn = columnById.get(b.columnId)?.name ?? "";
          return an.localeCompare(bn) * dir;
        }
        case "dueDate":
        default: {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1 * dir;
          if (!b.dueDate) return -1 * dir;
          return (
            (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir
          );
        }
      }
    });
    return copy;
  }, [filtered, sortField, sortDir, columnById]);

  const selectedTask = React.useMemo(
    () => allTasks.find((t) => t.id === selectedTaskId) ?? null,
    [allTasks, selectedTaskId]
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="size-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <TaskFilterBar
        filters={filters}
        onChange={setFilters}
        tags={tags}
        owners={owners}
        columns={columns}
        savedViews={savedViews}
        onApplyView={setFilters}
        onSaveView={(name) =>
          createSavedView(name, "LIST", filters).then(() => router.refresh())
        }
        onDeleteView={(id) => deleteSavedView(id).then(() => router.refresh())}
      />

      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <Th onClick={() => toggleSort("title")}>
                Title {renderSortIcon("title")}
              </Th>
              <Th onClick={() => toggleSort("owner")}>
                Owner {renderSortIcon("owner")}
              </Th>
              <th className="px-3 py-2 font-medium">Tags</th>
              <Th onClick={() => toggleSort("priority")}>
                Priority {renderSortIcon("priority")}
              </Th>
              <Th onClick={() => toggleSort("dueDate")}>
                Due date {renderSortIcon("dueDate")}
              </Th>
              <Th onClick={() => toggleSort("status")}>
                Status {renderSortIcon("status")}
              </Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => {
              const overdue = isOverdue(task);
              return (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="cursor-pointer rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <td className="rounded-l-2xl px-3 py-3 font-medium text-card-foreground">
                    {task.parentId && (
                      <span className="mr-1 text-muted-foreground" title="Sub-task">
                        ↳
                      </span>
                    )}
                    {task.title}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {task.owners.map((o) => o.owner.name).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((t) => (
                        <span
                          key={t.tag.id}
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${t.tag.color}22`,
                            color: t.tag.color,
                          }}
                        >
                          {t.tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-3",
                      overdue ? "font-semibold text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="rounded-r-2xl px-3 py-3">
                    {(() => {
                      const name = columnById.get(task.columnId)?.name ?? "";
                      return (
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            isDoneColumn(name)
                              ? "bg-[#7a9e7e]/20 text-[#4f7a54]"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {name}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            No tasks match these filters.
          </p>
        )}
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

function Th({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-2 font-medium">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
      </button>
    </th>
  );
}
