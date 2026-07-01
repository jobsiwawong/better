"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createFolder(name: string, parentId?: string | null) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Folder name is required");
  const folder = await db.folder.create({
    data: { name: trimmed, parentId: parentId ?? null },
  });
  revalidatePath("/notes");
  return folder;
}

export async function renameFolder(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Folder name is required");
  await db.folder.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/notes");
}

export async function deleteFolder(id: string) {
  const folder = await db.folder.findUniqueOrThrow({ where: { id } });

  await db.folder.updateMany({
    where: { parentId: id },
    data: { parentId: folder.parentId },
  });
  await db.note.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });
  await db.folder.delete({ where: { id } });
  revalidatePath("/notes");
}
