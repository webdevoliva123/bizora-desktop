import { and, asc, desc, eq, like } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  businessRegistrations,
  businesses,
  expenseCategories,
  expenses,
  taxRegistrations,
} from "@/lib/db/schema";
import type {
  ExpenseCategoryOption,
  ExpenseListItem,
  ExpenseStatementData,
} from "@/lib/types/expense";

export type ExpenseInput = {
  categoryId?: number | null;
  expenseDate: string;
  description: string;
  amount: number; // paise
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
};

function clean(value?: string | null) {
  return value?.trim() || null;
}

/** Validates and cleans an expense payload. Shared by the actions and the API routes. */
export function parseExpenseInput(input: ExpenseInput) {
  const description = (input.description ?? "").trim().replace(/\s+/g, " ");

  if (!description) throw new Error("Description is required.");
  if (description.length > 200) throw new Error("Description is too long.");

  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }

  if (
    typeof input.expenseDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate) ||
    Number.isNaN(Date.parse(`${input.expenseDate}T00:00:00`))
  ) {
    throw new Error("Please provide a valid expense date.");
  }

  const paymentMethod = (input.paymentMethod ?? "").trim();
  if (!paymentMethod) throw new Error("Select a payment method.");

  if (
    input.categoryId != null &&
    (!Number.isSafeInteger(input.categoryId) || input.categoryId <= 0)
  ) {
    throw new Error("Invalid category.");
  }

  return {
    categoryId: input.categoryId ?? null,
    expenseDate: input.expenseDate,
    description,
    amount: input.amount,
    paymentMethod,
    reference: clean(input.reference),
    notes: clean(input.notes),
  };
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export function getExpenseCategories(
  businessId: number,
  includeInactive = false,
): ExpenseCategoryOption[] {
  return db
    .select({ id: expenseCategories.id, name: expenseCategories.name })
    .from(expenseCategories)
    .where(
      and(
        eq(expenseCategories.businessId, businessId),
        ...(includeInactive ? [] : [eq(expenseCategories.active, true)]),
      ),
    )
    .orderBy(asc(expenseCategories.name))
    .all();
}

export function getExpenseCategoryById(businessId: number, categoryId: number) {
  return db
    .select()
    .from(expenseCategories)
    .where(
      and(
        eq(expenseCategories.id, categoryId),
        eq(expenseCategories.businessId, businessId),
      ),
    )
    .get();
}

export function createExpenseCategory(
  businessId: number,
  name: string,
): ExpenseCategoryOption {
  return db
    .insert(expenseCategories)
    .values({
      businessId,
      name,
      active: true,
      createdAt: new Date().toISOString(),
    })
    .returning({ id: expenseCategories.id, name: expenseCategories.name })
    .get();
}

/* -------------------------------------------------------------------------- */
/* Expenses                                                                   */
/* -------------------------------------------------------------------------- */

const listColumns = {
  id: expenses.id,
  expenseDate: expenses.expenseDate,
  description: expenses.description,
  amount: expenses.amount,
  paymentMethod: expenses.paymentMethod,
  reference: expenses.reference,
  notes: expenses.notes,
  categoryId: expenses.categoryId,
  categoryName: expenseCategories.name,
};

export function getExpenses(businessId: number): ExpenseListItem[] {
  return db
    .select(listColumns)
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(eq(expenses.businessId, businessId))
    .orderBy(desc(expenses.expenseDate), desc(expenses.id))
    .all();
}

export function getExpenseById(businessId: number, expenseId: number) {
  return db
    .select(listColumns)
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(and(eq(expenses.id, expenseId), eq(expenses.businessId, businessId)))
    .get();
}

export function createExpense(
  businessId: number,
  input: ReturnType<typeof parseExpenseInput>,
) {
  const now = new Date().toISOString();

  const result = db
    .insert(expenses)
    .values({ businessId, ...input, createdAt: now, updatedAt: now })
    .run();

  return getExpenseById(businessId, Number(result.lastInsertRowid));
}

export function updateExpense(
  businessId: number,
  expenseId: number,
  input: ReturnType<typeof parseExpenseInput>,
) {
  const existing = getExpenseById(businessId, expenseId);

  if (!existing) return undefined;

  db.update(expenses)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(and(eq(expenses.id, expenseId), eq(expenses.businessId, businessId)))
    .run();

  return getExpenseById(businessId, expenseId);
}

export function deleteExpense(businessId: number, expenseId: number) {
  const existing = getExpenseById(businessId, expenseId);

  if (!existing) {
    return { success: false as const, reason: "not_found" as const };
  }

  db.delete(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.businessId, businessId)))
    .run();

  return { success: true as const };
}

/* -------------------------------------------------------------------------- */
/* Monthly statement (print / PDF)                                            */
/* -------------------------------------------------------------------------- */

export function getExpenseStatement(
  businessId: number,
  month: string, // yyyy-MM
  categoryId: number | null,
): ExpenseStatementData | null {
  const business = db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .get();

  if (!business) return null;

  const rows = db
    .select(listColumns)
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(
      and(
        eq(expenses.businessId, businessId),
        like(expenses.expenseDate, `${month}-%`),
        ...(categoryId ? [eq(expenses.categoryId, categoryId)] : []),
      ),
    )
    .orderBy(asc(expenses.expenseDate), asc(expenses.id))
    .all();

  const grouped = new Map<
    number | null,
    { categoryId: number | null; name: string; count: number; total: number }
  >();

  for (const row of rows) {
    const entry = grouped.get(row.categoryId) ?? {
      categoryId: row.categoryId,
      name: row.categoryName ?? "Uncategorised",
      count: 0,
      total: 0,
    };

    entry.count += 1;
    entry.total += row.amount;
    grouped.set(row.categoryId, entry);
  }

  const taxes = db
    .select({
      taxSystem: taxRegistrations.taxSystem,
      registrationNumber: taxRegistrations.registrationNumber,
    })
    .from(taxRegistrations)
    .where(eq(taxRegistrations.businessId, businessId))
    .all();

  const registrations = db
    .select({
      registrationType: businessRegistrations.registrationType,
      registrationNumber: businessRegistrations.registrationNumber,
    })
    .from(businessRegistrations)
    .where(eq(businessRegistrations.businessId, businessId))
    .all();

  return {
    month,
    business: {
      name: business.name,
      logoPath: business.logoPath,
      businessCategory: business.businessCategory,
      country: business.country,
      currency: business.currency,
      address: business.address,
      city: business.city,
      state: business.state,
      postalCode: business.postalCode,
      phone: business.phone,
      email: business.email,
    },
    expenses: rows,
    categories: Array.from(grouped.values()).sort((a, b) => b.total - a.total),
    taxRegistrations: taxes,
    businessRegistrations: registrations,
    totals: {
      expenseCount: rows.length,
      totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    },
  };
}