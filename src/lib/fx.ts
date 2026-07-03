import "server-only";

import { db } from "@/lib/db";
import type { Currency } from "@/lib/expense-constants";

// AED is not in ECB data; it has been hard-pegged to the dollar since 1997.
const AED_PER_USD = 3.6725;

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

export type FxSource = "ecb" | "peg" | "same" | "stale-cache";

export interface FxResult {
  rate: number;
  source: FxSource;
}

type UsdTable = Record<Currency, number>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchUsdTable(dateISO: string): Promise<UsdTable> {
  const res = await fetch(
    `${FRANKFURTER_BASE}/${dateISO}?base=USD&symbols=EUR,THB`
  );
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
  const data = (await res.json()) as { rates: { EUR: number; THB: number } };
  return { USD: 1, EUR: data.rates.EUR, THB: data.rates.THB, AED: AED_PER_USD };
}

/**
 * USD-based rate table for a date, cached in the FxRate table so each date is
 * fetched at most once. Weekend/holiday dates get the closest prior business
 * day's rates (Frankfurter's behavior) cached under the requested date.
 */
async function getUsdTable(
  dateISO: string
): Promise<{ table: UsdTable; stale: boolean }> {
  const date = dateISO > todayISO() ? todayISO() : dateISO;

  const cached = await db.fxRate.findUnique({ where: { date } });
  if (cached) return { table: JSON.parse(cached.rates), stale: false };

  try {
    const table = await fetchUsdTable(date);
    await db.fxRate.upsert({
      where: { date },
      create: { date, rates: JSON.stringify(table) },
      update: { rates: JSON.stringify(table) },
    });
    return { table, stale: false };
  } catch {
    const fallback =
      (await db.fxRate.findFirst({
        where: { date: { lte: date } },
        orderBy: { date: "desc" },
      })) ?? (await db.fxRate.findFirst({ orderBy: { date: "desc" } }));
    if (!fallback) {
      throw new Error(
        "No exchange rate available offline — set a manual rate on this expense"
      );
    }
    return { table: JSON.parse(fallback.rates), stale: true };
  }
}

/** Multiplier converting `from` amounts into `to` amounts on the given date. */
export async function getRate(
  dateISO: string,
  from: Currency,
  to: Currency
): Promise<FxResult> {
  if (from === to) return { rate: 1, source: "same" };

  const { table, stale } = await getUsdTable(dateISO);
  const rate = table[to] / table[from];

  if (stale) return { rate, source: "stale-cache" };
  if (from === "AED" || to === "AED") return { rate, source: "peg" };
  return { rate, source: "ecb" };
}

export function convertMinor(amountMinor: number, rate: number) {
  return Math.round(amountMinor * rate);
}
