"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { SavedViewType } from "@/generated/prisma/enums";

export interface TaskFilters {
  tagIds: string[];
  ownerIds: string[];
  priorities: string[];
  columnIds: string[];
  overdueOnly: boolean;
}

export async function listSavedViews(type: SavedViewType) {
  const views = await db.savedView.findMany({
    where: { type },
    orderBy: { createdAt: "asc" },
  });
  return views.map((v) => ({ ...v, filters: JSON.parse(v.filters) as TaskFilters }));
}

export async function createSavedView(
  name: string,
  type: SavedViewType,
  filters: TaskFilters
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");
  const view = await db.savedView.create({
    data: { name: trimmed, type, filters: JSON.stringify(filters) },
  });
  revalidatePath("/board/list");
  return view;
}

export async function deleteSavedView(id: string) {
  await db.savedView.delete({ where: { id } });
  revalidatePath("/board/list");
}
