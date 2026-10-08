import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  customers,
  dailyEntries,
  dailyEntryItems,
  dailyEntryPayments,
  products,
} from "@/lib/db/schema";
import { PAYMENT_METHOD, PAYMENT_STATUS, PAYMENT_TYPE } from "@/common";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type PaymentType = PAYMENT_TYPE;
type PaymentStatus = PAYMENT_STATUS;
type PaymentMethod = PAYMENT_METHOD;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "UPI" ,"BANK_TRANSFER", "CARD", "OTHER"];

const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

function derivePaymentStatus(
  paymentType: PaymentType,
  paid: number,
  total: number,
): PaymentStatus {
  if (paymentType === "MONTHLY" || paid <= 0) return "UNPAID";
  return paid >= total ? "PAID" : "PARTIAL";
}

function getEntry(tx: Tx, businessId: number, entryId: number) {
  const entry = tx
    .select({
      id: dailyEntries.id,
      discount: dailyEntries.discount,
      total: dailyEntries.total,
      paymentType: dailyEntries.paymentType,
    })
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.id, entryId),
        eq(dailyEntries.businessId, businessId),
      ),
    )
    .get();

  if (!entry) throw new Error("Daily entry not found.");

  return entry;
}

function sumPayments(tx: Tx, entryId: number): number {
  const row = tx
    .select({
      paid: sql<number>`coalesce(sum(${dailyEntryPayments.amount}), 0)`,
    })
    .from(dailyEntryPayments)
    .where(eq(dailyEntryPayments.entryId, entryId))
    .get();

  return Number(row?.paid ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Update entry                                                               */
/* -------------------------------------------------------------------------- */

export interface UpdateDailyEntryInput {
  businessId: number;
  entryId: number;
  customerId: number;
  paymentType: PaymentType;
  notes: string | null;
  items: { productId: number; quantity: number }[];
}

export function updateDailyEntry(input: UpdateDailyEntryInput): { id: number } {
  if (!input.items.length) {
    throw new Error("At least one product is required.");
  }

  if (input.paymentType !== "IMMEDIATE" && input.paymentType !== "MONTHLY") {
    throw new Error("Invalid payment type.");
  }

  for (const item of input.items) {
    if (!Number.isInteger(item.productId) || item.productId <= 0) {
      throw new Error("Invalid product.");
    }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error("Product quantity must be greater than zero.");
    }
  }

  const productIds = input.items.map((item) => item.productId);

  if (new Set(productIds).size !== productIds.length) {
    throw new Error("A product cannot be added more than once.");
  }

  return db.transaction((tx) => {
    const entry = getEntry(tx, input.businessId, input.entryId);

    const customer = tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, input.customerId),
          eq(customers.businessId, input.businessId),
        ),
      )
      .get();

    if (!customer) throw new Error("Customer not found.");

    const paid = sumPayments(tx, entry.id);

    if (input.paymentType === "MONTHLY" && paid > 0) {
      throw new Error(
        "This entry already has payments recorded, so it can't be moved to a monthly account.",
      );
    }

    /*
     * Products that were already on the entry keep their stored price and tax,
     * so editing a quantity never re-prices history. Only newly added products
     * use today's catalog price.
     */
    const existingItems = tx
      .select({
        productId: dailyEntryItems.productId,
        unitPrice: dailyEntryItems.unitPrice,
        taxRate: dailyEntryItems.taxRate,
      })
      .from(dailyEntryItems)
      .where(eq(dailyEntryItems.entryId, entry.id))
      .all();

    const existingByProduct = new Map(
      existingItems.map((item) => [item.productId, item]),
    );

    const newProductIds = productIds.filter((id) => !existingByProduct.has(id));

    const catalog = newProductIds.length
      ? tx
          .select({
            id: products.id,
            sellingPrice: products.sellingPrice,
            taxRate: products.taxRate,
          })
          .from(products)
          .where(
            and(
              eq(products.businessId, input.businessId),
              inArray(products.id, newProductIds),
            ),
          )
          .all()
      : [];

    if (catalog.length !== newProductIds.length) {
      throw new Error(
        "One or more products were not found or do not belong to this business.",
      );
    }

    let subtotal = 0;
    let tax = 0;

    const calculatedItems = input.items.map((item) => {
      const existing = existingByProduct.get(item.productId);
      const fromCatalog = catalog.find((p) => p.id === item.productId);

      const unitPrice = existing?.unitPrice ?? fromCatalog?.sellingPrice;
      const taxRate = existing?.taxRate ?? fromCatalog?.taxRate ?? 0;

      if (unitPrice === undefined) throw new Error("Product not found.");

      const lineSubtotal = Math.round(item.quantity * unitPrice);
      const lineTax = Math.round((lineSubtotal * taxRate) / 100);

      subtotal += lineSubtotal;
      tax += lineTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        taxRate,
        total: lineSubtotal + lineTax,
      };
    });

    const total = subtotal - entry.discount + tax;

    if (total < paid) {
      throw new Error(
        `The total can't be lower than the ${rupees(paid)} already paid.`,
      );
    }

    const now = new Date().toISOString();

    tx.update(dailyEntries)
      .set({
        customerId: input.customerId,
        paymentType: input.paymentType,
        subtotal,
        tax,
        total,
        paymentStatus: derivePaymentStatus(input.paymentType, paid, total),
        notes: input.notes,
        updatedAt: now,
      })
      .where(eq(dailyEntries.id, entry.id))
      .run();

    tx.delete(dailyEntryItems).where(eq(dailyEntryItems.entryId, entry.id)).run();

    tx.insert(dailyEntryItems)
      .values(
        calculatedItems.map((item) => ({
          entryId: entry.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          total: item.total,
          createdAt: now,
        })),
      )
      .run();

    return { id: entry.id };
  });
}

