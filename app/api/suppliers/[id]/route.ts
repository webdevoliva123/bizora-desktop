
import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import {
  deleteSupplier,
  getSupplierById,
  updateSupplier,
  type SupplierInput,
} from "@/lib/db/suppliers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseSupplierId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const supplierId = parseSupplierId(id);

    if (!supplierId) {
      return NextResponse.json(
        { error: "Invalid supplier ID." },
        { status: 400 },
      );
    }

    const supplier = getSupplierById(setup.businessId, supplierId);

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("[suppliers] Failed to fetch supplier:", error);

    return NextResponse.json(
      { error: "Failed to fetch supplier." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const supplierId = parseSupplierId(id);

    if (!supplierId) {
      return NextResponse.json(
        { error: "Invalid supplier ID." },
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

    const supplier = updateSupplier(
      setup.businessId,
      supplierId,
      body,
    );

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Supplier updated successfully.",
      supplier,
    });
  } catch (error) {
    console.error("[suppliers] Failed to update supplier:", error);

    return NextResponse.json(
      { error: "Failed to update supplier." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return NextResponse.json(
        { error: "Business setup is incomplete." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const supplierId = parseSupplierId(id);

    if (!supplierId) {
      return NextResponse.json(
        { error: "Invalid supplier ID." },
        { status: 400 },
      );
    }

    const result = deleteSupplier(setup.businessId, supplierId);

    if (!result.success) {
      if (result.reason === "not_found") {
        return NextResponse.json(
          { error: "Supplier not found." },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error:
            "This supplier has linked stock purchases. Deactivate the supplier instead.",
          code: "SUPPLIER_HAS_PURCHASES",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: "Supplier deleted successfully.",
    });
  } catch (error) {
    console.error("[suppliers] Failed to delete supplier:", error);

    return NextResponse.json(
      { error: "Failed to delete supplier." },
      { status: 500 },
    );
  }
}
