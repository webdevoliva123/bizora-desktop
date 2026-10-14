import { and, asc, eq, isNull, like, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { businesses, workerPayments } from "@/lib/db/schema";
import { getWorkerById } from "@/lib/db/workers";
import type {
  WorkerSalaryMonth,
  WorkerSalaryPayment,
  WorkerSalaryStatement,
  WorkerSalaryYear,
} from "@/lib/types/worker";

export type WorkerPaymentInput = {
  paymentPeriod: string; // yyyy-MM, the salary month
  amount: number; // paise
  paymentMethod: string;
  paymentDate: string; // yyyy-MM-dd
  reference?: string | null;
  notes?: string | null;
};

function clean(value?: string | null) {
  return value?.trim() || null;
}

export function parseWorkerPaymentInput(input: WorkerPaymentInput) {
  const paymentPeriod = (input.paymentPeriod ?? "").trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(paymentPeriod)) {
    throw new Error("Choose a valid salary month.");
  }

  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }

  const paymentMethod = (input.paymentMethod ?? "").trim();
  if (!paymentMethod) throw new Error("Select a payment method.");

  if (
    typeof input.paymentDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.paymentDate) ||
    Number.isNaN(Date.parse(`${input.paymentDate}T00:00:00`))
  ) {
    throw new Error("Please provide a valid payment date.");
  }

  return {
    paymentPeriod,
    amount: input.amount,
    paymentMethod,
    paymentDate: input.paymentDate,
    reference: clean(input.reference),
    notes: clean(input.notes),
  };
}

export function createWorkerPayment(
  businessId: number,
  workerId: number,
  input: ReturnType<typeof parseWorkerPaymentInput>,
) {
  if (!getWorkerById(businessId, workerId)) {
    throw new Error("Worker not found.");
  }

  const result = db
    .insert(workerPayments)
    .values({
      businessId,
      workerId,
      ...input,
      createdAt: new Date().toISOString(),
    })
    .run();

  return Number(result.lastInsertRowid);
}

export function deleteWorkerPayment(
  businessId: number,
  workerId: number,
  paymentId: number,
) {
  const existing = db
    .select({ id: workerPayments.id })
    .from(workerPayments)
    .where(
      and(
        eq(workerPayments.id, paymentId),
        eq(workerPayments.workerId, workerId),
        eq(workerPayments.businessId, businessId),
      ),
    )
    .get();

  if (!existing) return false;

  db.delete(workerPayments).where(eq(workerPayments.id, paymentId)).run();

  return true;
}

/** Salary payments for one calendar year, grouped Jan to Dec by salary month. */
export function getWorkerSalaryYear(
  businessId: number,
  workerId: number,
  year: number,
): WorkerSalaryYear {
  const prefix = `${year}-%`;

  const rows = db
    .select()
    .from(workerPayments)
    .where(
      and(
        eq(workerPayments.businessId, businessId),
        eq(workerPayments.workerId, workerId),
        or(
          like(workerPayments.paymentPeriod, prefix),
          // Older rows without a salary month fall back to the payment date
          and(
            isNull(workerPayments.paymentPeriod),
            like(workerPayments.paymentDate, prefix),
          ),
        ),
      ),
    )
    .orderBy(asc(workerPayments.paymentDate), asc(workerPayments.id))
    .all();

  const months: WorkerSalaryMonth[] = Array.from({ length: 12 }, (_, index) => ({
    month: `${year}-${String(index + 1).padStart(2, "0")}`,
    total: 0,
    payments: [],
  }));

  for (const row of rows) {
    const key = row.paymentPeriod ?? row.paymentDate.slice(0, 7);
    const bucket = months.find((month) => month.month === key);

    if (!bucket) continue;

    const payment: WorkerSalaryPayment = {
      id: row.id,
      amount: row.amount,
      paymentMethod: row.paymentMethod,
      paymentDate: row.paymentDate,
      paymentPeriod: key,
      reference: row.reference,
      notes: row.notes,
    };

    bucket.payments.push(payment);
    bucket.total += row.amount;
  }

  const yearRows = db
    .select({
      year: sql<string>`DISTINCT substr(COALESCE(${workerPayments.paymentPeriod}, ${workerPayments.paymentDate}), 1, 4)`,
    })
    .from(workerPayments)
    .where(
      and(
        eq(workerPayments.businessId, businessId),
        eq(workerPayments.workerId, workerId),
      ),
    )
    .all();

  const availableYears = Array.from(
    new Set([
      new Date().getFullYear(),
      year,
      ...yearRows.map((row) => Number(row.year)).filter(Boolean),
    ]),
  ).sort((a, b) => b - a);

  return {
    year,
    availableYears,
    months,
    totalPaid: months.reduce((sum, month) => sum + month.total, 0),
    paymentCount: months.reduce((sum, month) => sum + month.payments.length, 0),
  };
}

/** Everything the printable yearly salary statement needs. */
export function getWorkerSalaryStatement(
  businessId: number,
  workerId: number,
  year: number,
): WorkerSalaryStatement | null {
  const business = db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .get();

  const worker = getWorkerById(businessId, workerId);

  if (!business || !worker) return null;

  return {
    year,
    business: {
      name: business.name,
      logoPath: business.logoPath,
      businessCategory: business.businessCategory,
      currency: business.currency,
      address: business.address,
      city: business.city,
      state: business.state,
      postalCode: business.postalCode,
      phone: business.phone,
      email: business.email,
    },
    worker: {
      id: worker.id,
      name: worker.name,
      role: worker.role,
      phone: worker.phone,
      paymentType: worker.paymentType,
      defaultPaymentAmount: worker.defaultPaymentAmount,
    },
    salary: getWorkerSalaryYear(businessId, workerId, year),
  };
}