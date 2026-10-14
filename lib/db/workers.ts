import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { workerPayments, workers } from "@/lib/db/schema";
import {
    WORKER_PAYMENT_TYPES,
    type WorkerDetails,
    type WorkerListItem,
    type WorkerPaymentType,
    type WorkerStatusFilter,
} from "@/lib/types/worker";

export type WorkerInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  joiningDate?: string | null;
  paymentType?: string | null;
  defaultPaymentAmount?: number | null; // paise
  address?: string | null;
  notes?: string | null;
};

function clean(value?: string | null) {
  return value?.trim() || null;
}

/** Validates and cleans a worker payload. Shared by the API routes. */
export function parseWorkerInput(input: WorkerInput) {
  const name = (input.name ?? "").trim().replace(/\s+/g, " ");

  if (!name) throw new Error("Worker name is required.");
  if (name.length > 120) throw new Error("Worker name is too long.");

  const email = clean(input.email);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const joiningDate = clean(input.joiningDate);
  if (
    joiningDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(joiningDate) ||
      Number.isNaN(Date.parse(`${joiningDate}T00:00:00`)))
  ) {
    throw new Error("Please provide a valid joining date.");
  }

  const paymentType = clean(input.paymentType)?.toUpperCase() ?? null;
  if (
    paymentType &&
    !WORKER_PAYMENT_TYPES.includes(paymentType as WorkerPaymentType)
  ) {
    throw new Error("Invalid payment type.");
  }

  const defaultPaymentAmount = input.defaultPaymentAmount ?? null;
  if (
    defaultPaymentAmount !== null &&
    (!Number.isSafeInteger(defaultPaymentAmount) || defaultPaymentAmount < 0)
  ) {
    throw new Error("Enter a valid payment amount.");
  }

  return {
    name,
    phone: clean(input.phone),
    email,
    role: clean(input.role),
    joiningDate,
    paymentType,
    defaultPaymentAmount,
    address: clean(input.address),
    notes: clean(input.notes),
  };
}

export interface GetWorkersOptions {
  status?: WorkerStatusFilter;
  search?: string;
}

export function getWorkers(
  businessId: number,
  options: GetWorkersOptions = {},
): WorkerListItem[] {
  const { status = "ALL", search = "" } = options;

  const conditions = [eq(workers.businessId, businessId)];

  if (status === "ACTIVE") conditions.push(eq(workers.active, true));
  if (status === "INACTIVE") conditions.push(eq(workers.active, false));

  const value = search.trim().toLowerCase();

  if (value) {
    const pattern = `%${value}%`;

    conditions.push(
      sql`(
        LOWER(${workers.name}) LIKE ${pattern}
        OR LOWER(COALESCE(${workers.phone}, '')) LIKE ${pattern}
        OR LOWER(COALESCE(${workers.role}, '')) LIKE ${pattern}
      )`,
    );
  }

  return db
    .select({
      id: workers.id,
      name: workers.name,
      phone: workers.phone,
      email: workers.email,
      role: workers.role,
      joiningDate: workers.joiningDate,
      paymentType: workers.paymentType,
      defaultPaymentAmount: workers.defaultPaymentAmount,
      active: workers.active,
      createdAt: workers.createdAt,
    })
    .from(workers)
    .where(and(...conditions))
    .orderBy(desc(workers.active), asc(sql`LOWER(${workers.name})`))
    .all();
}

export function getWorkerById(businessId: number, workerId: number) {
  return db
    .select()
    .from(workers)
    .where(and(eq(workers.id, workerId), eq(workers.businessId, businessId)))
    .get();
}

export function getWorkerDetails(
  businessId: number,
  workerId: number,
): WorkerDetails | null {
  const worker = getWorkerById(businessId, workerId);

  if (!worker) return null;

  const summary = db
    .select({
      total: sql<number>`COALESCE(SUM(${workerPayments.amount}), 0)`,
      count: sql<number>`COUNT(${workerPayments.id})`,
      last: sql<string | null>`MAX(${workerPayments.paymentDate})`,
    })
    .from(workerPayments)
    .where(
      and(
        eq(workerPayments.businessId, businessId),
        eq(workerPayments.workerId, workerId),
      ),
    )
    .get();

  return {
    id: worker.id,
    businessId: worker.businessId,
    name: worker.name,
    phone: worker.phone,
    email: worker.email,
    role: worker.role,
    joiningDate: worker.joiningDate,
    paymentType: worker.paymentType,
    defaultPaymentAmount: worker.defaultPaymentAmount,
    address: worker.address,
    notes: worker.notes,
    active: worker.active,
    createdAt: worker.createdAt,
    updatedAt: worker.updatedAt,
    summary: {
      totalPaid: Number(summary?.total ?? 0),
      paymentCount: Number(summary?.count ?? 0),
      lastPaymentDate: summary?.last ?? null,
    },
  };
}

export function createWorker(
  businessId: number,
  input: ReturnType<typeof parseWorkerInput>,
) {
  const now = new Date().toISOString();

  const result = db
    .insert(workers)
    .values({ businessId, ...input, active: true, createdAt: now, updatedAt: now })
    .run();

  return Number(result.lastInsertRowid);
}

export function updateWorker(
  businessId: number,
  workerId: number,
  input: ReturnType<typeof parseWorkerInput>,
) {
  if (!getWorkerById(businessId, workerId)) return false;

  db.update(workers)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(and(eq(workers.id, workerId), eq(workers.businessId, businessId)))
    .run();

  return true;
}

export function setWorkerActive(
  businessId: number,
  workerId: number,
  active: boolean,
) {
  if (!getWorkerById(businessId, workerId)) return false;

  db.update(workers)
    .set({ active, updatedAt: new Date().toISOString() })
    .where(and(eq(workers.id, workerId), eq(workers.businessId, businessId)))
    .run();

  return true;
}