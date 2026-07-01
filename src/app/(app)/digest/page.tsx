import { getWeeklyDigest } from "@/lib/queries/digest";

export default async function DigestPage() {
  const { doneThisWeek, overdue, upcoming, notesThisWeek } = await getWeeklyDigest();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Weekly digest</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This week: {doneThisWeek.length} done, {overdue.length} overdue,{" "}
          {upcoming.length} upcoming, {notesThisWeek} note
          {notesThisWeek === 1 ? "" : "s"} added.
        </p>
      </div>

      <Section title="Done this week" tone="done" items={doneThisWeek} emptyLabel="Nothing completed yet this week." />
      <Section title="Overdue" tone="overdue" items={overdue} emptyLabel="Nothing overdue." />
      <Section title="Upcoming (next 7 days)" tone="upcoming" items={upcoming} emptyLabel="Nothing scheduled." />
    </div>
  );
}

interface DigestTask {
  id: string;
  title: string;
  dueDate: Date | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  owners: { owner: { id: string; name: string } }[];
}

function Section({
  title,
  tone,
  items,
  emptyLabel,
}: {
  title: string;
  tone: "done" | "overdue" | "upcoming";
  items: DigestTask[];
  emptyLabel: string;
}) {
  return (
    <section>
      <h2
        className={
          "mb-3 text-sm font-semibold uppercase tracking-wide " +
          (tone === "overdue" ? "text-destructive" : "text-muted-foreground")
        }
      >
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((task) => (
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
                      style={{ backgroundColor: `${t.tag.color}22`, color: t.tag.color }}
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              </div>
              {task.dueDate && (
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
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
