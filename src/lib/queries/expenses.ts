import { db } from "@/lib/db";

// Receipt IDs only — never ship base64 blobs to the list; the modal
// lazy-loads full images via listReceipts().
export function expenseInclude() {
  return {
    category: true,
    approver: true,
    receipts: { select: { id: true } },
  } as const;
}

export async function getExpensesData() {
  const [trips, unassigned, categories, owners] = await Promise.all([
    db.trip.findMany({
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      include: {
        expenses: { orderBy: { date: "desc" }, include: expenseInclude() },
      },
    }),
    db.expense.findMany({
      where: { tripId: null },
      orderBy: { date: "desc" },
      include: expenseInclude(),
    }),
    db.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    db.owner.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { trips, unassigned, categories, owners };
}

export type ExpensesData = Awaited<ReturnType<typeof getExpensesData>>;
export type TripWithExpenses = ExpensesData["trips"][number];
export type ExpenseRow = TripWithExpenses["expenses"][number];
export type ExpenseCategoryRow = ExpensesData["categories"][number];
export type OwnerRow = ExpensesData["owners"][number];
