"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TAG_PALETTE } from "@/lib/tag-palette";

function revalidateExpensePages() {
  revalidatePath("/expenses");
}

export async function createExpenseCategory(name: string, color?: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required");

  const existing = await db.expenseCategory.findUnique({
    where: { name: trimmed },
  });
  if (existing) return existing;

  const count = await db.expenseCategory.count();
  const category = await db.expenseCategory.create({
    data: {
      name: trimmed,
      color: color ?? TAG_PALETTE[count % TAG_PALETTE.length],
    },
  });
  revalidateExpensePages();
  return category;
}

export async function updateExpenseCategory(
  id: string,
  data: { name?: string; color?: string }
) {
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error("Category name is required");
    const conflict = await db.expenseCategory.findUnique({
      where: { name: trimmed },
    });
    if (conflict && conflict.id !== id)
      throw new Error(`A category named "${trimmed}" already exists`);
    data = { ...data, name: trimmed };
  }
  const category = await db.expenseCategory.update({ where: { id }, data });
  revalidateExpensePages();
  return category;
}

export async function deleteExpenseCategory(id: string) {
  await db.expenseCategory.delete({ where: { id } });
  revalidateExpensePages();
}

export async function listExpenseCategories() {
  return db.expenseCategory.findMany({ orderBy: { name: "asc" } });
}

export async function listExpenseCategoriesWithUsage() {
  return db.expenseCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { expenses: true } } },
  });
}
