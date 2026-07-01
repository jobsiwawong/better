"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createColumn(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Column name is required");

  const maxOrder = await db.column.aggregate({ _max: { order: true } });
  const column = await db.column.create({
    data: { name: trimmed, order: (maxOrder._max.order ?? -1) + 1 },
  });
  revalidatePath("/board");
  return column;
}

export async function renameColumn(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Column name is required");
  await db.column.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/board");
}

export async function recolorColumn(id: string, color: string | null) {
  await db.column.update({ where: { id }, data: { color } });
  revalidatePath("/board");
}

export async function reorderColumns(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.column.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/board");
}

export async function deleteColumn(id: string) {
  const columns = await db.column.findMany({ orderBy: { order: "asc" } });
  const fallback = columns.find((c) => c.id !== id);

  if (fallback) {
    await db.task.updateMany({
      where: { columnId: id },
      data: { columnId: fallback.id },
    });
  }

  await db.column.delete({ where: { id } });
  revalidatePath("/board");
}
