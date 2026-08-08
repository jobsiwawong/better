import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { db } from "@/lib/db";
import { extractPlainText } from "@/lib/tiptap-text";
import {
  createTask,
  updateTask,
  completeTask,
  moveTask,
} from "@/app/actions/tasks";
import { saveAssistantDraft } from "@/app/actions/notes";

// Prisma needs the Node runtime, and every call is request-specific.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ok = (text: string) => ({ content: [{ type: "text" as const, text }] });
const fail = (text: string) => ({
  content: [{ type: "text" as const, text }],
  isError: true,
});

function ymd(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "—";
}

type TaskLike = {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: string;
  completed: boolean;
  owners?: { owner: { name: string } }[];
};

function fmtTask(t: TaskLike): string {
  const bits = [
    t.dueDate ? `due ${ymd(t.dueDate)}` : null,
    t.priority !== "MEDIUM" ? t.priority.toLowerCase() : null,
    t.owners?.length ? t.owners.map((o) => o.owner.name).join(", ") : null,
    t.completed ? "✓ done" : null,
  ].filter(Boolean);
  return `- [${t.id}] ${t.title}${bits.length ? ` (${bits.join(" · ")})` : ""}`;
}

async function resolveColumn(name?: string) {
  const columns = await db.column.findMany({ orderBy: { order: "asc" } });
  if (!name) return { column: columns[0] ?? null, columns };
  const match = columns.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  return { column: match ?? null, columns };
}

