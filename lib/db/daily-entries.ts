import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
    customers,
    customerBusinessDetails,
    customerPersonDetails,
    dailyEntries,
    dailyEntryItems,
    products,
    dailyEntryPayments,
} from "@/lib/db/schema";

import type { DailyEntryDetail, DailyEntryListItem } from "@/lib/types/daily-entry";

export function getDailyEntries(
    businessId: number,
): DailyEntryListItem[] {
    const entries = db
        .select({
            id: dailyEntries.id,
            entryDate: dailyEntries.entryDate,
            createdAt: dailyEntries.createdAt,
            customerType: sql<"PERSON" | "BUSINESS">`
                UPPER(${customers.type})
            `,

            customerName: sql<string>`
                COALESCE(
                    NULLIF(
                        TRIM(
                            COALESCE(${customerPersonDetails.firstName}, '') ||
                            ' ' ||
                            COALESCE(${customerPersonDetails.lastName}, '')
                        ),
                        ''
                    ),
                    NULLIF(${customerBusinessDetails.businessName}, ''),
                    'Unknown Customer'
                )
            `,

            itemCount: sql<number>`
                COUNT(${dailyEntryItems.id})
            `,

            total: dailyEntries.total,

            // Total amount actually paid for this entry
            paidAmount: sql<number>`
                COALESCE(
                    (
                        SELECT SUM(${dailyEntryPayments.amount})
                        FROM ${dailyEntryPayments}
                        WHERE ${dailyEntryPayments.entryId} = ${dailyEntries.id}
                    ),
                    0
                )
            `,

            // Number of payment transactions
            paymentCount: sql<number>`
                (
                    SELECT COUNT(${dailyEntryPayments.id})
                    FROM ${dailyEntryPayments}
                    WHERE ${dailyEntryPayments.entryId} = ${dailyEntries.id}
                )
            `,

            // Derive status from actual payment history
            paymentStatus: sql<"UNPAID" | "PARTIAL" | "PAID">`
                CASE
                    WHEN COALESCE(
                        (
                            SELECT SUM(${dailyEntryPayments.amount})
                            FROM ${dailyEntryPayments}
                            WHERE ${dailyEntryPayments.entryId} = ${dailyEntries.id}
                        ),
                        0
                    ) <= 0
                    THEN 'UNPAID'

                    WHEN COALESCE(
                        (
                            SELECT SUM(${dailyEntryPayments.amount})
                            FROM ${dailyEntryPayments}
                            WHERE ${dailyEntryPayments.entryId} = ${dailyEntries.id}
                        ),
                        0
                    ) >= ${dailyEntries.total}
                    THEN 'PAID'

                    ELSE 'PARTIAL'
                END
            `,
        })
        .from(dailyEntries)
        .innerJoin(
            customers,
            eq(dailyEntries.customerId, customers.id),
        )
        .leftJoin(
            customerPersonDetails,
            eq(
                customerPersonDetails.customerId,
                customers.id,
            ),
        )
        .leftJoin(
            customerBusinessDetails,
            eq(
                customerBusinessDetails.customerId,
                customers.id,
            ),
        )
        .leftJoin(
            dailyEntryItems,
            eq(
                dailyEntryItems.entryId,
                dailyEntries.id,
            ),
        )
        .where(
            eq(dailyEntries.businessId, businessId),
        )
        .groupBy(
            dailyEntries.id,
            dailyEntries.entryDate,
            dailyEntries.createdAt,
            dailyEntries.total,
            customers.id,
            customers.type,
            customerPersonDetails.firstName,
            customerPersonDetails.lastName,
            customerBusinessDetails.businessName,
        )
        .orderBy(
            desc(dailyEntries.createdAt),
            desc(dailyEntries.id),
        )
        .all();

    console.debug("[daily-entries] Loaded entries", {
        businessId,
        count: entries.length,
    });

    return entries.map((entry) => ({
        id: entry.id,
        entryDate: entry.entryDate,
        createdAt: entry.createdAt,
    
        customerName: entry.customerName,
        customerType: entry.customerType,
        itemCount: Number(entry.itemCount),
    
        total: entry.total,
    
        paidAmount: Number(entry.paidAmount ?? 0),
        paymentCount: Number(entry.paymentCount ?? 0),
    
        paymentStatus: entry.paymentStatus,
    }));
}

