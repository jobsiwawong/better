"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Priority, RecurrenceType } from "@/generated/prisma/enums";

export type TaskInput = {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: Priority;
  columnId: string;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
  tagIds?: string[];
  ownerIds?: string[];
};

function parseDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function quickCreateTask(title: string, columnId: string) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required");

  const min = await db.task.aggregate({
    where: { columnId, archived: false },
    _min: { order: true },
  });

  const task = await db.task.create({
    data: {
      title: trimmed,
      columnId,
      order: (min._min.order ?? 0) - 1,
    },
  });
  revalidatePath("/board");
  revalidatePath("/");
  return task;
}

export async function createTask(input: TaskInput) {
  const trimmed = input.title.trim();
  if (!trimmed) throw new Error("Title is required");

  const min = await db.task.aggregate({
    where: { columnId: input.columnId, archived: false },
    _min: { order: true },
  });

  const task = await db.task.create({
    data: {
      title: trimmed,
      description: input.description ?? null,
      dueDate: parseDate(input.dueDate),
      dueTime: input.dueTime ?? null,
      priority: input.priority ?? "MEDIUM",
      columnId: input.columnId,
      order: (min._min.order ?? 0) - 1,
      recurrenceType: input.recurrenceType ?? "NONE",
      recurrenceInterval: input.recurrenceInterval ?? null,
      recurrenceEndDate: parseDate(input.recurrenceEndDate),
      tags: input.tagIds
        ? { create: input.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
      owners: input.ownerIds
        ? { create: input.ownerIds.map((ownerId) => ({ ownerId })) }
        : undefined,
    },
  });
  revalidatePath("/board");
  revalidatePath("/");
  return task;
}

export type TaskUpdateInput = Partial<
  Omit<TaskInput, "columnId">
> & { title?: string };

export async function updateTask(id: string, patch: TaskUpdateInput) {
  const data: Record<string, unknown> = {};

  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.dueDate !== undefined) data.dueDate = parseDate(patch.dueDate);
  if (patch.dueTime !== undefined) data.dueTime = patch.dueTime;
  if (patch.priority !== undefined) data.priority = patch.priority;
  if (patch.recurrenceType !== undefined) data.recurrenceType = patch.recurrenceType;
  if (patch.recurrenceInterval !== undefined)
    data.recurrenceInterval = patch.recurrenceInterval;
  if (patch.recurrenceEndDate !== undefined)
    data.recurrenceEndDate = parseDate(patch.recurrenceEndDate);

  if (patch.tagIds !== undefined) {
    await db.taskTag.deleteMany({ where: { taskId: id } });
    if (patch.tagIds.length) {
      await db.taskTag.createMany({
        data: patch.tagIds.map((tagId) => ({ taskId: id, tagId })),
      });
    }
  }

  if (patch.ownerIds !== undefined) {
    await db.taskOwner.deleteMany({ where: { taskId: id } });
    if (patch.ownerIds.length) {
      await db.taskOwner.createMany({
        data: patch.ownerIds.map((ownerId) => ({ taskId: id, ownerId })),
      });
    }
  }

  const task = await db.task.update({ where: { id }, data });
  revalidatePath("/board");
  revalidatePath("/");
  return task;
}

export async function moveTask(id: string, columnId: string, order: number) {
  await db.task.update({ where: { id }, data: { columnId, order } });
  revalidatePath("/board");
}

export async function archiveTask(id: string) {
  await db.task.update({
    where: { id },
    data: { archived: true, deletedAt: new Date() },
  });
  revalidatePath("/board");
  revalidatePath("/");
}

export async function restoreTask(id: string) {
  await db.task.update({
    where: { id },
    data: { archived: false, deletedAt: null },
  });
  revalidatePath("/board");
  revalidatePath("/");
}

export async function addSubtask(taskId: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required");
  const count = await db.subtask.count({ where: { taskId } });
  const subtask = await db.subtask.create({
    data: { taskId, title: trimmed, order: count },
  });
  revalidatePath("/board");
  return subtask;
}

export async function toggleSubtask(id: string) {
  const subtask = await db.subtask.findUniqueOrThrow({ where: { id } });
  await db.subtask.update({
    where: { id },
    data: { completed: !subtask.completed },
  });
  revalidatePath("/board");
}

export async function deleteSubtask(id: string) {
  await db.subtask.delete({ where: { id } });
  revalidatePath("/board");
}

export async function addAttachment(taskId: string, label: string, url: string) {
  const trimmedLabel = label.trim() || url;
  const trimmedUrl = url.trim();
  if (!trimmedUrl) throw new Error("URL is required");
  const attachment = await db.attachment.create({
    data: { taskId, label: trimmedLabel, url: trimmedUrl },
  });
  revalidatePath("/board");
  return attachment;
}

export async function removeAttachment(id: string) {
  await db.attachment.delete({ where: { id } });
  revalidatePath("/board");
}

export async function linkNoteToTask(taskId: string, noteId: string) {
  await db.taskNote.upsert({
    where: { taskId_noteId: { taskId, noteId } },
    create: { taskId, noteId },
    update: {},
  });
  revalidatePath("/board");
  revalidatePath("/notes");
}

export async function unlinkNoteFromTask(taskId: string, noteId: string) {
  await db.taskNote.delete({ where: { taskId_noteId: { taskId, noteId } } });
  revalidatePath("/board");
  revalidatePath("/notes");
}
