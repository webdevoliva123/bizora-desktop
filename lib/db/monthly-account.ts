import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
    customers,
    dailyEntries,
    monthlyAccountPayments
} from "@/lib/db/schema";
import { PAYMENT_TYPE } from "@/common";

export type MonthlyAccountStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID";

export interface MonthlyAccountPayment {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference: string | null;
  notes: string | null;
}

export interface MonthlyAccountEntry {
  id: number;
  entryDate: string;
  paymentType: PAYMENT_TYPE;
  paymentStatus: string;
  itemCount: number;
  total: number;
  paidAmount: number;
  paymentCount: number;
}

export interface MonthlyAccount {
  customerId: number;
  accountMonth: string;

  total: number;
  paidAmount: number;
  outstandingAmount: number;

  status: MonthlyAccountStatus;

  entries: MonthlyAccountEntry[];
  payments: MonthlyAccountPayment[];
}

function getMonthlyStatus(
  total: number,
  paidAmount: number,
): MonthlyAccountStatus {
  if (paidAmount <= 0) {
    return "UNPAID";
  }

  if (paidAmount >= total) {
    return "PAID";
  }

  return "PARTIAL";
}

export function getMonthlyAccount(
  businessId: number,
  customerId: number,
  accountMonth: string,
): MonthlyAccount | null {
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
    .limit(1)
    .all();

  if (!customer[0]) {
    return null;
  }

  /**
   * All entries for this customer in the selected month.
   *
   * Important:
   * monthlyAccountPayments are NOT joined here.
   * Monthly account payments belong to the customer/month,
   * not to individual daily entries.
   */
  const entries = db
  .select({
    id: dailyEntries.id,
    entryDate: dailyEntries.entryDate,
    paymentType: dailyEntries.paymentType,
    paymentStatus: dailyEntries.paymentStatus,

    itemCount: sql<number>`
      (
        SELECT COUNT(*)
        FROM daily_entry_items dei
        WHERE dei.entry_id = ${dailyEntries.id}
      )
    `,

    total: dailyEntries.total,

    paidAmount: sql<number>`
      (
        SELECT COALESCE(SUM(dep.amount), 0)
        FROM daily_entry_payments dep
        WHERE dep.entry_id = ${dailyEntries.id}
      )
    `,

    paymentCount: sql<number>`
      (
        SELECT COUNT(*)
        FROM daily_entry_payments dep
        WHERE dep.entry_id = ${dailyEntries.id}
      )
    `,
  })
  .from(dailyEntries)
  .where(
    and(
      eq(dailyEntries.businessId, businessId),
      eq(dailyEntries.customerId, customerId),
      sql`
        substr(${dailyEntries.entryDate}, 1, 7) = ${accountMonth}
      `,
    ),
  )
  .orderBy(asc(dailyEntries.entryDate))
  .all();

  /**
   * Monthly account payments.
   *
   * These payments belong to the customer + month,
   * not to individual daily entries.
   */
  const payments = db
    .select({
      id: monthlyAccountPayments.id,
      amount: monthlyAccountPayments.amount,
      paymentMethod: monthlyAccountPayments.paymentMethod,
      paymentDate: monthlyAccountPayments.paymentDate,
      reference: monthlyAccountPayments.reference,
      notes: monthlyAccountPayments.notes,
    })
    .from(monthlyAccountPayments)
    .where(
      and(
        eq(
          monthlyAccountPayments.businessId,
          businessId,
        ),
        eq(
          monthlyAccountPayments.customerId,
          customerId,
        ),
        eq(
          monthlyAccountPayments.accountMonth,
          accountMonth,
        ),
      ),
    )
    .orderBy(
      asc(monthlyAccountPayments.paymentDate),
      asc(monthlyAccountPayments.id),
    )
    .all();

  /**
   * Monthly account total includes ONLY
   * daily entries marked as MONTHLY.
   */
  const total = entries
    .filter(
      (entry) => entry.paymentType === "MONTHLY",
    )
    .reduce(
      (sum, entry) => sum + Number(entry.total),
      0,
    );

  const paidAmount = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount),
    0,
  );

  const outstandingAmount = Math.max(
    total - paidAmount,
    0,
  );

  const status = getMonthlyStatus(
    total,
    paidAmount,
  );

  /**
   * Monthly entries do not have individual payments.
   *
   * Their payment belongs to the monthly account.
   *
   * Immediate entries keep their actual
   * daily payment information.
   */
  const monthlyEntries: MonthlyAccountEntry[] =
    entries.map((entry) => {
      const isMonthly =
        entry.paymentType === "MONTHLY";

      return {
        id: entry.id,
        entryDate: entry.entryDate,
        paymentType: entry.paymentType as PAYMENT_TYPE,
        paymentStatus: isMonthly
          ? "UNPAID"
          : entry.paymentStatus,
        itemCount: Number(entry.itemCount),
        total: Number(entry.total),
        paidAmount: isMonthly
          ? 0
          : Number(entry.paidAmount),
        paymentCount: isMonthly
          ? 0
          : Number(entry.paymentCount),
      };
    });

  return {
    customerId,
    accountMonth,

    total,
    paidAmount,
    outstandingAmount,

    status,

    entries: monthlyEntries,

    payments: payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      reference: payment.reference,
      notes: payment.notes,
    })),
  };
}