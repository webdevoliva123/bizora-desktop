
import { and, desc, eq } from "drizzle-orm";

import { getStockPurchaseDetail } from "@/app/(app)/stock-purchases/actions";
import { db } from "@/lib/db";
import { getSetupStatus } from "@/lib/db/business";
import {
    businesses,
    businessRegistrations,
    suppliers,
    taxRegistrations
} from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const purchaseId = Number(id);

    if (!Number.isSafeInteger(purchaseId) || purchaseId <= 0) {
      return Response.json(
        { error: "Invalid purchase ID." },
        { status: 400 },
      );
    }

    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      return Response.json(
        { error: "Complete your business setup first." },
        { status: 400 },
      );
    }

    const businessId = setup.businessId;
    const purchase = await getStockPurchaseDetail(purchaseId);

    if (!purchase) {
      return Response.json(
        { error: "Purchase not found." },
        { status: 404 },
      );
    }

    const business = db
      .select({
        name: businesses.name,
        logoPath: businesses.logoPath,
        currency: businesses.currency,
        phone: businesses.phone,
        email: businesses.email,
        address: businesses.address,
        city: businesses.city,
        state: businesses.state,
        postalCode: businesses.postalCode,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .get();

    if (!business) {
      return Response.json(
        { error: "Business details not found." },
        { status: 404 },
      );
    }

    const supplier = purchase.supplierId
      ? db
          .select({
            name: suppliers.name,
            contactPerson: suppliers.contactPerson,
            phone: suppliers.phone,
            email: suppliers.email,
            address: suppliers.address,
            city: suppliers.city,
            state: suppliers.state,
            postalCode: suppliers.postalCode,
            taxRegistrationNumber: suppliers.taxRegistrationNumber,
          })
          .from(suppliers)
          .where(
            and(
              eq(suppliers.id, purchase.supplierId),
              eq(suppliers.businessId, businessId),
            ),
          )
          .get() ?? null
      : null;

    const taxRegistrationRows = db
      .select({
        taxSystem: taxRegistrations.taxSystem,
        registrationNumber: taxRegistrations.registrationNumber,
      })
      .from(taxRegistrations)
      .where(
        and(
          eq(taxRegistrations.businessId, businessId),
          eq(taxRegistrations.isRegistered, true),
        ),
      )
      .orderBy(desc(taxRegistrations.id))
      .all();

    const businessRegistrationRows = db
      .select({
        registrationType: businessRegistrations.registrationType,
        registrationNumber: businessRegistrations.registrationNumber,
      })
      .from(businessRegistrations)
      .where(eq(businessRegistrations.businessId, businessId))
      .orderBy(desc(businessRegistrations.id))
      .all();

    const paidAmount = purchase.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    return Response.json({
      purchase: {
        id: purchase.id,
        purchaseNumber: purchase.purchaseNumber,
        purchaseDate: purchase.purchaseDate,
        subtotal: purchase.subtotal,
        tax: purchase.tax,
        total: purchase.total,
        paymentStatus: purchase.paymentStatus,
        paidAmount,
        outstandingAmount: Math.max(purchase.total - paidAmount, 0),
        notes: purchase.notes,
      },
      business,
      supplier,
      items: purchase.items,
      payments: purchase.payments,
      taxRegistrations: taxRegistrationRows,
      businessRegistrations: businessRegistrationRows,
    });
  } catch (error) {
    console.error("Failed to load stock purchase invoice:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load purchase invoice.",
      },
      { status: 500 },
    );
  }
}
