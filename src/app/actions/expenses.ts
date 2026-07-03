"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ExpenseStatus, PaymentMethod } from "@/generated/prisma/enums";
import { getRate, convertMinor } from "@/lib/fx";
import {
  UNASSIGNED_HOME_CURRENCY,
  type Currency,
  type HomeCurrency,
} from "@/lib/expense-constants";

function revalidateExpensePages() {
  revalidatePath("/expenses");
}

function toDateISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

// ---------- Trips ----------

export async function createTrip(input: {
  name: string;
  homeCurrency: HomeCurrency;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Trip name is required");
  const conflict = await db.trip.findUnique({ where: { name } });
  if (conflict) throw new Error(`A trip named "${name}" already exists`);

  const trip = await db.trip.create({
    data: {
      name,
      homeCurrency: input.homeCurrency,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
    },
  });
  revalidateExpensePages();
  return trip;
}

export async function updateTrip(
  id: string,
  patch: {
    name?: string;
    homeCurrency?: HomeCurrency;
    startDate?: string | null;
    endDate?: string | null;
  }
) {
  const data: {
    name?: string;
    homeCurrency?: string;
    startDate?: Date | null;
    endDate?: Date | null;
  } = {};

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("Trip name is required");
    const conflict = await db.trip.findUnique({ where: { name } });
    if (conflict && conflict.id !== id)
      throw new Error(`A trip named "${name}" already exists`);
    data.name = name;
  }
  if (patch.homeCurrency !== undefined) data.homeCurrency = patch.homeCurrency;
  if (patch.startDate !== undefined)
    data.startDate = patch.startDate ? new Date(patch.startDate) : null;
  if (patch.endDate !== undefined)
    data.endDate = patch.endDate ? new Date(patch.endDate) : null;

  const trip = await db.trip.update({ where: { id }, data });

  if (patch.homeCurrency !== undefined) {
    await resnapshotExpenses({ tripId: id }, patch.homeCurrency);
  }

  revalidateExpensePages();
  return trip;
}

export async function deleteTrip(id: string) {
  // Its expenses survive (relation is SetNull) and land in the Unassigned
  // bucket, so re-snapshot them to the bucket's home currency first.
  await resnapshotExpenses({ tripId: id }, UNASSIGNED_HOME_CURRENCY);
  await db.trip.delete({ where: { id } });
  revalidateExpensePages();
}

async function resnapshotExpenses(
  where: { tripId: string | null },
  homeCurrency: string
) {
  const expenses = await db.expense.findMany({ where });
  for (const e of expenses) {
    const fx = await getRate(
      toDateISO(e.date),
      e.currency as Currency,
      homeCurrency as Currency
    );
    await db.expense.update({
      where: { id: e.id },
      data: {
        homeCurrency,
        fxRate: fx.rate,
        fxSource: fx.source,
        convertedMinor: convertMinor(e.amountMinor, fx.rate),
      },
    });
  }
}

// ---------- Expenses ----------

export interface ExpenseInput {
  merchant: string;
  date: string; // "YYYY-MM-DD"
  amountMinor: number;
  currency: Currency;
  tripId?: string | null;
  categoryId?: string | null;
  approverId?: string | null;
  status?: ExpenseStatus;
  paymentMethod?: PaymentMethod;
  notes?: string | null;
}

async function homeCurrencyForTrip(tripId: string | null | undefined) {
  if (!tripId) return UNASSIGNED_HOME_CURRENCY as string;
  const trip = await db.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new Error("Trip not found");
  return trip.homeCurrency;
}

export async function createExpense(input: ExpenseInput) {
  const merchant = input.merchant.trim();
  if (!merchant) throw new Error("Merchant is required");
  if (!Number.isInteger(input.amountMinor) || input.amountMinor < 0)
    throw new Error("Amount must be a positive number");

  const homeCurrency = await homeCurrencyForTrip(input.tripId);
  const fx = await getRate(input.date, input.currency, homeCurrency as Currency);

  const expense = await db.expense.create({
    data: {
      merchant,
      date: new Date(`${input.date}T12:00:00`),
      amountMinor: input.amountMinor,
      currency: input.currency,
      homeCurrency,
      fxRate: fx.rate,
      fxSource: fx.source,
      convertedMinor: convertMinor(input.amountMinor, fx.rate),
      status: input.status ?? "NOT_FILED",
      paymentMethod: input.paymentMethod ?? "PERSONAL",
      notes: input.notes ?? null,
      tripId: input.tripId ?? null,
      categoryId: input.categoryId ?? null,
      approverId: input.approverId ?? null,
    },
    include: expenseIncludeLight(),
  });
  revalidateExpensePages();
  return expense;
}

