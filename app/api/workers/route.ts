import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import {
  createWorker,
  getWorkers,
  parseWorkerInput,
  type WorkerInput,
} from "@/lib/db/workers";
import type { WorkerStatusFilter } from "@/lib/types/worker";

const STATUSES: WorkerStatusFilter[] = ["ALL", "ACTIVE", "INACTIVE"];

export async function GET(request: Request) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = (url.searchParams.get("status")?.toUpperCase() ??
      "ALL") as WorkerStatusFilter;

    if (!STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status filter." },
        { status: 400 },
      );
    }

    const workers = getWorkers(setup.businessId, { search, status });

    return NextResponse.json({ workers, total: workers.length });
  } catch (error) {
    console.error("[workers] Failed to load workers:", error);

    return NextResponse.json(
      { error: "Failed to load workers." },
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

    let body: WorkerInput;

    try {
      body = (await request.json()) as WorkerInput;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    let input: ReturnType<typeof parseWorkerInput>;

    try {
      input = parseWorkerInput(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid worker." },
        { status: 400 },
      );
    }

    const workerId = createWorker(setup.businessId, input);

    return NextResponse.json({ success: true, workerId }, { status: 201 });
  } catch (error) {
    console.error("[workers] Failed to create worker:", error);

    return NextResponse.json(
      { error: "Failed to create worker." },
      { status: 500 },
    );
  }
}