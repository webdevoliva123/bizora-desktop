
import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import {
  createSupplier,
  getSuppliers,
  type SupplierInput,
} from "@/lib/db/suppliers";

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
    const search = searchParams.get("search")?.trim() ?? "";
    const includeInactive =
      searchParams.get("includeInactive") !== "false";

    const suppliers = getSuppliers(
      setup.businessId,
      search,
      includeInactive,
    );

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("[suppliers] Failed to fetch suppliers:", error);

    return NextResponse.json(
      { error: "Failed to fetch suppliers." },
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

    let body: SupplierInput;

    try {
      body = (await request.json()) as SupplierInput;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return NextResponse.json(
        { error: "Supplier name is required." },
        { status: 400 },
      );
    }

    if (
      body.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const supplier = createSupplier(setup.businessId, body);

    return NextResponse.json(
      { message: "Supplier created successfully.", supplier },
      { status: 201 },
    );
  } catch (error) {
    console.error("[suppliers] Failed to create supplier:", error);

    return NextResponse.json(
      { error: "Failed to create supplier." },
      { status: 500 },
    );
  }
}

