"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { expenseCategories } from "@/lib/db/schema";
import { getSetupStatus } from "@/lib/db/business";
import {
  createExpense,
  createExpenseCategory,
  deleteExpense,
  getExpenseCategoryById,
  parseExpenseInput,
  updateExpense,
  type ExpenseInput,
} from "@/lib/db/expenses";
import type { ExpenseCategoryOption } from "@/lib/types/expense";

export type ExpenseActionResult =
  | { success: true }
  | { success: false; error: string };

export type ExpenseCategoryResult =
  | { success: true; category: ExpenseCategoryOption }
  | { success: false; error: string };

async function run(fn: () => void | Promise<void>): Promise<ExpenseActionResult> {
  try {
    await fn();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

async function requireBusinessId(): Promise<number> {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    throw new Error("Complete your business setup first.");
  }

  return setup.businessId;
}

function validate(businessId: number, input: ExpenseInput) {
  const parsed = parseExpenseInput(input);

  if (parsed.categoryId !== null) {
    const category = getExpenseCategoryById(businessId, parsed.categoryId);

    if (!category) throw new Error("The selected category is unavailable.");
  }

  return parsed;
}

export async function createExpenseAction(
  input: ExpenseInput,
): Promise<ExpenseActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();

    createExpense(businessId, validate(businessId, input));

    revalidatePath("/expenses");
  });
}

export async function updateExpenseAction(
  expenseId: number,
  input: ExpenseInput,
): Promise<ExpenseActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();

    const updated = updateExpense(
      businessId,
      expenseId,
      validate(businessId, input),
    );

    if (!updated) throw new Error("Expense not found.");

    revalidatePath("/expenses");
  });
}

export async function deleteExpenseAction(
  expenseId: number,
): Promise<ExpenseActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();

    const result = deleteExpense(businessId, expenseId);

    if (!result.success) throw new Error("Expense not found.");

    revalidatePath("/expenses");
  });
}

/** Quick create, used by the category dropdown in the expense form. */
export async function createExpenseCategoryAction(
  name: string,
): Promise<ExpenseCategoryResult> {
  try {
    const businessId = await requireBusinessId();

    const cleaned = (name ?? "").trim().replace(/\s+/g, " ");

    if (!cleaned) throw new Error("Category name is required.");
    if (cleaned.length > 80) throw new Error("Category name is too long.");

    const duplicate = db
      .select({ id: expenseCategories.id })
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.businessId, businessId),
          sql`lower(${expenseCategories.name}) = ${cleaned.toLowerCase()}`,
        ),
      )
      .get();

    if (duplicate) throw new Error("A category with this name already exists.");

    const category = createExpenseCategory(businessId, cleaned);

    revalidatePath("/expenses");

    return { success: true, category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}