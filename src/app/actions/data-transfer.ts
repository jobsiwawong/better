"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function toDate(v: unknown) {
  return v ? new Date(v as string) : null;
}

export async function importData(jsonString: string) {
  const data = JSON.parse(jsonString);

  await db.$transaction(async (tx) => {
    for (const tag of data.tags ?? []) {
      await tx.tag.upsert({
        where: { id: tag.id },
        create: { id: tag.id, name: tag.name, color: tag.color },
        update: { name: tag.name, color: tag.color },
      });
    }

    for (const owner of data.owners ?? []) {
      await tx.owner.upsert({
        where: { id: owner.id },
        create: { id: owner.id, name: owner.name },
        update: { name: owner.name },
      });
    }

    for (const column of data.columns ?? []) {
      await tx.column.upsert({
        where: { id: column.id },
        create: {
          id: column.id,
          name: column.name,
          order: column.order,
          color: column.color ?? null,
        },
        update: { name: column.name, order: column.order, color: column.color ?? null },
      });
    }

    for (const folder of data.folders ?? []) {
      await tx.folder.upsert({
        where: { id: folder.id },
        create: { id: folder.id, name: folder.name, parentId: null },
        update: { name: folder.name },
      });
    }
    for (const folder of data.folders ?? []) {
      if (folder.parentId) {
        await tx.folder.update({
          where: { id: folder.id },
          data: { parentId: folder.parentId },
        });
      }
    }

    for (const task of data.tasks ?? []) {
      await tx.task.upsert({
        where: { id: task.id },
        create: {
          id: task.id,
          title: task.title,
          description: task.description ?? null,
          dueDate: toDate(task.dueDate),
          dueTime: task.dueTime ?? null,
          priority: task.priority,
          order: task.order,
          recurrenceType: task.recurrenceType,
          recurrenceInterval: task.recurrenceInterval ?? null,
          recurrenceEndDate: toDate(task.recurrenceEndDate),
          archived: !!task.archived,
          deletedAt: toDate(task.deletedAt),
          columnId: task.columnId,
        },
        update: {
          title: task.title,
          description: task.description ?? null,
          dueDate: toDate(task.dueDate),
          dueTime: task.dueTime ?? null,
          priority: task.priority,
          order: task.order,
          recurrenceType: task.recurrenceType,
          recurrenceInterval: task.recurrenceInterval ?? null,
          recurrenceEndDate: toDate(task.recurrenceEndDate),
          archived: !!task.archived,
          deletedAt: toDate(task.deletedAt),
          columnId: task.columnId,
        },
      });
    }

    for (const tt of data.taskTags ?? []) {
      await tx.taskTag.upsert({
        where: { taskId_tagId: { taskId: tt.taskId, tagId: tt.tagId } },
        create: { taskId: tt.taskId, tagId: tt.tagId },
        update: {},
      });
    }
    for (const to of data.taskOwners ?? []) {
      await tx.taskOwner.upsert({
        where: { taskId_ownerId: { taskId: to.taskId, ownerId: to.ownerId } },
        create: { taskId: to.taskId, ownerId: to.ownerId },
        update: {},
      });
    }

    for (const s of data.subtasks ?? []) {
      await tx.subtask.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          taskId: s.taskId,
          title: s.title,
          completed: !!s.completed,
          order: s.order,
        },
        update: { title: s.title, completed: !!s.completed, order: s.order },
      });
    }

    for (const a of data.attachments ?? []) {
      await tx.attachment.upsert({
        where: { id: a.id },
        create: { id: a.id, taskId: a.taskId, label: a.label, url: a.url },
        update: { label: a.label, url: a.url },
      });
    }

    for (const note of data.notes ?? []) {
      await tx.note.upsert({
        where: { id: note.id },
        create: {
          id: note.id,
          title: note.title,
          content: note.content ?? null,
          pinned: !!note.pinned,
          isMeeting: !!note.isMeeting,
          agenda: note.agenda ?? null,
          actionItemsRaw: note.actionItemsRaw ?? null,
          archived: !!note.archived,
          deletedAt: toDate(note.deletedAt),
          folderId: note.folderId ?? null,
        },
        update: {
          title: note.title,
          content: note.content ?? null,
          pinned: !!note.pinned,
          isMeeting: !!note.isMeeting,
          agenda: note.agenda ?? null,
          actionItemsRaw: note.actionItemsRaw ?? null,
          archived: !!note.archived,
          deletedAt: toDate(note.deletedAt),
          folderId: note.folderId ?? null,
        },
      });
    }

    for (const nt of data.noteTags ?? []) {
      await tx.noteTag.upsert({
        where: { noteId_tagId: { noteId: nt.noteId, tagId: nt.tagId } },
        create: { noteId: nt.noteId, tagId: nt.tagId },
        update: {},
      });
    }
    for (const tn of data.taskNotes ?? []) {
      await tx.taskNote.upsert({
        where: { taskId_noteId: { taskId: tn.taskId, noteId: tn.noteId } },
        create: { taskId: tn.taskId, noteId: tn.noteId },
        update: {},
      });
    }

    for (const view of data.savedViews ?? []) {
      await tx.savedView.upsert({
        where: { id: view.id },
        create: {
          id: view.id,
          name: view.name,
          type: view.type,
          filters: view.filters,
        },
        update: { name: view.name, type: view.type, filters: view.filters },
      });
    }
  });

  revalidatePath("/", "layout");
}
