import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import { getReport } from "@/lib/db/reports";
import { currentPeriodKey, isValidPeriod } from "@/lib/reports/period";

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
    const type = searchParams.get("type") === "year" ? "year" : "month";
    const period = searchParams.get("period") ?? currentPeriodKey(type);

    if (!isValidPeriod(type, period)) {
      return NextResponse.json(
        { error: "A valid period (yyyy-MM or yyyy) is required." },
        { status: 400 },
      );
    }

    const report = getReport(setup.businessId, type, period);

    if (!report) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("[reports] Failed to build report:", error);

    return NextResponse.json(
      { error: "Failed to load the report." },
      { status: 500 },
    );
  }
}