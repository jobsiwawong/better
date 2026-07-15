"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** Whether an Anthropic API key is configured (DB first, then env). */
export async function getApiKeyStatus(): Promise<{ configured: boolean; source: "settings" | "env" | null }> {
  const settings = await db.settings.findUnique({
    where: { id: "singleton" },
    select: { anthropicApiKey: true },
  });
  if (settings?.anthropicApiKey?.trim()) return { configured: true, source: "settings" };
  if (process.env.ANTHROPIC_API_KEY?.trim()) return { configured: true, source: "env" };
  return { configured: false, source: null };
}

/** Save (or clear) the Anthropic API key. Basic shape validation only. */
export async function saveApiKey(rawKey: string): Promise<{ error?: string }> {
  const key = rawKey.trim();
  if (key && !key.startsWith("sk-ant-")) {
    return { error: "That doesn't look like an Anthropic key — it should start with \"sk-ant-\"." };
  }
  await db.settings.update({
    where: { id: "singleton" },
    data: { anthropicApiKey: key || null },
  });
  revalidatePath("/");
  return {};
}
