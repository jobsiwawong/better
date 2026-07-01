"use client";

import dynamic from "next/dynamic";

export const KanbanBoardNoSSR = dynamic(
  () => import("@/components/board/kanban-board").then((m) => m.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading board…
      </div>
    ),
  }
);
