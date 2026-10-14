import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import { getWorkerSalaryStatement } from "@/lib/db/worker-payments";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const workerId = Number(id);
    const year = Number(new URL(request.url).searchParams.get("year"));

    if (!Number.isInteger(workerId) || workerId <= 0) {
      return NextResponse.json({ error: "Invalid worker ID." }, { status: 400 });
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "A valid year is required." },
        { status: 400 },
      );
    }

    const statement = getWorkerSalaryStatement(setup.businessId, workerId, year);

    if (!statement) {
      return NextResponse.json({ error: "Worker not found." }, { status: 404 });
    }

    return NextResponse.json(statement);
  } catch (error) {
    console.error("[workers] Failed to load salary statement:", error);

    return NextResponse.json(
      { error: "Failed to load salary statement." },
      { status: 500 },
    );
  }
}