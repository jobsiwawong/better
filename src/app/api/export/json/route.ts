import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [
    tags,
    owners,
    columns,
    tasks,
    taskTags,
    taskOwners,
    subtasks,
    attachments,
    folders,
    notes,
    noteTags,
    taskNotes,
    savedViews,
  ] = await Promise.all([
    db.tag.findMany(),
    db.owner.findMany(),
    db.column.findMany(),
    db.task.findMany(),
    db.taskTag.findMany(),
    db.taskOwner.findMany(),
    db.subtask.findMany(),
    db.attachment.findMany(),
    db.folder.findMany(),
    db.note.findMany(),
    db.noteTag.findMany(),
    db.taskNote.findMany(),
    db.savedView.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    tags,
    owners,
    columns,
    tasks,
    taskTags,
    taskOwners,
    subtasks,
    attachments,
    folders,
    notes,
    noteTags,
    taskNotes,
    savedViews,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="better-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}
