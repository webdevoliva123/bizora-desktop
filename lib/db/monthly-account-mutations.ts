import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  customers,
  dailyEntries,
  monthlyAccountPayments,
} from "@/lib/db/schema";

import { getMonthlyAccount } from "./monthly-account";

export type CreateMonthlyAccountPaymentInput = {
  businessId: number;
  customerId: number;
  accountMonth: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string | null;
  notes?: string | null;
};

export async function createMonthlyAccountPayment(
  input: CreateMonthlyAccountPaymentInput,
) {
  const {
    businessId,
    customerId,
    accountMonth,
    amount,
    paymentMethod,
    paymentDate,
    reference = null,
    notes = null,
  } = input;

  if (!/^\d{4}-\d{2}$/.test(accountMonth)) {
    throw new Error("Invalid account month.");
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (!paymentMethod.trim()) {
    throw new Error("Payment method is required.");
  }

  if (!paymentDate.trim()) {
    throw new Error("Payment date is required.");
  }

  const customer = db
    .select({
      id: customers.id,
    })
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.businessId, businessId),
      ),
    )
    .get();

  if (!customer) {
    throw new Error("Customer not found.");
  }

  /*
   * Only MONTHLY daily entries contribute to the
   * monthly account total.
   */
  const monthlyTotalResult = db
    .select({
      total: sql<number>`
        COALESCE(SUM(${dailyEntries.total}), 0)
      `,
    })
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.businessId, businessId),
        eq(dailyEntries.customerId, customerId),
        eq(dailyEntries.paymentType, "MONTHLY"),
        sql`substr(${dailyEntries.entryDate}, 1, 7) = ${accountMonth}`,
      ),
    )
    .get();

  const monthlyTotal = Number(
    monthlyTotalResult?.total ?? 0,
  );

  /*
   * Calculate all payments already recorded
   * for this customer's monthly account.
   */
  const paidResult = db
    .select({
      paid: sql<number>`
        COALESCE(SUM(${monthlyAccountPayments.amount}), 0)
      `,
    })
    .from(monthlyAccountPayments)
    .where(
      and(
        eq(monthlyAccountPayments.businessId, businessId),
        eq(monthlyAccountPayments.customerId, customerId),
        eq(
          monthlyAccountPayments.accountMonth,
          accountMonth,
        ),
      ),
    )
    .get();

  const paidAmount = Number(
    paidResult?.paid ?? 0,
  );

  const outstandingAmount = Math.max(
    monthlyTotal - paidAmount,
    0,
  );

  if (monthlyTotal <= 0) {
    throw new Error(
      "There is no monthly account balance for this month.",
    );
  }

  if (amount > outstandingAmount) {
    throw new Error(
      `Payment cannot exceed the outstanding amount of ${(
        outstandingAmount / 100
      ).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      })}.`,
    );
  }

  /*
   * Insert the monthly account payment.
   */
  db.insert(monthlyAccountPayments)
    .values({
      businessId,
      customerId,
      accountMonth,
      amount,
      paymentMethod: paymentMethod.trim(),
      paymentDate: paymentDate.trim(),
      reference: reference?.trim() || null,
      notes: notes?.trim() || null,
    })
    .run();

  /*
   * Return the refreshed monthly account so
   * the UI can immediately update its totals.
   */
  return getMonthlyAccount(
    businessId,
    customerId,
    accountMonth,
  );
}