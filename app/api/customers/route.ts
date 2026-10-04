import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import {
    createCustomer,
    CreateCustomerInput,
  getCustomers,
  type GetCustomersOptions,
} from "@/lib/db/customers";
import type {
  CustomerTypeFilter,
} from "@/lib/types/customer";

const CUSTOMER_TYPES: CustomerTypeFilter[] = [
  "ALL",
  "PERSON",
  "BUSINESS",
];

function isCustomerTypeFilter(
  value: string,
): value is CustomerTypeFilter {
  return CUSTOMER_TYPES.includes(
    value as CustomerTypeFilter,
  );
}

export async function GET(request: Request) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        {
          error:
            "Business setup is not completed.",
        },
        { status: 400 },
      );
    }

    const url = new URL(request.url);

    const search =
      url.searchParams.get("search")?.trim() ?? "";

    const typeParam =
      url.searchParams.get("type")?.toUpperCase() ??
      "ALL";

    if (!isCustomerTypeFilter(typeParam)) {
      return NextResponse.json(
        {
          error:
            "Invalid customer type filter.",
        },
        { status: 400 },
      );
    }

    const options: GetCustomersOptions = {
      search,
      type: typeParam,
    };

    const customers = getCustomers(
      setup.businessId,
      options,
    );

    return NextResponse.json({
      customers,
      total: customers.length,
    });
  } catch (error) {
    console.error(
      "Failed to load customers:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load customers.",
      },
      { status: 500 },
    );
  }
}



function cleanString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
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

    const body = await request.json();

    const type = body?.type;

    if (type !== "PERSON" && type !== "BUSINESS") {
      return NextResponse.json(
        {
          error: "Customer type must be PERSON or BUSINESS.",
        },
        { status: 400 },
      );
    }

    const phone = cleanString(body.phone);
    const email = cleanString(body.email);
    const address = cleanString(body.address);
    const city = cleanString(body.city);
    const state = cleanString(body.state);
    const postalCode = cleanString(body.postalCode);

    const firstName = cleanString(body.firstName);
    const lastName = cleanString(body.lastName);

    const businessName = cleanString(body.businessName);
    const contactPerson = cleanString(body.contactPerson);
    const taxRegistrationNumber = cleanString(
      body.taxRegistrationNumber,
    );

    if (type === "PERSON" && !firstName) {
      return NextResponse.json(
        {
          error: "First name is required.",
        },
        { status: 400 },
      );
    }

    if (type === "BUSINESS" && !businessName) {
      return NextResponse.json(
        {
          error: "Business name is required.",
        },
        { status: 400 },
      );
    }

    const customerInput: CreateCustomerInput = {
      businessId: setup.businessId,
      type,

      phone,
      email,
      address,
      city,
      state,
      postalCode,

      firstName,
      lastName,

      businessName,
      contactPerson,
      taxRegistrationNumber,
    };

    const customerId = createCustomer(customerInput);

    return NextResponse.json(
      {
        success: true,
        customerId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create customer:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create customer.",
      },
      { status: 500 },
    );
  }
}