"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import {
  getPasscodeSettings,
  hashPasscode,
  isValidPasscode,
  verifyPasscode,
} from "@/lib/passcode";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function setupPasscode(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const passcode = String(formData.get("passcode") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isValidPasscode(passcode)) {
    return { error: "Passcode must be exactly 6 digits." };
  }
  if (passcode !== confirm) {
    return { error: "Passcodes don't match." };
  }

  const existing = await getPasscodeSettings();
  if (existing) {
    return { error: "A passcode is already set." };
  }

  await db.settings.create({
    data: { id: "singleton", passcodeHash: hashPasscode(passcode) },
  });

  const session = await getSession();
  session.authenticated = true;
  await session.save();

  redirect("/");
}

export async function login(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const passcode = String(formData.get("passcode") ?? "");

  if (!passcode) {
    return { error: "Enter your passcode." };
  }

  const settings = await getPasscodeSettings();
  if (!settings || !verifyPasscode(passcode, settings.passcodeHash)) {
    return { error: "Incorrect passcode." };
  }

  const session = await getSession();
  session.authenticated = true;
  await session.save();

  redirect("/");
}

export async function changePasscode(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const settings = await getPasscodeSettings();
  if (!settings || !verifyPasscode(current, settings.passcodeHash)) {
    return { error: "Current passcode is incorrect." };
  }
  if (!isValidPasscode(next)) {
    return { error: "New passcode must be exactly 6 digits." };
  }
  if (next !== confirm) {
    return { error: "New passcodes don't match." };
  }

  await db.settings.update({
    where: { id: "singleton" },
    data: { passcodeHash: hashPasscode(next) },
  });

  return { success: true };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
