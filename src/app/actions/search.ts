"use server";

import { db } from "@/lib/db";
import { extractPlainText } from "@/lib/tiptap-text";

export interface SearchTaskEntry {
  id: string;
  title: string;
  body: string;
}
export interface SearchNoteEntry {
  id: string;
  title: string;
  body: string;
}

export interface SearchIndex {
  tasks: SearchTaskEntry[];
  notes: SearchNoteEntry[];
}

export async function getSearchIndex(): Promise<SearchIndex> {
  const [tasks, notes] = await Promise.all([
    db.task.findMany({
      where: { archived: false },
      select: { id: true, title: true, description: true },
    }),
    db.note.findMany({
      where: { archived: false },
      select: {
        id: true,
        title: true,
        content: true,
        agenda: true,
        actionItemsRaw: true,
      },
    }),
  ]);

  return {
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      body: extractPlainText(t.description),
    })),
    notes: notes.map((n) => ({
      id: n.id,
      title: n.title,
      body: [extractPlainText(n.content), n.agenda ?? "", n.actionItemsRaw ?? ""]
        .filter(Boolean)
        .join(" "),
    })),
  };
}
