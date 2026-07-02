"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function revalidateOwnerPages() {
  revalidatePath("/board");
  revalidatePath("/");
}

export async function createOwner(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Owner name is required");

  const existing = await db.owner.findUnique({ where: { name: trimmed } });
  if (existing) return existing;

  const owner = await db.owner.create({ data: { name: trimmed } });
  revalidateOwnerPages();
  return owner;
}

export async function updateOwner(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Owner name is required");

  const conflict = await db.owner.findUnique({ where: { name: trimmed } });
  if (conflict && conflict.id !== id)
    throw new Error(`A person named "${trimmed}" already exists`);

  const owner = await db.owner.update({ where: { id }, data: { name: trimmed } });
  revalidateOwnerPages();
  return owner;
}

export async function deleteOwner(id: string) {
  await db.owner.delete({ where: { id } });
  revalidateOwnerPages();
}

export async function listOwners() {
  return db.owner.findMany({ orderBy: { name: "asc" } });
}

export async function listOwnersWithUsage() {
  return db.owner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { taskOwners: true } } },
  });
}
