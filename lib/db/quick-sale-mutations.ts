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

import type { PAYMENT_METHOD } from "@/common";

const WALK_IN_CUSTOMER_KEY = "WALK_IN_CUSTOMER";
const QUICK_SALE_PRODUCT_KEY = "QUICK_SALE";

export interface UpdateQuickSaleInput {
  businessId: number;
  entryId: number;
  amount: number; // paise
  paymentMethod: PAYMENT_METHOD;
  reference: string | null;
  notes: string | null;
}

export interface UpdateQuickSaleResult {
  id: number;
}

export function updateQuickSale(
  input: UpdateQuickSaleInput,
): UpdateQuickSaleResult {
  if (!Number.isInteger(input.businessId) || input.businessId <= 0) {
    throw new Error("Invalid business.");
  }

  if (!Number.isInteger(input.entryId) || input.entryId <= 0) {
    throw new Error("Invalid quick sale.");
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Sale amount must be greater than zero.");
  }

  if (
    input.paymentMethod !== "CASH" &&
    input.paymentMethod !== "UPI" &&
    input.paymentMethod !== "BANK_TRANSFER" &&
    input.paymentMethod !== "CARD" &&
    input.paymentMethod !== "OTHER"
  ) {
    throw new Error("Invalid payment method.");
  }

  return db.transaction((tx) => {
    // -------------------------------------------------------------------------
    // Find and validate the Quick Sale entry
    // -------------------------------------------------------------------------

    const entry = tx
      .select({
        id: dailyEntries.id,
        customerId: dailyEntries.customerId,
        entryType: dailyEntries.entryType,
      })
      .from(dailyEntries)
      .where(
        and(
          eq(dailyEntries.id, input.entryId),
          eq(dailyEntries.businessId, input.businessId),
        ),
      )
      .get();

    if (!entry) {
      throw new Error("Quick Sale was not found.");
    }

    if (entry.entryType !== "QUICK_SALE") {
      throw new Error("This entry is not a Quick Sale.");
    }

    // -------------------------------------------------------------------------
    // Validate system Walk-in Customer
    // -------------------------------------------------------------------------

    const walkInCustomer = tx
      .select({
        id: customers.id,
      })
      .from(customers)
      .where(
        and(
          eq(customers.id, entry.customerId),
          eq(customers.businessId, input.businessId),
          eq(customers.isSystem, true),
          eq(customers.systemKey, WALK_IN_CUSTOMER_KEY),
          eq(customers.active, true),
        ),
      )
      .get();

    if (!walkInCustomer) {
      throw new Error(
        "Invalid Quick Sale customer. The system Walk-in Customer was not found.",
      );
    }

    // -------------------------------------------------------------------------
    // Find the system Quick Sale product
    // -------------------------------------------------------------------------

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
        "System Quick Sale product was not found.",
      );
    }

    // -------------------------------------------------------------------------
    // Find the Quick Sale item
    // -------------------------------------------------------------------------

    const item = tx
      .select({
        id: dailyEntryItems.id,
        productId: dailyEntryItems.productId,
      })
      .from(dailyEntryItems)
      .where(
        eq(dailyEntryItems.entryId, input.entryId),
      )
      .get();

    if (!item) {
      throw new Error(
        "Quick Sale item was not found.",
      );
    }

    if (item.productId !== quickSaleProduct.id) {
      throw new Error(
        "Invalid Quick Sale product.",
      );
    }

    // -------------------------------------------------------------------------
    // Find the Quick Sale payment
    // -------------------------------------------------------------------------

    const payment = tx
      .select({
        id: dailyEntryPayments.id,
      })
      .from(dailyEntryPayments)
      .where(
        and(
          eq(dailyEntryPayments.entryId, input.entryId),
          eq(dailyEntryPayments.businessId, input.businessId),
        ),
      )
      .get();

    if (!payment) {
      throw new Error(
        "Quick Sale payment was not found.",
      );
    }

    const now = new Date().toISOString();

    // -------------------------------------------------------------------------
    // Update Daily Entry
    // -------------------------------------------------------------------------

    tx.update(dailyEntries)
      .set({
        customerId: walkInCustomer.id,
        subtotal: input.amount,
        discount: 0,
        tax: 0,
        total: input.amount,

        // Quick Sale rules
        paymentType: "IMMEDIATE",
        paymentStatus: "PAID",

        notes: input.notes,
        updatedAt: now,
      })
      .where(
        and(
          eq(dailyEntries.id, input.entryId),
          eq(dailyEntries.businessId, input.businessId),
        ),
      )
      .run();

    // -------------------------------------------------------------------------
    // Update Quick Sale item
    // -------------------------------------------------------------------------

    tx.update(dailyEntryItems)
      .set({
        productId: quickSaleProduct.id,
        quantity: 1,
        unitPrice: input.amount,
        taxRate: 0,
        total: input.amount,
      })
      .where(
        eq(dailyEntryItems.id, item.id),
      )
      .run();

    // -------------------------------------------------------------------------
    // Update payment
    // -------------------------------------------------------------------------

    tx.update(dailyEntryPayments)
      .set({
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        reference: input.reference,
        notes: input.notes,
      })
      .where(
        and(
          eq(dailyEntryPayments.id, payment.id),
          eq(dailyEntryPayments.entryId, input.entryId),
          eq(dailyEntryPayments.businessId, input.businessId),
        ),
      )
      .run();

    return {
      id: input.entryId,
    };
  });
}