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
    businessPaymentDetails,
    businesses,
    taxRegistrations,
    businessRegistrations,
} from "@/lib/db/schema";

import type { DailyEntryBill, DailyEntryDetail, DailyEntryListItem } from "@/lib/types/daily-entry";

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

            paymentType: sql<"IMMEDIATE" | "MONTHLY">`
            ${dailyEntries.paymentType}
        `,

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

            paymentCount: sql<number>`
            (
                SELECT COUNT(${dailyEntryPayments.id})
                FROM ${dailyEntryPayments}
                WHERE ${dailyEntryPayments.entryId} = ${dailyEntries.id}
            )
        `,

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
            dailyEntries.paymentType,
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
        paymentType: entry.paymentType,
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

            paymentType: sql<"IMMEDIATE" | "MONTHLY">`
                UPPER(${dailyEntries.paymentType})
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
            and(
                eq(dailyEntries.id, entryId),
                eq(dailyEntries.businessId, businessId),
            ),
        )
        .get();

    if (!entry) {
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

            paymentMethod: sql<
                "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER"
            >`${dailyEntryPayments.paymentMethod}`,

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
            desc(dailyEntryPayments.id),
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

    let paymentStatus: "UNPAID" | "PARTIAL" | "PAID";

    if (paidAmount <= 0) {
        paymentStatus = "UNPAID";
    } else if (paidAmount >= entry.total) {
        paymentStatus = "PAID";
    } else {
        paymentStatus = "PARTIAL";
    }

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

        paymentType: entry.paymentType,
        paymentStatus,

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

export function getDailyEntryBill(
    businessId: number,
    entryId: number,
): DailyEntryBill | null {
    const entry = getDailyEntryById(
        businessId,
        entryId,
    );

    if (!entry) {
        return null;
    }

    const business = db
        .select({
            id: businesses.id,
            name: businesses.name,
            logoPath: businesses.logoPath,
            businessType: businesses.businessType,
            businessCategory: businesses.businessCategory,
            country: businesses.country,
            currency: businesses.currency,
            phone: businesses.phone,
            email: businesses.email,
            address: businesses.address,
            city: businesses.city,
            state: businesses.state,
            postalCode: businesses.postalCode,
        })
        .from(businesses)
        .where(
            and(
                eq(businesses.id, businessId),
                eq(businesses.setupCompleted, true),
            ),
        )
        .get();

    if (!business) {
        return null;
    }

    const paymentDetails = db
        .select({
            bankName: businessPaymentDetails.bankName,
            accountName: businessPaymentDetails.accountName,
            accountNumber: businessPaymentDetails.accountNumber,
            branchName: businessPaymentDetails.branchName,
            routingCode: businessPaymentDetails.routingCode,
            paymentIdentifier: businessPaymentDetails.paymentIdentifier,
            qrImagePath: businessPaymentDetails.qrImagePath,
            showBankDetails: businessPaymentDetails.showBankDetails,
            showQr: businessPaymentDetails.showQr,
            paymentInstructions:
                businessPaymentDetails.paymentInstructions,
        })
        .from(businessPaymentDetails)
        .where(
            eq(
                businessPaymentDetails.businessId,
                businessId,
            ),
        )
        .orderBy(desc(businessPaymentDetails.id))
        .limit(1)
        .get();

    const taxRegistrationRows = db
        .select({
            taxSystem: taxRegistrations.taxSystem,
            registrationNumber:
                taxRegistrations.registrationNumber,
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
            authorityName:
                businessRegistrations.authorityName,
            registrationType:
                businessRegistrations.registrationType,
            registrationNumber:
                businessRegistrations.registrationNumber,
        })
        .from(businessRegistrations)
        .where(
            eq(
                businessRegistrations.businessId,
                businessId,
            ),
        )
        .orderBy(desc(businessRegistrations.id))
        .all();

        return {
            business,
          
            customer: {
              id: entry.customerId,
              name: entry.customerName,
              type: entry.customerType,
            },
          
            entry,
          
            paymentDetails: paymentDetails
              ? {
                  bankName: paymentDetails.bankName,
                  accountName: paymentDetails.accountName,
                  accountNumber:
                    paymentDetails.accountNumber,
                  branchName: paymentDetails.branchName,
                  routingCode:
                    paymentDetails.routingCode,
                  paymentIdentifier:
                    paymentDetails.paymentIdentifier,
                  qrImagePath:
                    paymentDetails.qrImagePath,
                  showBankDetails:
                    paymentDetails.showBankDetails,
                  showQr: paymentDetails.showQr,
                  paymentInstructions:
                    paymentDetails.paymentInstructions,
                }
              : null,
          
            taxRegistrations: taxRegistrationRows,
          
            businessRegistrations:
              businessRegistrationRows,
          };
}