const handler = createMcpHandler(
  (server) => {
    // ---- Read tools ----

    server.registerTool(
      "get_today",
      {
        title: "Get today",
        description:
          "Overdue and due-today tasks — what needs attention now. No arguments.",
        inputSchema: z.object({}),
      },
      async () => {
        const tasks = await db.task.findMany({
          where: {
            archived: false,
            completed: false,
            parentId: null,
            dueDate: { not: null, lte: endOfDay(new Date()) },
          },
          include: { owners: { include: { owner: true } } },
          orderBy: { dueDate: "asc" },
        });
        const start = startOfDay(new Date());
        const overdue = tasks.filter((t) => t.dueDate! < start);
        const today = tasks.filter((t) => t.dueDate! >= start);
        const section = (title: string, list: TaskLike[]) =>
          `## ${title}\n${list.length ? list.map(fmtTask).join("\n") : "_none_"}`;
        return ok(
          `${section("Overdue", overdue)}\n\n${section("Due today", today)}`
        );
      }
    );

    server.registerTool(
      "list_tasks",
      {
        title: "List tasks",
        description:
          "List active tasks grouped by board column. Optionally filter to one column by name, or include completed tasks.",
        inputSchema: z.object({
          columnName: z.string().optional(),
          includeCompleted: z.boolean().optional(),
        }),
      },
      async ({ columnName, includeCompleted }) => {
        const columns = await db.column.findMany({
          orderBy: { order: "asc" },
          include: {
            tasks: {
              where: {
                archived: false,
                parentId: null,
                ...(includeCompleted ? {} : { completed: false }),
              },
              orderBy: { order: "asc" },
              include: { owners: { include: { owner: true } } },
            },
          },
        });
        const shown = columnName
          ? columns.filter(
              (c) => c.name.toLowerCase() === columnName.toLowerCase()
            )
          : columns;
        if (shown.length === 0) {
          return fail(
            `No column named "${columnName}". Columns: ${columns
              .map((c) => c.name)
              .join(", ")}.`
          );
        }
        const body = shown
          .map(
            (c) =>
              `## ${c.name} (${c.tasks.length})\n${
                c.tasks.length ? c.tasks.map(fmtTask).join("\n") : "_empty_"
              }`
          )
          .join("\n\n");
        return ok(body);
      }
    );

    server.registerTool(
      "search_notes",
      {
        title: "Search notes",
        description:
          "Search notes by keyword across title, body, and meeting agenda/action items. Returns matches with a snippet and note id.",
        inputSchema: z.object({
          query: z.string(),
          limit: z.number().int().min(1).max(25).optional(),
        }),
      },
      async ({ query, limit }) => {
        const q = query.trim().toLowerCase();
        if (!q) return fail("Provide a search query.");
        const notes = await db.note.findMany({
          where: { archived: false },
          orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        });
        const matches = notes
          .map((n) => {
            const body = [
              extractPlainText(n.content),
              n.agenda ?? "",
              n.actionItemsRaw ?? "",
              n.participants ?? "",
            ].join("\n");
            const hay = `${n.title}\n${body}`.toLowerCase();
            return { n, body, hit: hay.includes(q) };
          })
          .filter((m) => m.hit)
          .slice(0, limit ?? 8);
        if (matches.length === 0) return ok(`No notes match "${query}".`);
        const body = matches
          .map(({ n, body }) => {
            const idx = body.toLowerCase().indexOf(q);
            const snippet =
              idx >= 0
                ? body.slice(Math.max(0, idx - 60), idx + 100).replace(/\s+/g, " ").trim()
                : body.slice(0, 140).replace(/\s+/g, " ").trim();
            return `- [${n.id}] ${n.title}${n.isMeeting ? " (meeting)" : ""}\n  …${snippet}…`;
          })
          .join("\n");
        return ok(body);
      }
    );

    server.registerTool(
      "get_note",
      {
        title: "Get note",
        description: "Full text of one note by id, including meeting fields.",
        inputSchema: z.object({ noteId: z.string() }),
      },
      async ({ noteId }) => {
        const n = await db.note.findUnique({ where: { id: noteId } });
        if (!n || n.archived) return fail(`No note with id ${noteId}.`);
        const parts = [`# ${n.title}`];
        if (n.isMeeting) {
          if (n.participants) parts.push(`**Participants:** ${n.participants}`);
          if (n.agenda) parts.push(`**Agenda:**\n${n.agenda}`);
          if (n.actionItemsRaw)
            parts.push(`**Action items:**\n${n.actionItemsRaw}`);
        }
        const text = extractPlainText(n.content);
        if (text) parts.push(text);
        return ok(parts.join("\n\n"));
      }
    );

    server.registerTool(
      "list_notes",
      {
        title: "List notes",
        description:
          "List recent notes (title, id, meeting flag, last updated). Use search_notes to find by keyword.",
        inputSchema: z.object({
          limit: z.number().int().min(1).max(50).optional(),
        }),
      },
      async ({ limit }) => {
        const notes = await db.note.findMany({
          where: { archived: false },
          orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
          take: limit ?? 20,
          select: { id: true, title: true, isMeeting: true, updatedAt: true },
        });
        if (notes.length === 0) return ok("No notes yet.");
        return ok(
          notes
            .map(
              (n) =>
                `- [${n.id}] ${n.title}${n.isMeeting ? " (meeting)" : ""} · ${ymd(n.updatedAt)}`
            )
            .join("\n")
        );
      }
    );

    // ---- Write tools ----

    server.registerTool(
      "create_task",
      {
        title: "Create task",
        description:
          "Create a task on the board. dueDate is YYYY-MM-DD. columnName defaults to the first column.",
        inputSchema: z.object({
          title: z.string(),
          dueDate: z.string().optional(),
          priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
          columnName: z.string().optional(),
        }),
      },
      async ({ title, dueDate, priority, columnName }) => {
        const { column, columns } = await resolveColumn(columnName);
        if (!column) {
          return fail(
            columnName
              ? `No column named "${columnName}". Columns: ${columns.map((c) => c.name).join(", ")}.`
              : "No columns exist on the board."
          );
        }
        const task = await createTask({
          title,
          dueDate: dueDate ?? null,
          priority: priority ?? "MEDIUM",
          columnId: column.id,
        });
        return ok(`Created task [${task.id}] "${task.title}" in ${column.name}.`);
      }
    );

    server.registerTool(
      "update_task",
      {
        title: "Update task",
        description:
          "Update a task by id. Set any of title, dueDate (YYYY-MM-DD), priority, or columnName (moving into a Done column completes it).",
        inputSchema: z.object({
          taskId: z.string(),
          title: z.string().optional(),
          dueDate: z.string().optional(),
          priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
          columnName: z.string().optional(),
        }),
      },
      async ({ taskId, title, dueDate, priority, columnName }) => {
        const existing = await db.task.findUnique({ where: { id: taskId } });
        if (!existing) return fail(`No task with id ${taskId}.`);

        if (title !== undefined || dueDate !== undefined || priority !== undefined) {
          await updateTask(taskId, {
            ...(title !== undefined ? { title } : {}),
            ...(dueDate !== undefined ? { dueDate } : {}),
            ...(priority !== undefined ? { priority } : {}),
          });
        }
        if (columnName) {
          const { column, columns } = await resolveColumn(columnName);
          if (!column) {
            return fail(
              `No column named "${columnName}". Columns: ${columns.map((c) => c.name).join(", ")}.`
            );
          }
          const agg = await db.task.aggregate({
            where: { columnId: column.id, archived: false },
            _min: { order: true },
          });
          await moveTask(taskId, column.id, (agg._min.order ?? 0) - 1);
        }
        return ok(`Updated task [${taskId}].`);
      }
    );

    server.registerTool(
      "complete_task",
      {
        title: "Complete task",
        description:
          "Mark a task done by id. Moves it to the Done column (and, if it recurs, spawns the next occurrence).",
        inputSchema: z.object({ taskId: z.string() }),
      },
      async ({ taskId }) => {
        const existing = await db.task.findUnique({ where: { id: taskId } });
        if (!existing) return fail(`No task with id ${taskId}.`);
        await completeTask(taskId);
        return ok(`Completed task [${taskId}] "${existing.title}".`);
      }
    );

    server.registerTool(
      "create_note",
      {
        title: "Create note",
        description:
          "Create a note from Markdown content. Returns the new note id.",
        inputSchema: z.object({
          title: z.string(),
          content: z.string(),
        }),
      },
      async ({ title, content }) => {
        const note = await saveAssistantDraft(title, content);
        return ok(`Created note [${note.id}] "${note.title}".`);
      }
    );
  },
  {
    serverInfo: { name: "better", version: "1.0.0" },
  }
);

// Auth: the connector URL carries a secret path segment. Only requests whose
// segment matches MCP_SECRET reach the MCP handler.
async function guard(
  req: Request,
  ctx: { params: Promise<{ secret: string }> }
): Promise<Response> {
  const { secret } = await ctx.params;
  const expected = process.env.MCP_SECRET;
  if (!expected || secret !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }
  return handler(req);
}

export { guard as GET, guard as POST, guard as DELETE };
