import { db } from "@/lib/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function getTodayBadgeCount() {
  const now = new Date();
  const todayEnd = endOfDay(now);
  const count = await db.task.count({
    where: { archived: false, dueDate: { lte: todayEnd, not: null } },
  });
  return count;
}

export async function getWeeklyDigest() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEnd = endOfDay(new Date(now.getTime() + 7 * 86400000));

  const include = {
    tags: { include: { tag: true } },
    owners: { include: { owner: true } },
  };

  const [doneThisWeek, overdue, upcoming, notesThisWeek] = await Promise.all([
    db.task.findMany({
      where: {
        archived: false,
        updatedAt: { gte: weekAgo },
        column: { name: "Done" },
      },
      include,
      orderBy: { updatedAt: "desc" },
    }),
    db.task.findMany({
      where: { archived: false, dueDate: { lt: todayStart } },
      include,
      orderBy: { dueDate: "asc" },
    }),
    db.task.findMany({
      where: { archived: false, dueDate: { gte: todayStart, lte: weekEnd } },
      include,
      orderBy: { dueDate: "asc" },
    }),
    db.note.count({ where: { archived: false, createdAt: { gte: weekAgo } } }),
  ]);

  return { doneThisWeek, overdue, upcoming, notesThisWeek };
}
