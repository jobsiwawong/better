import { getRecordsData } from "@/lib/queries/board";
import { RecordsView } from "@/components/board/records-view";

export default async function BoardRecordsPage() {
  const { completed, deleted } = await getRecordsData();
  return <RecordsView completed={completed} deleted={deleted} />;
}
