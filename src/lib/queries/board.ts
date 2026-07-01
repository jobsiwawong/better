import { db } from "@/lib/db";

export function taskInclude() {
  return {
    tags: { include: { tag: true } },
    owners: { include: { owner: true } },
    subtasks: { orderBy: { order: "asc" as const } },
    attachments: true,
    notes: { include: { note: true } },
  };
}

export async function getBoardData() {
  const [columns, tags, owners, notes] = await Promise.all([
    db.column.findMany({
      orderBy: { order: "asc" },
      include: {
        tasks: {
          where: { archived: false },
          orderBy: { order: "asc" },
          include: taskInclude(),
        },
      },
    }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.owner.findMany({ orderBy: { name: "asc" } }),
    db.note.findMany({
      where: { archived: false },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return { columns, tags, owners, notes };
}

export type BoardData = Awaited<ReturnType<typeof getBoardData>>;
export type BoardTask = BoardData["columns"][number]["tasks"][number];
export type BoardColumn = BoardData["columns"][number];
