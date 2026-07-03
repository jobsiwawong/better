import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  STATUS_META,
  PAYMENT_META,
  UNASSIGNED_HOME_CURRENCY,
  type ExpenseStatusValue,
  type PaymentMethodValue,
} from "@/lib/expense-constants";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const tripId = request.nextUrl.searchParams.get("tripId");

  const trip =
    tripId && tripId !== "unassigned"
      ? await db.trip.findUnique({ where: { id: tripId } })
      : null;

  const where =
    tripId === "unassigned"
      ? { tripId: null }
      : trip
        ? { tripId: trip.id }
        : {};

  const expenses = await db.expense.findMany({
    where,
    include: {
      category: true,
      approver: true,
      trip: true,
      _count: { select: { receipts: true } },
    },
    orderBy: { date: "asc" },
  });

  const homeCurrency = trip?.homeCurrency ?? UNASSIGNED_HOME_CURRENCY;

  const header = [
    "Date",
    "Merchant",
    "Trip",
    "Category",
    "Amount",
    "Currency",
    "Rate",
    "Rate source",
    `Converted (${trip || tripId === "unassigned" ? homeCurrency : "home"})`,
    "Status",
    "Payment method",
    "Approver",
    "Notes",
    "Receipts",
  ];

  const rows = expenses.map((e) =>
    [
      e.date.toISOString().slice(0, 10),
      e.merchant,
      e.trip?.name ?? "",
      e.category?.name ?? "",
      (e.amountMinor / 100).toFixed(2),
      e.currency,
      e.fxRate.toFixed(6),
      e.fxSource,
      (e.convertedMinor / 100).toFixed(2),
      STATUS_META[e.status as ExpenseStatusValue]?.label ?? e.status,
      PAYMENT_META[e.paymentMethod as PaymentMethodValue]?.label ?? e.paymentMethod,
      e.approver?.name ?? "",
      e.notes ?? "",
      String(e._count.receipts),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  const slug = (trip?.name ?? (tripId === "unassigned" ? "unassigned" : "all"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="expenses-${slug}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
