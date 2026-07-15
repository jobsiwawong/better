import { db } from "@/lib/db";
import { extractPlainText } from "@/lib/tiptap-text";

// Per-item and total caps keep the corpus well inside the context window
// while leaving room for long notes (meeting notes especially).
const MAX_NOTE_CHARS = 12_000;
const MAX_TOTAL_CHARS = 400_000;

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

/**
 * Assemble the user's whole workspace (notes + tasks) as a plaintext corpus
 * for the assistant. Single-user app with a modest dataset, so sending the
 * full corpus beats retrieval — the model can synthesize across everything.
 */
export async function buildWorkspaceContext(): Promise<string> {
  const [folders, notes, tasks, columns] = await Promise.all([
    db.folder.findMany(),
    db.note.findMany({
      where: { archived: false },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.task.findMany({
      where: { archived: false },
      include: {
        tags: { include: { tag: true } },
        owners: { include: { owner: true } },
        subtasks: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.column.findMany({ orderBy: { order: "asc" } }),
  ]);

  const folderById = new Map(folders.map((f) => [f.id, f]));
  const folderPath = (id: string | null): string => {
    if (!id) return "Unfiled";
    const parts: string[] = [];
    let cur = folderById.get(id);
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parentId ? folderById.get(cur.parentId) : undefined;
    }
    return parts.join(" / ") || "Unfiled";
  };
  const columnById = new Map(columns.map((c) => [c.id, c.name]));

  const sections: string[] = [];
  let total = 0;
  const push = (s: string) => {
    if (total + s.length > MAX_TOTAL_CHARS) return false;
    sections.push(s);
    total += s.length;
    return true;
  };

  push(`# NOTES (${notes.length} active)\n`);
  for (const n of notes) {
    const body = extractPlainText(n.content).slice(0, MAX_NOTE_CHARS);
    const lines = [
      `## Note: ${n.title}`,
      `- Folder: ${folderPath(n.folderId)}`,
      `- Created: ${fmtDate(n.createdAt)} | Updated: ${fmtDate(n.updatedAt)}`,
    ];
    if (n.tags.length) lines.push(`- Tags: ${n.tags.map((t) => t.tag.name).join(", ")}`);
    if (n.isMeeting) {
      lines.push(`- Type: meeting note`);
      if (n.participants) lines.push(`- Participants: ${n.participants}`);
      if (n.agenda) lines.push(`- Agenda: ${n.agenda}`);
      if (n.actionItemsRaw?.trim())
        lines.push(`- Open action items: ${n.actionItemsRaw.trim().split("\n").join("; ")}`);
    }
    if (body.trim()) lines.push(`- Content:\n${body.trim()}`);
    if (!push(lines.join("\n") + "\n")) break;
  }

  push(`\n# TASKS (${tasks.length} active)\n`);
  for (const t of tasks) {
    const bits = [
      `- "${t.title}" [${columnById.get(t.columnId) ?? "?"}${t.completed ? ", completed" : ""}]`,
    ];
    if (t.dueDate) bits.push(`due ${fmtDate(t.dueDate)}`);
    bits.push(`priority ${t.priority.toLowerCase()}`);
    if (t.owners.length) bits.push(`owners: ${t.owners.map((o) => o.owner.name).join(", ")}`);
    if (t.tags.length) bits.push(`tags: ${t.tags.map((x) => x.tag.name).join(", ")}`);
    const desc = extractPlainText(t.description).slice(0, 500).trim();
    if (desc) bits.push(`notes: ${desc}`);
    if (t.subtasks.length) {
      const st = t.subtasks
        .map((s) => `${s.completed ? "[x]" : "[ ]"} ${s.title}`)
        .join("; ");
      bits.push(`subtasks: ${st}`);
    }
    if (!push(bits.join(" · ") + "\n")) break;
  }

  return sections.join("\n");
}
