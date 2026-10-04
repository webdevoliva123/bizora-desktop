import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import { getDailyEntryById } from "@/lib/db/daily-entries";

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
    const { id } = await context.params;

    const entryId = Number(id);

    if (!Number.isInteger(entryId) || entryId <= 0) {
      return NextResponse.json(
        { error: "Invalid entry ID." },
        { status: 400 },
      );
    }

    const setupStatus = await getSetupStatus();

    if (
      !setupStatus.completed ||
      !setupStatus.businessId
    ) {
      return NextResponse.json(
        { error: "Business setup is not complete." },
        { status: 400 },
      );
    }

    const entry = getDailyEntryById(
      setupStatus.businessId,
      entryId,
    );

    if (!entry) {
      return NextResponse.json(
        { error: "Daily entry not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error(
      "Failed to load daily entry:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load daily entry." },
      { status: 500 },
    );
  }
}