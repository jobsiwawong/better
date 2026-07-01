"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowDownWideNarrow, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { KanbanColumn } from "@/components/board/kanban-column";
import { TaskModal } from "@/components/board/task-modal";
import type { BoardData, BoardColumn, BoardTask } from "@/lib/queries/board";
import { quickCreateTask, moveTask } from "@/app/actions/tasks";
import { createColumn, deleteColumn, renameColumn, reorderColumns } from "@/app/actions/columns";

export function KanbanBoard({
  initialColumns,
  tags,
  owners,
  notes,
}: {
  initialColumns: BoardData["columns"];
  tags: BoardData["tags"];
  owners: BoardData["owners"];
  notes: BoardData["notes"];
}) {
  const router = useRouter();
  const [columns, setColumns] = React.useState<BoardColumn[]>(initialColumns);
  const [syncedInitialColumns, setSyncedInitialColumns] = React.useState(initialColumns);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [sortByDueDate, setSortByDueDate] = React.useState(false);
  const [addingColumn, setAddingColumn] = React.useState(false);
  const [newColumnName, setNewColumnName] = React.useState("");

  if (initialColumns !== syncedInitialColumns) {
    setSyncedInitialColumns(initialColumns);
    setColumns(initialColumns);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const displayColumns = React.useMemo(() => {
    if (!sortByDueDate) return columns;
    return columns.map((c) => ({
      ...c,
      tasks: [...c.tasks].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }),
    }));
  }, [columns, sortByDueDate]);

  const selectedTask: BoardTask | null = React.useMemo(() => {
    if (!selectedTaskId) return null;
    for (const c of columns) {
      const found = c.tasks.find((t) => t.id === selectedTaskId);
      if (found) return found;
    }
    return null;
  }, [columns, selectedTaskId]);

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type !== "task") return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setColumns((prev) => {
      const sourceCol = prev.find((c) => c.tasks.some((t) => t.id === activeId));
      if (!sourceCol) return prev;

      const overIsColumn = prev.some((c) => c.id === overId);
      const destCol = overIsColumn
        ? prev.find((c) => c.id === overId)!
        : prev.find((c) => c.tasks.some((t) => t.id === overId));
      if (!destCol) return prev;
      if (sourceCol.id === destCol.id && overIsColumn) return prev;

      const activeTask = sourceCol.tasks.find((t) => t.id === activeId)!;
      const newSourceTasks = sourceCol.tasks.filter((t) => t.id !== activeId);
      const destTasksBase =
        sourceCol.id === destCol.id ? newSourceTasks : [...destCol.tasks];
      const overIndex = overIsColumn
        ? destTasksBase.length
        : destTasksBase.findIndex((t) => t.id === overId);
      const insertIndex = overIndex < 0 ? destTasksBase.length : overIndex;
      const newDestTasks = [...destTasksBase];
      newDestTasks.splice(insertIndex, 0, { ...activeTask, columnId: destCol.id });

      return prev.map((c) => {
        if (c.id === sourceCol.id && c.id === destCol.id) return { ...c, tasks: newDestTasks };
        if (c.id === sourceCol.id) return { ...c, tasks: newSourceTasks };
        if (c.id === destCol.id) return { ...c, tasks: newDestTasks };
        return c;
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "column") {
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;
      setColumns((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === activeId);
        const newIndex = prev.findIndex((c) => c.id === overId);
        if (oldIndex < 0 || newIndex < 0) return prev;
        const reordered = arrayMove(prev, oldIndex, newIndex);
        reorderColumns(reordered.map((c) => c.id));
        return reordered;
      });
      return;
    }

    const activeId = String(active.id);
    const destCol = columns.find((c) => c.tasks.some((t) => t.id === activeId));
    if (!destCol) return;
    const index = destCol.tasks.findIndex((t) => t.id === activeId);
    const before = destCol.tasks[index - 1];
    const after = destCol.tasks[index + 1];
    let newOrder: number;
    if (!before && !after) newOrder = 0;
    else if (!before) newOrder = after.order - 1;
    else if (!after) newOrder = before.order + 1;
    else newOrder = (before.order + after.order) / 2;

    moveTask(activeId, destCol.id, newOrder).then(() => router.refresh());
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-border px-6 py-3">
        <Toggle
          pressed={sortByDueDate}
          onPressedChange={setSortByDueDate}
          className="gap-1.5 rounded-full text-xs"
        >
          <ArrowDownWideNarrow className="size-3.5" />
          Sort by due date
        </Toggle>
      </div>

      <DndContext
        id="board-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-4">
          <SortableContext
            items={displayColumns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {displayColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={column.tasks}
                disableTaskDrag={sortByDueDate}
                onOpenTask={(task) => setSelectedTaskId(task.id)}
                onQuickAdd={(title) =>
                  quickCreateTask(title, column.id).then(() => router.refresh())
                }
                onRename={(name) => renameColumn(column.id, name).then(() => router.refresh())}
                onDelete={() => deleteColumn(column.id).then(() => router.refresh())}
              />
            ))}
          </SortableContext>

          <div className="w-72 shrink-0">
            {addingColumn ? (
              <input
                autoFocus
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onBlur={() => {
                  if (newColumnName.trim()) {
                    createColumn(newColumnName.trim()).then(() => router.refresh());
                  }
                  setNewColumnName("");
                  setAddingColumn(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") {
                    setNewColumnName("");
                    setAddingColumn(false);
                  }
                }}
                placeholder="Column name…"
                className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none"
              />
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => setAddingColumn(true)}
              >
                <Plus className="size-4" /> Add column
              </Button>
            )}
          </div>
        </div>
      </DndContext>

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
