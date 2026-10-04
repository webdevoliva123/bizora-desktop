import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import { getMonthlyAccount } from "@/lib/db/monthly-account";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        {
          error: "Business setup is not complete.",
        },
        { status: 400 },
      );
    }

    const { id } = await params;

    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid customer ID.",
        },
        { status: 400 },
      );
    }

    const url = new URL(request.url);

    const month = url.searchParams.get("month");

    if (!month || !MONTH_PATTERN.test(month)) {
      return NextResponse.json(
        {
          error: "Month must be in YYYY-MM format.",
        },
        { status: 400 },
      );
    }

    const account = getMonthlyAccount(
      setup.businessId,
      customerId,
      month,
    );

    if (!account) {
      return NextResponse.json(
        {
          error: "Customer not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      account,
    });
  } catch (error) {
    console.error(
      "Failed to get monthly account:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get monthly account.",
      },
      { status: 500 },
    );
  }
}