import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import {
  createMonthlyAccountPayment,
} from "@/lib/db/monthly-account-mutations";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
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

    const body = await request.json();

    const accountMonth =
      typeof body.accountMonth === "string"
        ? body.accountMonth.trim()
        : "";

    const amount = Number(body.amount);

    const paymentMethod =
      typeof body.paymentMethod === "string"
        ? body.paymentMethod.trim()
        : "";

    const paymentDate =
      typeof body.paymentDate === "string"
        ? body.paymentDate.trim()
        : "";

    const reference =
      typeof body.reference === "string"
        ? body.reference.trim()
        : null;

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : null;

    if (!/^\d{4}-\d{2}$/.test(accountMonth)) {
      return NextResponse.json(
        {
          error: "Invalid account month.",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error: "Payment amount must be greater than zero.",
        },
        { status: 400 },
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        {
          error: "Payment method is required.",
        },
        { status: 400 },
      );
    }

    if (!paymentDate) {
      return NextResponse.json(
        {
          error: "Payment date is required.",
        },
        { status: 400 },
      );
    }

    const account = await createMonthlyAccountPayment({
      businessId: setup.businessId,
      customerId,
      accountMonth,
      amount,
      paymentMethod,
      paymentDate,
      reference: reference || null,
      notes: notes || null,
    });

    return NextResponse.json({
      account,
    });
  } catch (error) {
    console.error(
      "Failed to create monthly account payment:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to record monthly payment.",
      },
      { status: 400 },
    );
  }
}