import { NextResponse } from "next/server";

import { getDailyEntryBill } from "@/lib/db/daily-entries";
import { getSetupStatus } from "@/lib/db/business";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        {
          error: "Business setup is not completed.",
        },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const entryId = Number(id);

    if (!Number.isInteger(entryId) || entryId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid daily entry ID.",
        },
        { status: 400 },
      );
    }

    const bill = getDailyEntryBill(
      setup.businessId,
      entryId,
    );

    if (!bill) {
      return NextResponse.json(
        {
          error: "Daily entry not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error(
      "Failed to load daily entry bill:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load daily entry bill.",
      },
      { status: 500 },
    );
  }
}