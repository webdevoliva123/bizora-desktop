import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import {
  getWorkerDetails,
  parseWorkerInput,
  updateWorker,
  type WorkerInput,
} from "@/lib/db/workers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolve(context: RouteContext) {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    return {
      error: NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      ),
    };
  }

  const { id } = await context.params;
  const workerId = Number(id);

  if (!Number.isInteger(workerId) || workerId <= 0) {
    return {
      error: NextResponse.json({ error: "Invalid worker ID." }, { status: 400 }),
    };
  }

  return { businessId: setup.businessId, workerId };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const result = await resolve(context);
    if ("error" in result) return result.error;

    const worker = getWorkerDetails(result.businessId, result.workerId);

    if (!worker) {
      return NextResponse.json({ error: "Worker not found." }, { status: 404 });
    }

    return NextResponse.json({ worker });
  } catch (error) {
    console.error("[workers] Failed to load worker:", error);

    return NextResponse.json(
      { error: "Failed to load worker." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const result = await resolve(context);
    if ("error" in result) return result.error;

    let input: ReturnType<typeof parseWorkerInput>;

    try {
      input = parseWorkerInput((await request.json()) as WorkerInput);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid worker." },
        { status: 400 },
      );
    }

    if (!updateWorker(result.businessId, result.workerId, input)) {
      return NextResponse.json({ error: "Worker not found." }, { status: 404 });
    }

    return NextResponse.json({
      worker: getWorkerDetails(result.businessId, result.workerId),
    });
  } catch (error) {
    console.error("[workers] Failed to update worker:", error);

    return NextResponse.json(
      { error: "Failed to update worker." },
      { status: 500 },
    );
  }
}