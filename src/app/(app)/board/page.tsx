import { getBoardData } from "@/lib/queries/board";
import { KanbanBoardNoSSR } from "@/components/board/kanban-board-client";

export default async function BoardPage() {
  const { columns, tags, owners, notes } = await getBoardData();

  return (
    <div className="flex h-full flex-col">
      <KanbanBoardNoSSR initialColumns={columns} tags={tags} owners={owners} notes={notes} />
    </div>
  );
}
