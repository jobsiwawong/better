import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const tasks = await db.task.findMany({
    include: {
      column: true,
      tags: { include: { tag: true } },
      owners: { include: { owner: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "Title",
    "Status",
    "Priority",
    "Due date",
    "Owners",
    "Tags",
    "Archived",
    "Created at",
  ];

  const rows = tasks.map((t) =>
    [
      t.title,
      t.column.name,
      t.priority,
      t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
      t.owners.map((o) => o.owner.name).join("; "),
      t.tags.map((tg) => tg.tag.name).join("; "),
      t.archived ? "yes" : "no",
      t.createdAt.toISOString(),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="better-tasks-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
