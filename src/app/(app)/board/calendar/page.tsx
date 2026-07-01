import { getBoardData } from "@/lib/queries/board";
import { TaskCalendarView } from "@/components/board/task-calendar-view";

export default async function BoardCalendarPage() {
  const { columns, tags, owners, notes } = await getBoardData();

  return <TaskCalendarView columns={columns} tags={tags} owners={owners} notes={notes} />;
}