export function getDailyEntryById(
    businessId: number,
    entryId: number,
): DailyEntryDetail | null {
    const entry = db
        .select({
            id: dailyEntries.id,
            entryDate: dailyEntries.entryDate,

            customerId: customers.id,
            customerType: sql<"PERSON" | "BUSINESS">`
                  UPPER(${customers.type})
                `,

            customerName: sql<string>`
                  COALESCE(
                    NULLIF(
                      TRIM(
                        COALESCE(${customerPersonDetails.firstName}, '') ||
                        ' ' ||
                        COALESCE(${customerPersonDetails.lastName}, '')
                      ),
                      ''
                    ),
                    NULLIF(${customerBusinessDetails.businessName}, ''),
                    'Unknown Customer'
                  )
                `,

            subtotal: dailyEntries.subtotal,
            discount: dailyEntries.discount,
            tax: dailyEntries.tax,
            total: dailyEntries.total,
            paymentStatus: sql<"UNPAID" | "PARTIAL" | "PAID">`
  UPPER(${dailyEntries.paymentStatus})
`,
            notes: dailyEntries.notes,
        })
        .from(dailyEntries)
        .innerJoin(
            customers,
            eq(dailyEntries.customerId, customers.id),
        )
        .leftJoin(
            customerPersonDetails,
            eq(
                customerPersonDetails.customerId,
                customers.id,
            ),
        )
        .leftJoin(
            customerBusinessDetails,
            eq(
                customerBusinessDetails.customerId,
                customers.id,
            ),
        )
        .where(
            eq(dailyEntries.id, entryId),
        )
        .get();

    if (!entry) {
        return null;
    }

    /*
     * Make sure the entry belongs to the requested business.
     */
    const belongsToBusiness = db
    .select({
      id: dailyEntries.id,
    })
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.id, entryId),
        eq(dailyEntries.businessId, businessId),
      ),
    )
    .get();

    if (!belongsToBusiness) {
        return null;
    }

    const items = db
        .select({
            id: dailyEntryItems.id,
            productId: dailyEntryItems.productId,
            productName: products.name,
            unit: products.unit,
            quantity: dailyEntryItems.quantity,
            unitPrice: dailyEntryItems.unitPrice,
            taxRate: dailyEntryItems.taxRate,
            total: dailyEntryItems.total,
        })
        .from(dailyEntryItems)
        .innerJoin(
            products,
            eq(
                dailyEntryItems.productId,
                products.id,
            ),
        )
        .where(
            eq(dailyEntryItems.entryId, entryId),
        )
        .all();

    const payments = db
        .select({
            id: dailyEntryPayments.id,
            amount: dailyEntryPayments.amount,
            paymentMethod: dailyEntryPayments.paymentMethod,
            paymentDate: dailyEntryPayments.paymentDate,
            reference: dailyEntryPayments.reference,
            notes: dailyEntryPayments.notes,
        })
        .from(dailyEntryPayments)
        .where(
            eq(dailyEntryPayments.entryId, entryId),
        )
        .orderBy(
            desc(dailyEntryPayments.paymentDate),
        )
        .all();

    const paidAmount = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
    );

    const outstandingAmount = Math.max(
        entry.total - paidAmount,
        0,
    );

    return {
        id: entry.id,
        entryDate: entry.entryDate,

        customerId: entry.customerId,
        customerName: entry.customerName,
        customerType: entry.customerType,

        subtotal: entry.subtotal,
        discount: entry.discount,
        tax: entry.tax,
        total: entry.total,

        paymentStatus: entry.paymentStatus,

        paidAmount,
        outstandingAmount,

        notes: entry.notes,

        items: items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate ?? 0,
            total: item.total,
        })),

        payments,
    };
}