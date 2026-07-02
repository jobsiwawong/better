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

export default async function TodayPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(new Date(now.getTime() + 7 * 86400000));

  const [overdue, dueToday, upcoming] = await Promise.all([
    db.task.findMany({
      where: { archived: false, completed: false, dueDate: { lt: todayStart } },
      include: { tags: { include: { tag: true } }, owners: { include: { owner: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.task.findMany({
      where: { archived: false, completed: false, dueDate: { gte: todayStart, lte: todayEnd } },
      include: { tags: { include: { tag: true } }, owners: { include: { owner: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.task.findMany({
      where: { archived: false, completed: false, dueDate: { gt: todayEnd, lte: weekEnd } },
      include: { tags: { include: { tag: true } }, owners: { include: { owner: true } } },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Good {greeting()}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what needs your attention this week.
        </p>
      </div>

      <TaskGroup
        title="Overdue"
        emptyLabel="Nothing overdue — you're caught up."
        tasks={overdue}
        tone="overdue"
      />
      <TaskGroup
        title="Due today"
        emptyLabel="Nothing due today."
        tasks={dueToday}
        tone="today"
      />
      <TaskGroup
        title="Coming up this week"
        emptyLabel="Nothing else on the horizon this week."
        tasks={upcoming}
        tone="upcoming"
      />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

type TaskWithRelations = {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: string;
  tags: { tag: { id: string; name: string; color: string } }[];
  owners: { owner: { id: string; name: string } }[];
};

function TaskGroup({
  title,
  emptyLabel,
  tasks,
  tone,
}: {
  title: string;
  emptyLabel: string;
  tasks: TaskWithRelations[];
  tone: "overdue" | "today" | "upcoming";
}) {
  return (
    <section>
      <h2
        className={
          "mb-3 text-sm font-semibold uppercase tracking-wide " +
          (tone === "overdue" ? "text-destructive" : "text-muted-foreground")
        }
      >
        {title} {tasks.length > 0 && <span>({tasks.length})</span>}
      </h2>
      {tasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {task.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {task.owners.map((o) => (
                    <span key={o.owner.id}>{o.owner.name}</span>
                  ))}
                  {task.tags.map((t) => (
                    <span
                      key={t.tag.id}
                      className="rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: `${t.tag.color}22`,
                        color: t.tag.color,
                      }}
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              </div>
              {task.dueDate && (
                <span
                  className={
                    "shrink-0 text-xs font-medium " +
                    (tone === "overdue" ? "text-destructive" : "text-muted-foreground")
                  }
                >
                  {new Date(task.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
