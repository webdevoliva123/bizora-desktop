import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  customers,
  dailyEntries,
  dailyEntryItems,
  dailyEntryPayments,
  products,
} from "@/lib/db/schema";

export type QuickSalePaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CARD"
  | "OTHER";

export interface CreateQuickSaleInput {
  businessId: number;
  amount: number; // paise
  paymentMethod: QuickSalePaymentMethod;
  paymentDate: string;
  paymentReference: string | null;
  notes: string | null;
}

export interface CreateQuickSaleResult {
  id: number;
}

const WALK_IN_CUSTOMER_KEY = "WALK_IN_CUSTOMER";
const QUICK_SALE_PRODUCT_KEY = "QUICK_SALE";

export function createQuickSale(
  input: CreateQuickSaleInput,
): CreateQuickSaleResult {
  if (!Number.isInteger(input.businessId) || input.businessId <= 0) {
    throw new Error("Invalid business.");
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Sale amount must be greater than zero.");
  }

  if (
    input.paymentMethod !== "CASH" &&
    input.paymentMethod !== "BANK_TRANSFER" &&
    input.paymentMethod !== "CARD" &&
    input.paymentMethod !== "OTHER"
  ) {
    throw new Error("Invalid payment method.");
  }

  if (!input.paymentDate) {
    throw new Error("Payment date is required.");
  }

  return db.transaction((tx) => {
    // -----------------------------------------------------------------------
    // Find system walk-in customer
    // -----------------------------------------------------------------------

    const walkInCustomer = tx
      .select({
        id: customers.id,
      })
      .from(customers)
      .where(
        and(
          eq(customers.businessId, input.businessId),
          eq(customers.isSystem, true),
          eq(customers.systemKey, WALK_IN_CUSTOMER_KEY),
          eq(customers.active, true),
        ),
      )
      .get();

    if (!walkInCustomer) {
      throw new Error(
        "System walk-in customer was not found. Please complete business setup again.",
      );
    }

    // -----------------------------------------------------------------------
    // Find system Quick Sale product
    // -----------------------------------------------------------------------

    const quickSaleProduct = tx
      .select({
        id: products.id,
      })
      .from(products)
      .where(
        and(
          eq(products.businessId, input.businessId),
          eq(products.isSystem, true),
          eq(products.systemKey, QUICK_SALE_PRODUCT_KEY),
          eq(products.active, true),
        ),
      )
      .get();

    if (!quickSaleProduct) {
      throw new Error(
        "System Quick Sale product was not found. Please complete business setup again.",
      );
    }

    // -----------------------------------------------------------------------
    // Create daily entry
    // -----------------------------------------------------------------------

    const now = new Date().toISOString();

    // Keep the business-day value local, matching the existing Daily Entry
    // behavior.
    const entryDate = new Date().toLocaleDateString("en-CA");

    const entry = tx
      .insert(dailyEntries)
      .values({
        businessId: input.businessId,
        customerId: walkInCustomer.id,

        entryDate,

        subtotal: input.amount,
        discount: 0,
        tax: 0,
        total: input.amount,

        paymentType: "IMMEDIATE",
        paymentStatus: "PAID",

        notes: input.notes,

        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: dailyEntries.id,
      })
      .get();

    if (!entry) {
      throw new Error("Failed to create quick sale.");
    }

    // -----------------------------------------------------------------------
    // Create Quick Sale item
    // -----------------------------------------------------------------------

    tx.insert(dailyEntryItems)
      .values({
        entryId: entry.id,
        productId: quickSaleProduct.id,

        // Quick Sale represents one counter transaction.
        quantity: 1,

        // Unlike normal products, the price comes from the amount entered
        // by the user.
        unitPrice: input.amount,

        taxRate: 0,
        total: input.amount,

        createdAt: now,
      })
      .run();

    // -----------------------------------------------------------------------
    // Create full payment
    // -----------------------------------------------------------------------

    tx.insert(dailyEntryPayments)
      .values({
        businessId: input.businessId,
        entryId: entry.id,

        amount: input.amount,

        paymentMethod: input.paymentMethod,
        paymentDate: input.paymentDate,
        reference: input.paymentReference,
        notes: input.notes,

        createdAt: now,
      })
      .run();

    return {
      id: entry.id,
    };
  });
}