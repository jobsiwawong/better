"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const passcode = String(formData.get("passcode") ?? "");

  if (!passcode) {
    return { error: "Enter your passcode." };
  }

  if (passcode !== process.env.APP_PASSCODE) {
    return { error: "Incorrect passcode." };
  }

  const session = await getSession();
  session.authenticated = true;
  await session.save();

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
