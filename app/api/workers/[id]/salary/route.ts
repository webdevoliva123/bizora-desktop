import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import {
  createWorkerPayment,
  getWorkerSalaryYear,
  parseWorkerPaymentInput,
  type WorkerPaymentInput,
} from "@/lib/db/worker-payments";
import { getWorkerById } from "@/lib/db/workers";

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

  if (!getWorkerById(setup.businessId, workerId)) {
    return {
      error: NextResponse.json({ error: "Worker not found." }, { status: 404 }),
    };
  }

  return { businessId: setup.businessId, workerId };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const result = await resolve(context);
    if ("error" in result) return result.error;

    const yearParam = new URL(request.url).searchParams.get("year");
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year." }, { status: 400 });
    }

    return NextResponse.json({
      salary: getWorkerSalaryYear(result.businessId, result.workerId, year),
    });
  } catch (error) {
    console.error("[workers] Failed to load salary:", error);

    return NextResponse.json(
      { error: "Failed to load salary details." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const result = await resolve(context);
    if ("error" in result) return result.error;

    let input: ReturnType<typeof parseWorkerPaymentInput>;

    try {
      input = parseWorkerPaymentInput(
        (await request.json()) as WorkerPaymentInput,
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid payment." },
        { status: 400 },
      );
    }

    const paymentId = createWorkerPayment(
      result.businessId,
      result.workerId,
      input,
    );

    return NextResponse.json({ success: true, paymentId }, { status: 201 });
  } catch (error) {
    console.error("[workers] Failed to record salary:", error);

    return NextResponse.json(
      { error: "Failed to record salary payment." },
      { status: 500 },
    );
  }
}