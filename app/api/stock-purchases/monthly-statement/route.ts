
import { NextResponse } from "next/server";
import { and, asc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  businesses,
  businessRegistrations,
  stockPurchaseItems,
  stockPurchasePayments,
  stockPurchases,
  suppliers,
  taxRegistrations,
} from "@/lib/db/schema";
import { getSetupStatus } from "@/lib/db/business";

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
    const month = searchParams.get("month")?.trim() ?? "";
    const supplierValue = searchParams.get("supplierId")?.trim();

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { error: "A valid month is required in YYYY-MM format." },
        { status: 400 },
      );
    }

    let supplierId: number | undefined;

    if (supplierValue && supplierValue !== "all") {
      supplierId = Number(supplierValue);

      if (!Number.isInteger(supplierId) || supplierId <= 0) {
        return NextResponse.json(
          { error: "Invalid supplier ID." },
          { status: 400 },
        );
      }

      const supplier = db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(
          and(
            eq(suppliers.id, supplierId),
            eq(suppliers.businessId, setup.businessId),
          ),
        )
        .get();

      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found." },
          { status: 404 },
        );
      }
    }


    const [year, monthNumber] = month.split("-").map(Number);

    const nextMonth = new Date(year, monthNumber, 1);
    
    const endDate = `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1,
    ).padStart(2, "0")}-01`;
    

    const startDate = `${month}-01`;

    const business = db
      .select({
        id: businesses.id,
        name: businesses.name,
        logoPath: businesses.logoPath,
        country: businesses.country,
        currency: businesses.currency,
        address: businesses.address,
        city: businesses.city,
        state: businesses.state,
        postalCode: businesses.postalCode,
        phone: businesses.phone,
        email: businesses.email,
      })
      .from(businesses)
      .where(eq(businesses.id, setup.businessId))
      .get();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 },
      );
    }

    const purchaseConditions = [
      eq(stockPurchases.businessId, setup.businessId),
      gte(stockPurchases.purchaseDate, startDate),
      lt(stockPurchases.purchaseDate, endDate),
    ];

    if (supplierId !== undefined) {
      purchaseConditions.push(eq(stockPurchases.supplierId, supplierId));
    }

    const purchaseRows = db
      .select({
        id: stockPurchases.id,
        supplierId: stockPurchases.supplierId,
        supplierName: suppliers.name,
        supplierPhone: suppliers.phone,
        supplierEmail: suppliers.email,
        supplierAddress: suppliers.address,
        supplierCity: suppliers.city,
        supplierState: suppliers.state,
        supplierPostalCode: suppliers.postalCode,
        supplierTaxNumber: suppliers.taxRegistrationNumber,
        purchaseNumber: stockPurchases.purchaseNumber,
        purchaseDate: stockPurchases.purchaseDate,
        subtotal: stockPurchases.subtotal,
        tax: stockPurchases.tax,
        total: stockPurchases.total,
        paymentStatus: stockPurchases.paymentStatus,
        notes: stockPurchases.notes,
      })
      .from(stockPurchases)
      .leftJoin(suppliers, eq(suppliers.id, stockPurchases.supplierId))
      .where(and(...purchaseConditions))
      .orderBy(asc(stockPurchases.purchaseDate), asc(stockPurchases.id))
      .all();

    const purchases = purchaseRows.map((purchase) => {
      const items = db
        .select({
          id: stockPurchaseItems.id,
          productId: stockPurchaseItems.productId,
          productName: stockPurchaseItems.productName,
          unit: stockPurchaseItems.unit,
          quantity: stockPurchaseItems.quantity,
          unitPrice: stockPurchaseItems.unitPrice,
          taxRate: stockPurchaseItems.taxRate,
          total: stockPurchaseItems.total,
        })
        .from(stockPurchaseItems)
        .where(eq(stockPurchaseItems.purchaseId, purchase.id))
        .orderBy(asc(stockPurchaseItems.id))
        .all();

      const payments = db
        .select({
          id: stockPurchasePayments.id,
          amount: stockPurchasePayments.amount,
          paymentMethod: stockPurchasePayments.paymentMethod,
          paymentDate: stockPurchasePayments.paymentDate,
          reference: stockPurchasePayments.reference,
          notes: stockPurchasePayments.notes,
        })
        .from(stockPurchasePayments)
        .where(
          and(
            eq(stockPurchasePayments.purchaseId, purchase.id),
            eq(stockPurchasePayments.businessId, setup.businessId!),
          ),
        )
        .orderBy(asc(stockPurchasePayments.paymentDate), asc(stockPurchasePayments.id))
        .all();

      const paidAmount = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );

      return {
        ...purchase,
        items,
        payments,
        paidAmount,
        outstandingAmount: Math.max(purchase.total - paidAmount, 0),
        itemCount: items.length,
      };
    });

    const taxRegistrationRows = db
      .select({
        country: taxRegistrations.country,
        taxSystem: taxRegistrations.taxSystem,
        registrationNumber: taxRegistrations.registrationNumber,
        isRegistered: taxRegistrations.isRegistered,
      })
      .from(taxRegistrations)
      .where(eq(taxRegistrations.businessId, setup.businessId))
      .all();

    const registrationRows = db
      .select({
        country: businessRegistrations.country,
        authorityName: businessRegistrations.authorityName,
        registrationType: businessRegistrations.registrationType,
        registrationNumber: businessRegistrations.registrationNumber,
      })
      .from(businessRegistrations)
      .where(eq(businessRegistrations.businessId, setup.businessId))
      .all();

    return NextResponse.json({
      month,
      business,
      purchases,
      taxRegistrations: taxRegistrationRows,
      businessRegistrations: registrationRows,
      totals: {
        purchaseCount: purchases.length,
        itemCount: purchases.reduce(
          (sum, purchase) => sum + purchase.itemCount,
          0,
        ),
        totalAmount: purchases.reduce(
          (sum, purchase) => sum + purchase.total,
          0,
        ),
        paidAmount: purchases.reduce(
          (sum, purchase) => sum + purchase.paidAmount,
          0,
        ),
        outstandingAmount: purchases.reduce(
          (sum, purchase) => sum + purchase.outstandingAmount,
          0,
        ),
      },
    });
  } catch (error) {
    console.error(
      "[stock-purchase-monthly-statement] Failed to load statement:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to load monthly stock purchase statement." },
      { status: 500 },
    );
  }
}
