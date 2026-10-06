import { NextResponse } from "next/server";

import { getMonthlyAccountBill } from "@/lib/db/monthly-account-bill";
import { getSetupStatus } from "@/lib/db/business";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        {
          error: "Business setup is incomplete.",
        },
        {
          status: 400,
        },
      );
    }

    const { id } = await context.params;

    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid customer ID.",
        },
        {
          status: 400,
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const accountMonth =
      searchParams.get("month")?.trim() ?? "";

    if (!/^\d{4}-\d{2}$/.test(accountMonth)) {
      return NextResponse.json(
        {
          error: "A valid month is required in YYYY-MM format.",
        },
        {
          status: 400,
        },
      );
    }

    const bill = getMonthlyAccountBill(
      setup.businessId,
      customerId,
      accountMonth,
    );

    if (!bill) {
      return NextResponse.json(
        {
          error: "Monthly account not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error(
      "[monthly-account-bill] Failed to load bill:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load monthly account bill.",
      },
      {
        status: 500,
      },
    );
  }
}