export const CURRENCIES = ["USD", "EUR", "THB", "AED"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const HOME_CURRENCIES = ["USD", "EUR", "THB"] as const;
export type HomeCurrency = (typeof HOME_CURRENCIES)[number];

export const UNASSIGNED_HOME_CURRENCY: HomeCurrency = "USD";

export type ExpenseStatusValue =
  | "NOT_FILED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REIMBURSED";

export const STATUS_ORDER: ExpenseStatusValue[] = [
  "NOT_FILED",
  "PENDING_APPROVAL",
  "APPROVED",
  "REIMBURSED",
];

export const STATUS_META: Record<
  ExpenseStatusValue,
  { label: string; className: string; dotClassName: string }
> = {
  NOT_FILED: {
    label: "Not filed",
    className: "bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground/60",
  },
  PENDING_APPROVAL: {
    label: "Pending approval",
    className: "bg-[#d4a24c]/15 text-[#a97b2e] dark:text-[#d4a24c]",
    dotClassName: "bg-[#d4a24c]",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-[#6a94a8]/15 text-[#4d7488] dark:text-[#8fb4c6]",
    dotClassName: "bg-[#6a94a8]",
  },
  REIMBURSED: {
    label: "Reimbursed",
    className: "bg-[#3f8f5c] text-white",
    dotClassName: "bg-[#3f8f5c] ring-1 ring-white/80",
  },
};

export type PaymentMethodValue = "PERSONAL" | "CORPORATE_CARD";

export const PAYMENT_META: Record<
  PaymentMethodValue,
  { label: string; shortLabel: string }
> = {
  PERSONAL: { label: "Personal (reimbursable)", shortLabel: "Personal" },
  CORPORATE_CARD: { label: "Corporate card", shortLabel: "Corp card" },
};

export const FX_SOURCE_LABEL: Record<string, string> = {
  ecb: "ECB market rate",
  peg: "USD peg (AED)",
  same: "Same currency",
  manual: "Manual override",
  "stale-cache": "Cached rate (offline)",
};

/** Format integer minor units (cents/satang/fils) as a currency string. */
export function formatMinor(minor: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(minor / 100);
}

/** Parse a user-entered major-unit amount ("12.50") into minor units, or null. */
export function parseAmountToMinor(input: string): number | null {
  const value = parseFloat(input.replace(/,/g, ""));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
