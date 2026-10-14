import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import { getExpenseStatement } from "@/lib/db/expenses";

export async function GET(request: Request) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ?? "";

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { error: "A valid month (yyyy-MM) is required." },
        { status: 400 },
      );
    }

    const rawCategory = searchParams.get("categoryId");
    const categoryId = rawCategory ? Number(rawCategory) : null;

    if (
      categoryId !== null &&
      (!Number.isInteger(categoryId) || categoryId <= 0)
    ) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const statement = getExpenseStatement(setup.businessId, month, categoryId);

    if (!statement) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    return NextResponse.json(statement);
  } catch (error) {
    console.error("[expenses] Failed to build statement:", error);

    return NextResponse.json(
      { error: "Failed to load the monthly statement." },
      { status: 500 },
    );
  }
}