import { getNotesData } from "@/lib/queries/notes";
import { NotesShell } from "@/components/notes/notes-shell";

export default async function NotesPage() {
  const { folders, notes, tags } = await getNotesData();

  return (
    <NotesShell folders={folders} notes={notes} tags={tags} selectedNoteId={null} />
  );
}
