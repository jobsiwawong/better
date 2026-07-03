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

export function taskIncludeWithChildren() {
  return {
    ...taskInclude(),
    children: {
      where: { archived: false },
      orderBy: { order: "asc" as const },
      include: taskInclude(),
    },
  };
}

export async function getBoardData() {
  const [columns, tags, owners, notes] = await Promise.all([
    db.column.findMany({
      orderBy: { order: "asc" },
      include: {
        tasks: {
          // Top-level tasks; completed ones stay visible (they live in the
          // done column). Only nested and deleted tasks are excluded here.
          where: { archived: false, parentId: null },
          orderBy: { order: "asc" },
          include: taskIncludeWithChildren(),
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

export async function getRecordsData() {
  const include = {
    column: true,
    tags: { include: { tag: true } },
    owners: { include: { owner: true } },
  };
  const [completed, deleted] = await Promise.all([
    db.task.findMany({
      where: { completed: true, archived: false },
      include,
      orderBy: { completedAt: "desc" },
    }),
    db.task.findMany({
      where: { archived: true },
      include,
      orderBy: { deletedAt: "desc" },
    }),
  ]);
  return { completed, deleted };
}

export type BoardData = Awaited<ReturnType<typeof getBoardData>>;
export type BoardTask = BoardData["columns"][number]["tasks"][number];
export type BoardChildTask = BoardTask["children"][number];
export type BoardColumn = BoardData["columns"][number];

export type RecordsData = Awaited<ReturnType<typeof getRecordsData>>;
export type RecordTask = RecordsData["completed"][number];
