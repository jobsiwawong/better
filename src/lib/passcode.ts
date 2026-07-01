import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

const SIX_DIGITS = /^\d{6}$/;

export function isValidPasscode(code: string) {
  return SIX_DIGITS.test(code);
}

export function hashPasscode(code: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasscode(code: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(code, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function getPasscodeSettings() {
  return db.settings.findUnique({ where: { id: "singleton" } });
}

export async function isPasscodeConfigured() {
  const settings = await getPasscodeSettings();
  return !!settings;
}
