import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/db/business";
import { getCustomerDetails } from "@/lib/db/customer-details";
import { deleteCustomer, updateCustomer } from "@/lib/db/customer-mutations";

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

export async function PATCH(
    request: Request,
    { params }: RouteContext,
  ) {
    try {
      const setup = await getSetupStatus();
  
      if (!setup.completed || !setup.businessId) {
        return NextResponse.json(
          { error: "Business setup is not complete." },
          { status: 400 },
        );
      }
  
      const { id } = await params;
      const customerId = Number(id);
  
      if (!Number.isInteger(customerId) || customerId <= 0) {
        return NextResponse.json(
          { error: "Invalid customer ID." },
          { status: 400 },
        );
      }
  
      const body = await request.json();
  
      await updateCustomer(
        setup.businessId,
        customerId,
        {
          phone: body.phone ?? null,
          email: body.email ?? null,
          address: body.address ?? null,
          city: body.city ?? null,
          state: body.state ?? null,
          postalCode: body.postalCode ?? null,
          active: body.active ?? true,
          person: body.person
            ? {
                firstName: body.person.firstName,
                lastName: body.person.lastName ?? null,
              }
            : undefined,
          business: body.business
            ? {
                businessName: body.business.businessName,
                contactPerson: body.business.contactPerson ?? null,
                taxRegistrationNumber:
                  body.business.taxRegistrationNumber ?? null,
              }
            : undefined,
        },
      );
  
      const customer = getCustomerDetails(
        setup.businessId,
        customerId,
      );
  
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found after update." },
          { status: 404 },
        );
      }
  
      return NextResponse.json({
        customer,
      });
    } catch (error) {
      console.error("PATCH /api/customers/[id] error:", error);
  
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to update customer.",
        },
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
          { error: "Business setup is not complete." },
          { status: 400 },
        );
      }
  
      const { id } = await params;
      const customerId = Number(id);
  
      if (!Number.isInteger(customerId) || customerId <= 0) {
        return NextResponse.json(
          { error: "Invalid customer ID." },
          { status: 400 },
        );
      }
  
      await deleteCustomer(
        setup.businessId,
        customerId,
      );
  
      return NextResponse.json({
        success: true,
      });
    } catch (error) {
      console.error("DELETE /api/customers/[id] error:", error);
  
      if (
        error instanceof Error &&
        error.message === "Customer not found."
      ) {
        return NextResponse.json(
          { error: "Customer not found." },
          { status: 404 },
        );
      }
  
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to delete customer.",
        },
        { status: 500 },
      );
    }
  }