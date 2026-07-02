"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TAG_PALETTE } from "@/lib/tag-palette";

function revalidateTagPages() {
  revalidatePath("/board");
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function createTag(name: string, color?: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required");

  const existing = await db.tag.findUnique({ where: { name: trimmed } });
  if (existing) return existing;

  const count = await db.tag.count();
  const tag = await db.tag.create({
    data: { name: trimmed, color: color ?? TAG_PALETTE[count % TAG_PALETTE.length] },
  });
  revalidateTagPages();
  return tag;
}

export async function updateTag(id: string, data: { name?: string; color?: string }) {
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error("Tag name is required");
    const conflict = await db.tag.findUnique({ where: { name: trimmed } });
    if (conflict && conflict.id !== id)
      throw new Error(`A tag named "${trimmed}" already exists`);
    data = { ...data, name: trimmed };
  }
  const tag = await db.tag.update({ where: { id }, data });
  revalidateTagPages();
  return tag;
}

export async function deleteTag(id: string) {
  await db.tag.delete({ where: { id } });
  revalidateTagPages();
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
  revalidateTagPages();
}

export async function listTags() {
  return db.tag.findMany({ orderBy: { name: "asc" } });
}

export async function listTagsWithUsage() {
  return db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { taskTags: true, noteTags: true } } },
  });
}
