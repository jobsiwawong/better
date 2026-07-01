"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskCard } from "@/components/board/task-card";
import type { BoardColumn, BoardTask } from "@/lib/queries/board";

export function KanbanColumn({
  column,
  tasks,
  onOpenTask,
  onQuickAdd,
  onRename,
  onDelete,
  disableTaskDrag,
}: {
  column: BoardColumn;
  tasks: BoardTask[];
  onOpenTask: (task: BoardTask) => void;
  onQuickAdd: (title: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  disableTaskDrag?: boolean;
}) {
  const [editingName, setEditingName] = React.useState(false);
  const [name, setName] = React.useState(column.name);
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
  } = useSortable({ id: column.id, data: { type: "column" } });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column" },
  });

  const submitAdd = () => {
    if (draft.trim()) {
      onQuickAdd(draft.trim());
      setDraft("");
    }
    setAdding(false);
  };

  const submitRename = () => {
    setEditingName(false);
    if (name.trim() && name.trim() !== column.name) onRename(name.trim());
  };

  return (
    <div
      ref={setSortableRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex h-full w-72 shrink-0 flex-col"
    >
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag column"
        >
          <GripVertical className="size-4" />
        </button>
        {editingName ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            className="h-7 flex-1 px-2 text-sm font-semibold"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex-1 truncate text-left text-sm font-semibold text-foreground"
          >
            {column.name}
          </button>
        )}
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6 rounded-lg">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingName(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" /> Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={setDroppableRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto rounded-2xl p-1.5 transition-colors",
          isOver && "bg-accent/40"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={() => onOpenTask(task)}
              disableDrag={disableTaskDrag}
            />
          ))}
        </SortableContext>

        {adding ? (
          <Input
            autoFocus
            value={draft}
            placeholder="Task title…"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submitAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAdd();
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            className="h-9 rounded-xl bg-card text-sm"
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-3.5" /> Add task
          </Button>
        )}
      </div>
    </div>
  );
}
