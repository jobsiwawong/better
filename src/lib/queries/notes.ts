import { db } from "@/lib/db";

export async function getNotesData() {
  const [folders, notes, tags, columns] = await Promise.all([
    db.folder.findMany({ orderBy: { name: "asc" } }),
    db.note.findMany({
      where: { archived: false },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      include: {
        tags: { include: { tag: true } },
        tasks: { include: { task: true } },
      },
    }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.column.findMany({ orderBy: { order: "asc" } }),
  ]);

  return { folders, notes, tags, columns };
}

export type NotesData = Awaited<ReturnType<typeof getNotesData>>;
export type NoteWithRelations = NotesData["notes"][number];
