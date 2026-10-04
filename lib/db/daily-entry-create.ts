import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
    customers,
    dailyEntries,
    dailyEntryItems,
    dailyEntryPayments,
    products,
} from "@/lib/db/schema";

export interface CreateDailyEntryInput {
    businessId: number;
    customerId: number;
    paymentType: "IMMEDIATE" | "MONTHLY";
    paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
    paymentAmount: number;
    paymentMethod:
      | "CASH"
      | "BANK_TRANSFER"
      | "CARD"
      | "OTHER"
      | null;
    paymentDate: string | null;
    paymentReference: string | null;
    notes: string | null;
    items: {
      productId: number;
      quantity: number;
    }[];
  }

export interface CreateDailyEntryResult {
    id: number;
}

export function createDailyEntry(
    input: CreateDailyEntryInput,
): CreateDailyEntryResult {
    if (!input.items.length) {
        throw new Error("At least one product is required.");
    }

    if (!Number.isInteger(input.businessId) || input.businessId <= 0) {
        throw new Error("Invalid business.");
    }

    if (!Number.isInteger(input.customerId) || input.customerId <= 0) {
        throw new Error("Invalid customer.");
    }

    for (const item of input.items) {
        if (
            !Number.isInteger(item.productId) ||
            item.productId <= 0
        ) {
            throw new Error("Invalid product.");
        }

        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
            throw new Error("Product quantity must be greater than zero.");
        }
    }

    const productIds = input.items.map((item) => item.productId);

    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length !== productIds.length) {
        throw new Error("A product cannot be added more than once.");
    }

    /*
     * Everything below runs inside one SQLite transaction.
     */
    return db.transaction((tx) => {
        /* ---------------------------------------------------------------------- */
        /* Validate customer                                                      */
        /* ---------------------------------------------------------------------- */


        const customer = tx
            .select({
                id: customers.id,
                businessId: customers.businessId,
            })
            .from(customers)
            .where(eq(customers.id, input.customerId))
            .get();

        if (!customer) {
            throw new Error("Customer not found.");
        }

        if (customer.businessId !== input.businessId) {
            throw new Error("Customer does not belong to this business.");
        }

        /*
         * Make sure the customer belongs to the current business.
         */
        const customerBusiness = tx
            .select({
                id: customers.id,
            })
            .from(customers)
            .where(
                and(
                    eq(customers.id, input.customerId),
                    eq(customers.businessId, input.businessId),
                ),
            )
            .get();

        if (!customerBusiness) {
            throw new Error("Customer does not belong to this business.");
        }

        /* ---------------------------------------------------------------------- */
        /* Load products from database                                            */
        /* ---------------------------------------------------------------------- */

        const dbProducts = tx
            .select({
                id: products.id,
                name: products.name,
                unit: products.unit,
                sellingPrice: products.sellingPrice,
                taxRate: products.taxRate,
            })
            .from(products)
            .where(
                and(
                    eq(products.businessId, input.businessId),
                    inArray(products.id, uniqueProductIds),
                ),
            )
            .all();

        if (dbProducts.length !== uniqueProductIds.length) {
            throw new Error(
                "One or more products were not found or do not belong to this business.",
            );
        }



        /* ---------------------------------------------------------------------- */
        /* Calculate totals from database values                                  */
        /* ---------------------------------------------------------------------- */

        let subtotal = 0;
        let tax = 0;

        const calculatedItems = input.items.map((item) => {
            const product = dbProducts.find(
                (product) => product.id === item.productId,
            );

            if (!product) {
                throw new Error("Product not found.");
            }

            const lineSubtotal = Math.round(
                item.quantity * product.sellingPrice,
            );

            const taxRate = product.taxRate ?? 0;

            const lineTax = Math.round(
                (lineSubtotal * taxRate) / 100,
            );

            const lineTotal = lineSubtotal + lineTax;

            subtotal += lineSubtotal;
            tax += lineTax;

            return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.sellingPrice,
                taxRate,
                total: lineTotal,
            };
        });

        const discount = 0;
        const total = subtotal - discount + tax;

        /* ---------------------------------------------------------------------- */
        /* Validate payment status                                               */
        /* ---------------------------------------------------------------------- */

        if (
            input.paymentStatus !== "UNPAID" &&
            input.paymentStatus !== "PARTIAL" &&
            input.paymentStatus !== "PAID"
        ) {
            throw new Error("Invalid payment status.");
        }

        /*
         * We don't have payment amount/payment records in the current UI yet.
         *
         * Therefore:
         * - UNPAID is valid
         * - PARTIAL / PAID should not be saved yet
         *
         * We'll enable these when payment amount + payment method
         * are connected to daily_entry_payments.
         */
        const paymentAmount = input.paymentAmount ?? 0;

        if (paymentAmount < 0) {
          throw new Error(
            "Payment amount cannot be negative.",
          );
        }
        
        if (input.paymentStatus === "UNPAID") {
          if (paymentAmount !== 0) {
            throw new Error(
              "Unpaid entries cannot have a payment amount.",
            );
          }
        }
        
        if (input.paymentStatus === "PARTIAL") {
          if (
            paymentAmount <= 0 ||
            paymentAmount >= total
          ) {
            throw new Error(
              "Partial payment must be greater than zero and less than the entry total.",
            );
          }
        
          if (!input.paymentMethod) {
            throw new Error(
              "Payment method is required.",
            );
          }
        
          if (!input.paymentDate) {
            throw new Error(
              "Payment date is required.",
            );
          }
        }
        
        if (input.paymentStatus === "PAID") {
          if (paymentAmount !== total) {
            throw new Error(
              "Paid amount must equal the entry total.",
            );
          }
        
          if (!input.paymentMethod) {
            throw new Error(
              "Payment method is required.",
            );
          }
        
          if (!input.paymentDate) {
            throw new Error(
              "Payment date is required.",
            );
          }
        }

   

        /* ---------------------------------------------------------------------- */
        /* Create daily entry                                                     */
        /* ---------------------------------------------------------------------- */

        const now = new Date().toISOString();
        const entryDate = new Date().toLocaleDateString("en-CA");
        
        const entry = tx
          .insert(dailyEntries)
          .values({
            businessId: input.businessId,
            customerId: input.customerId,
            entryDate,
            subtotal,
            discount,
            tax,
            total,
            paymentType: input.paymentType,
            paymentStatus: "UNPAID",
            notes: input.notes,
            createdAt: now,
            updatedAt: now,
        })
          .returning({
            id: dailyEntries.id,
          })
          .get();

        if (!entry) {
            throw new Error("Failed to create daily entry.");
        }

        if (paymentAmount > 0) {
            tx.insert(dailyEntryPayments)
              .values({
                businessId: input.businessId,
                entryId: entry.id,
                amount: paymentAmount,
                paymentMethod: input.paymentMethod!,
                paymentDate: input.paymentDate!,
                reference: input.paymentReference,
                notes: null,
                createdAt: now,
              })
              .run();
          }

        /* ---------------------------------------------------------------------- */
        /* Create daily entry items                                               */
        /* ---------------------------------------------------------------------- */

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

        return {
            id: entry.id,
        };
    });
}