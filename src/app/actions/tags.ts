"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const PALETTE = [
  "#c17a52",
  "#7a9e7e",
  "#b08bbb",
  "#c2685f",
  "#d4a24c",
  "#6a94a8",
  "#9a8c78",
  "#a97fa0",
];

export async function createTag(name: string, color?: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required");

  const existing = await db.tag.findUnique({ where: { name: trimmed } });
  if (existing) return existing;

  const count = await db.tag.count();
  const tag = await db.tag.create({
    data: { name: trimmed, color: color ?? PALETTE[count % PALETTE.length] },
  });
  revalidatePath("/board");
  revalidatePath("/notes");
  return tag;
}

export async function updateTag(id: string, data: { name?: string; color?: string }) {
  const tag = await db.tag.update({ where: { id }, data });
  revalidatePath("/board");
  revalidatePath("/notes");
  return tag;
}

export async function deleteTag(id: string) {
  await db.tag.delete({ where: { id } });
  revalidatePath("/board");
  revalidatePath("/notes");
}

export async function mergeTags(fromId: string, intoId: string) {
  if (fromId === intoId) return;

  const [fromTaskTags, fromNoteTags] = await Promise.all([
    db.taskTag.findMany({ where: { tagId: fromId } }),
    db.noteTag.findMany({ where: { tagId: fromId } }),
  ]);

  for (const tt of fromTaskTags) {
    await db.taskTag.upsert({
      where: { taskId_tagId: { taskId: tt.taskId, tagId: intoId } },
      create: { taskId: tt.taskId, tagId: intoId },
      update: {},
    });
  }
  for (const nt of fromNoteTags) {
    await db.noteTag.upsert({
      where: { noteId_tagId: { noteId: nt.noteId, tagId: intoId } },
      create: { noteId: nt.noteId, tagId: intoId },
      update: {},
    });
  }

  await db.tag.delete({ where: { id: fromId } });
  revalidatePath("/board");
  revalidatePath("/notes");
}

export async function listTags() {
  return db.tag.findMany({ orderBy: { name: "asc" } });
}
