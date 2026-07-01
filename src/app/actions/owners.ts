"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createOwner(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Owner name is required");

  const existing = await db.owner.findUnique({ where: { name: trimmed } });
  if (existing) return existing;

  const owner = await db.owner.create({ data: { name: trimmed } });
  revalidatePath("/board");
  return owner;
}

export async function listOwners() {
  return db.owner.findMany({ orderBy: { name: "asc" } });
}