export async function updateExpense(
  id: string,
  patch: Partial<ExpenseInput> & { manualRate?: number | null }
) {
  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing) throw new Error("Expense not found");

  const data: Record<string, unknown> = {};

  if (patch.merchant !== undefined) {
    const merchant = patch.merchant.trim();
    if (!merchant) throw new Error("Merchant is required");
    data.merchant = merchant;
  }
  if (patch.date !== undefined) data.date = new Date(`${patch.date}T12:00:00`);
  if (patch.amountMinor !== undefined) {
    if (!Number.isInteger(patch.amountMinor) || patch.amountMinor < 0)
      throw new Error("Amount must be a positive number");
    data.amountMinor = patch.amountMinor;
  }
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.paymentMethod !== undefined) data.paymentMethod = patch.paymentMethod;
  if (patch.notes !== undefined) data.notes = patch.notes;
  if (patch.categoryId !== undefined) data.categoryId = patch.categoryId;
  if (patch.approverId !== undefined) data.approverId = patch.approverId;
  if (patch.tripId !== undefined) data.tripId = patch.tripId;

  // Figure out the post-patch snapshot inputs.
  const nextAmount = (data.amountMinor as number) ?? existing.amountMinor;
  const nextCurrency = (data.currency as string) ?? existing.currency;
  const nextDate = (data.date as Date) ?? existing.date;
  const tripChanged = patch.tripId !== undefined && patch.tripId !== existing.tripId;
  const fxInputsChanged =
    tripChanged ||
    (patch.currency !== undefined && patch.currency !== existing.currency) ||
    (patch.date !== undefined &&
      toDateISO(new Date(`${patch.date}T12:00:00`)) !== toDateISO(existing.date));
  const amountChanged =
    patch.amountMinor !== undefined && patch.amountMinor !== existing.amountMinor;

  if (patch.manualRate !== undefined && patch.manualRate !== null) {
    // Explicit manual override.
    if (!(patch.manualRate > 0)) throw new Error("Rate must be positive");
    data.fxRate = patch.manualRate;
    data.fxSource = "manual";
    data.convertedMinor = convertMinor(nextAmount, patch.manualRate);
  } else if (patch.manualRate === null || fxInputsChanged) {
    // Cleared override, or currency/date/trip changed: re-fetch. A manual
    // rate does not survive edits that move the expense across
    // currencies/dates/trips.
    const homeCurrency = tripChanged
      ? await homeCurrencyForTrip(patch.tripId)
      : existing.homeCurrency;
    const fx = await getRate(
      toDateISO(nextDate),
      nextCurrency as Currency,
      homeCurrency as Currency
    );
    data.homeCurrency = homeCurrency;
    data.fxRate = fx.rate;
    data.fxSource = fx.source;
    data.convertedMinor = convertMinor(nextAmount, fx.rate);
  } else if (amountChanged) {
    // Amount-only edit: reuse the stored rate (manual or fetched).
    data.convertedMinor = convertMinor(nextAmount, existing.fxRate);
  }

  const expense = await db.expense.update({
    where: { id },
    data,
    include: expenseIncludeLight(),
  });
  revalidateExpensePages();
  return expense;
}

export async function refreshExpenseRate(id: string) {
  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing) throw new Error("Expense not found");

  const fx = await getRate(
    toDateISO(existing.date),
    existing.currency as Currency,
    existing.homeCurrency as Currency
  );
  const expense = await db.expense.update({
    where: { id },
    data: {
      fxRate: fx.rate,
      fxSource: fx.source,
      convertedMinor: convertMinor(existing.amountMinor, fx.rate),
    },
    include: expenseIncludeLight(),
  });
  revalidateExpensePages();
  return expense;
}

function expenseIncludeLight() {
  return {
    category: true,
    approver: true,
    receipts: { select: { id: true } },
  } as const;
}

export type ExpenseSnapshot = Awaited<ReturnType<typeof deleteExpense>>;

export async function deleteExpense(id: string) {
  const expense = await db.expense.findUnique({
    where: { id },
    include: { receipts: true },
  });
  if (!expense) throw new Error("Expense not found");
  await db.expense.delete({ where: { id } });
  revalidateExpensePages();
  return expense;
}

export async function restoreExpense(snapshot: ExpenseSnapshot) {
  const { receipts, ...expense } = snapshot;
  await db.expense.create({
    data: {
      ...expense,
      receipts: {
        create: receipts.map((r) => ({ image: r.image, createdAt: r.createdAt })),
      },
    },
  });
  revalidateExpensePages();
}

// ---------- Receipts ----------

export async function addReceipt(expenseId: string, dataUrl: string) {
  if (!dataUrl.startsWith("data:image/"))
    throw new Error("Receipt must be an image");
  const receipt = await db.expenseReceipt.create({
    data: { expenseId, image: dataUrl },
    select: { id: true },
  });
  revalidateExpensePages();
  return receipt;
}

export async function deleteReceipt(id: string) {
  await db.expenseReceipt.delete({ where: { id } });
  revalidateExpensePages();
}

export async function listReceipts(expenseId: string) {
  return db.expenseReceipt.findMany({
    where: { expenseId },
    orderBy: { createdAt: "asc" },
    select: { id: true, image: true },
  });
}
