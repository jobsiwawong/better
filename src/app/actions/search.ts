"use server";

import { db } from "@/lib/db";

export async function getSearchIndex() {
  const [tasks, notes] = await Promise.all([
    db.task.findMany({
      where: { archived: false },
      select: { id: true, title: true, columnId: true },
    }),
    db.note.findMany({
      where: { archived: false },
      select: { id: true, title: true },
    }),
  ]);
  return { tasks, notes };
}
