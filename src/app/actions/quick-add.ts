"use server";

import { db } from "@/lib/db";

export async function getQuickAddOptions() {
  const [columns, tags, owners] = await Promise.all([
    db.column.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.owner.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { columns, tags, owners };
}
