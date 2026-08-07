import { getNotesData } from "@/lib/queries/notes";
import { NotesShell } from "@/components/notes/notes-shell";

// The shell lives in the layout (not the pages) so it persists across
// /notes and /notes/[noteId] instead of re-mounting on every note open —
// which is what reset the selected folder. The pages themselves render
// nothing; the shell reads the open note id from the URL.
export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { folders, notes, tags } = await getNotesData();

  return (
    <>
      <NotesShell folders={folders} notes={notes} tags={tags} />
      {children}
    </>
  );
}