/* -------------------------------------------------------------------------- */
/* Add payment (partial or full)                                              */
/* -------------------------------------------------------------------------- */

export interface AddDailyEntryPaymentInput {
  businessId: number;
  entryId: number;
  amount: number; // paise
  paymentMethod: PaymentMethod;
  paymentDate: string; // yyyy-MM-dd
  reference: string | null;
  notes: string | null;
}

export function addDailyEntryPayment(input: AddDailyEntryPaymentInput): {
  paymentStatus: PaymentStatus;
} {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (!PAYMENT_METHODS.includes(input.paymentMethod)) {
    throw new Error("Invalid payment method.");
  }

  if (!DATE_PATTERN.test(input.paymentDate)) {
    throw new Error("A valid payment date is required.");
  }

  return db.transaction((tx) => {
    const entry = getEntry(tx, input.businessId, input.entryId);

    if (entry.paymentType === "MONTHLY") {
      throw new Error(
        "Monthly entries are paid through the customer's monthly account.",
      );
    }

    const paid = sumPayments(tx, entry.id);
    const outstanding = entry.total - paid;

    if (outstanding <= 0) {
      throw new Error("This entry is already fully paid.");
    }

    if (input.amount > outstanding) {
      throw new Error(
        `The amount can't exceed the outstanding balance of ${rupees(outstanding)}.`,
      );
    }

    const now = new Date().toISOString();

    tx.insert(dailyEntryPayments)
      .values({
        businessId: input.businessId,
        entryId: entry.id,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paymentDate: input.paymentDate,
        reference: input.reference,
        notes: input.notes,
        createdAt: now,
      })
      .run();

    const paymentStatus = derivePaymentStatus(
      "IMMEDIATE",
      paid + input.amount,
      entry.total,
    );

    tx.update(dailyEntries)
      .set({ paymentStatus, updatedAt: now })
      .where(eq(dailyEntries.id, entry.id))
      .run();

    return { paymentStatus };
  });
}

/* -------------------------------------------------------------------------- */
/* Delete entry                                                               */
/* -------------------------------------------------------------------------- */

export function deleteDailyEntry(
  businessId: number,
  entryId: number,
): { id: number } {
  return db.transaction((tx) => {
    const entry = getEntry(tx, businessId, entryId);

    // Children first, then the entry, all in one transaction
    tx.delete(dailyEntryPayments)
      .where(eq(dailyEntryPayments.entryId, entry.id))
      .run();
    tx.delete(dailyEntryItems).where(eq(dailyEntryItems.entryId, entry.id)).run();
    tx.delete(dailyEntries).where(eq(dailyEntries.id, entry.id)).run();

    return { id: entry.id };
  });
}