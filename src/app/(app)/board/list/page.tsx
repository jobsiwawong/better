import { getBoardData } from "@/lib/queries/board";
import { listSavedViews } from "@/app/actions/saved-views";
import { TaskListView } from "@/components/board/task-list-view";

export default async function BoardListPage() {
  const [{ columns, tags, owners, notes }, savedViews] = await Promise.all([
    getBoardData(),
    listSavedViews("LIST"),
  ]);

  return (
    <TaskListView
      columns={columns}
      tags={tags}
      owners={owners}
      notes={notes}
      savedViews={savedViews}
    />
  );
}
