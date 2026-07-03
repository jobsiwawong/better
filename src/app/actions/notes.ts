"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createNote(opts?: {
  folderId?: string | null;
  isMeeting?: boolean;
}) {
  const note = await db.note.create({
    data: {
      title: opts?.isMeeting ? "New meeting" : "Untitled note",
      folderId: opts?.folderId ?? null,
      isMeeting: opts?.isMeeting ?? false,
    },
  });
  revalidatePath("/notes");
  return note;
}

export interface NoteUpdateInput {
  title?: string;
  content?: string | null;
  participants?: string | null;
  agenda?: string | null;
  actionItemsRaw?: string | null;
  pinned?: boolean;
  folderId?: string | null;
  tagIds?: string[];
}

export async function updateNote(id: string, patch: NoteUpdateInput) {
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim() || "Untitled note";
  if (patch.content !== undefined) data.content = patch.content;
  if (patch.participants !== undefined) data.participants = patch.participants;
  if (patch.agenda !== undefined) data.agenda = patch.agenda;
  if (patch.actionItemsRaw !== undefined) data.actionItemsRaw = patch.actionItemsRaw;
  if (patch.pinned !== undefined) data.pinned = patch.pinned;
  if (patch.folderId !== undefined) data.folderId = patch.folderId;

  if (patch.tagIds !== undefined) {
    await db.noteTag.deleteMany({ where: { noteId: id } });
    if (patch.tagIds.length) {
      await db.noteTag.createMany({
        data: patch.tagIds.map((tagId) => ({ noteId: id, tagId })),
      });
    }
  }

  const note = await db.note.update({ where: { id }, data });
  revalidatePath("/notes");
  return note;
}

export async function archiveNote(id: string) {
  await db.note.update({
    where: { id },
    data: { archived: true, deletedAt: new Date() },
  });
  revalidatePath("/notes");
}

export async function restoreNote(id: string) {
  await db.note.update({
    where: { id },
    data: { archived: false, deletedAt: null },
  });
  revalidatePath("/notes");
}

export async function convertActionItemToTask(
  noteId: string,
  text: string,
  remainingItems: string[]
) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Action item text is required");

  const firstColumn = await db.column.findFirstOrThrow({ orderBy: { order: "asc" } });
  const min = await db.task.aggregate({
    where: { columnId: firstColumn.id, archived: false },
    _min: { order: true },
  });

  const task = await db.task.create({
    data: {
      title: trimmed,
      columnId: firstColumn.id,
      order: (min._min.order ?? 0) - 1,
      notes: { create: [{ noteId }] },
    },
  });

  await db.note.update({
    where: { id: noteId },
    data: { actionItemsRaw: remainingItems.join("\n") },
  });

  revalidatePath("/notes");
  revalidatePath("/board");
  revalidatePath("/");
  return task;
}
