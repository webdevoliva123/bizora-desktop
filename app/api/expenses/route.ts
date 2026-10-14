import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import {
  createExpense,
  getExpenses,
  parseExpenseInput,
  type ExpenseInput,
} from "@/lib/db/expenses";

export async function GET() {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      );
    }

    return NextResponse.json({ expenses: getExpenses(setup.businessId) });
  } catch (error) {
    console.error("[expenses] Failed to fetch expenses:", error);

    return NextResponse.json(
      { error: "Failed to fetch expenses." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      );
    }

    let body: ExpenseInput;

    try {
      body = (await request.json()) as ExpenseInput;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    let input: ReturnType<typeof parseExpenseInput>;

    try {
      input = parseExpenseInput(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid expense." },
        { status: 400 },
      );
    }

    const expense = createExpense(setup.businessId, input);

    return NextResponse.json(
      { message: "Expense created successfully.", expense },
      { status: 201 },
    );
  } catch (error) {
    console.error("[expenses] Failed to create expense:", error);

    return NextResponse.json(
      { error: "Failed to create expense." },
      { status: 500 },
    );
  }
}