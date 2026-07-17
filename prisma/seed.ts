import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

function doc(paragraphs: string[]) {
  return JSON.stringify({
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  });
}

async function main() {
  const existing = await db.column.count();
  if (existing > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const [notStarted, inProgress, blocked, done] = await Promise.all([
    db.column.create({ data: { name: "Not Started", order: 0 } }),
    db.column.create({ data: { name: "In Progress", order: 1 } }),
    db.column.create({ data: { name: "Blocked", order: 2 } }),
    db.column.create({ data: { name: "Done", order: 3 } }),
  ]);

  const tagDefs = [
    { name: "Engineering", color: "#c17a52" },
    { name: "Sales", color: "#7a9e7e" },
    { name: "Self", color: "#b08bbb" },
    { name: "Legal", color: "#c2685f" },
    { name: "Marketing", color: "#d4a24c" },
  ];
  const tags: Record<string, { id: string }> = {};
  for (const t of tagDefs) {
    tags[t.name] = await db.tag.create({ data: t });
  }

  const ownerDefs = ["Adam Shapiro", "Priya Nair", "Jordan Lee", "You"];
  const owners: Record<string, { id: string }> = {};
  for (const name of ownerDefs) {
    owners[name] = await db.owner.create({ data: { name } });
  }

  const workFolder = await db.folder.create({ data: { name: "Work" } });
  const meetingsFolder = await db.folder.create({
    data: { name: "Meetings", parentId: workFolder.id },
  });
  const personalFolder = await db.folder.create({ data: { name: "Personal" } });

  const now = new Date();
  const daysFromNow = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(17, 0, 0, 0);
    return d;
  };

  const task1 = await db.task.create({
    data: {
      title: "Finalize Q3 board deck",
      description: doc(["Pull latest metrics from finance and design team, then circulate for exec review."]),
      dueDate: daysFromNow(-1),
      dueTime: "17:00",
      priority: "HIGH",
      order: 0,
      columnId: inProgress.id,
      tags: { create: [{ tagId: tags["Self"].id }] },
      owners: { create: [{ ownerId: owners["You"].id }] },
      subtasks: {
        create: [
          { title: "Pull revenue metrics", completed: true, order: 0 },
          { title: "Get design review", completed: false, order: 1 },
          { title: "Send to CEO for review", completed: false, order: 2 },
        ],
      },
    },
  });

  await db.task.create({
    data: {
      title: "Ship new onboarding flow",
      description: doc(["Coordinate with design and eng to land the redesigned onboarding by end of sprint."]),
      dueDate: daysFromNow(2),
      priority: "HIGH",
      order: 0,
      columnId: notStarted.id,
      tags: { create: [{ tagId: tags["Engineering"].id }] },
      owners: { create: [{ ownerId: owners["Adam Shapiro"].id }] },
    },
  });

  await db.task.create({
    data: {
      title: "Renew vendor contract - Acme Corp",
      description: doc(["Legal needs to review updated terms before signature."]),
      dueDate: daysFromNow(5),
      priority: "MEDIUM",
      order: 1,
      columnId: notStarted.id,
      tags: { create: [{ tagId: tags["Legal"].id }] },
      owners: { create: [{ ownerId: owners["Jordan Lee"].id }] },
    },
  });

  await db.task.create({
    data: {
      title: "Waiting on legal sign-off for partnership MOU",
      description: doc(["Blocked until legal reviews the redlines sent Tuesday."]),
      dueDate: daysFromNow(1),
      priority: "HIGH",
      order: 0,
      columnId: blocked.id,
      tags: { create: [{ tagId: tags["Legal"].id }, { tagId: tags["Sales"].id }] },
      owners: { create: [{ ownerId: owners["Priya Nair"].id }] },
    },
  });

  await db.task.create({
    data: {
      title: "Weekly 1:1 with CEO prep",
      description: doc(["Bring updated priority list and blockers."]),
      dueDate: daysFromNow(0),
      dueTime: "09:00",
      priority: "MEDIUM",
      order: 1,
      columnId: notStarted.id,
      recurrenceType: "WEEKLY",
      recurrenceInterval: 1,
      tags: { create: [{ tagId: tags["Self"].id }] },
      owners: { create: [{ ownerId: owners["You"].id }] },
    },
  });

  await db.task.create({
    data: {
      title: "Q2 recap email to leadership team",
      description: doc(["Summarize wins, misses, and Q3 priorities."]),
      dueDate: daysFromNow(-3),
      priority: "LOW",
      order: 0,
      columnId: done.id,
      archived: false,
      tags: { create: [{ tagId: tags["Marketing"].id }] },
      owners: { create: [{ ownerId: owners["You"].id }] },
    },
  });

  const meetingNote = await db.note.create({
    data: {
      title: "Leadership sync - product roadmap",
      isMeeting: true,
      agenda: "1. Q3 roadmap review\n2. Hiring plan\n3. Open blockers",
      content: doc([
        "Team aligned on prioritizing onboarding redesign for Q3.",
        "Hiring: approved 2 new eng reqs, pending Legal approval on contractor agreement.",
      ]),
      actionItemsRaw:
        "Follow up with Legal on contractor agreement\nShare onboarding redesign timeline with Sales",
      folderId: meetingsFolder.id,
      pinned: true,
      tags: { create: [{ tagId: tags["Self"].id }] },
      tasks: { create: [{ taskId: task1.id }] },
    },
  });

  await db.note.create({
    data: {
      title: "Engineering standup notes",
      content: doc(["No major blockers this week.", "Onboarding redesign on track for Friday demo."]),
      folderId: workFolder.id,
      tags: { create: [{ tagId: tags["Engineering"].id }] },
    },
  });

  await db.note.create({
    data: {
      title: "Ideas for offsite",
      content: doc(["Consider a half-day strategy session plus team activity."]),
      folderId: personalFolder.id,
      pinned: false,
    },
  });

  console.log("Seed complete:", {
    columns: 4,
    tags: tagDefs.length,
    owners: ownerDefs.length,
    tasks: 6,
    notes: 3,
    meetingNoteId: meetingNote.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
