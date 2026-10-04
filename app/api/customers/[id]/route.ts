import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import { getCustomerDetails } from "@/lib/db/customer-details";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
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

    const customer = getCustomerDetails(
      setup.businessId,
      customerId,
    );

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      customer,
    });
  } catch (error) {
    console.error(
      "Failed to get customer details:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get customer details.",
      },
      { status: 500 },
    );
  }
}