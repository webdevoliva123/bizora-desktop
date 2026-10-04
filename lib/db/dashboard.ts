import "server-only";

import { and, desc, eq, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
    customerBusinessDetails,
    customerPersonDetails,
    customers,
    dailyEntries,
    dailyEntryPayments,
    expenseCategories,
    expenses,
    invoices,
    payments,
    products,
    stockPurchases,
    suppliers,
} from "@/lib/db/schema";
import { DashboardRecentTransaction, DashboardSalesOverview, DashboardSummary } from "../types/dashboard";


function getTodayDate(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function getDashboardSummary(
    businessId: number,
): DashboardSummary {
    const today = getTodayDate();

    // -------------------------------------------------------------------------
    // Today's Sales
    // -------------------------------------------------------------------------
    const todaySalesRows = db
        .select({
            id: dailyEntries.id,
            total: dailyEntries.total,
            entryDate: dailyEntries.entryDate,
        })
        .from(dailyEntries)
        .where(
            and(
                eq(dailyEntries.businessId, businessId),
                eq(dailyEntries.entryDate, today),
            ),
        )
        .all();

    const todaySales = todaySalesRows.reduce(
        (sum, entry) => sum + Number(entry.total ?? 0),
        0,
    );


    // -------------------------------------------------------------------------
    // Today's Payments
    // -------------------------------------------------------------------------
    const paymentsResult = db
        .select({
            total: sql<number>`
                COALESCE(
                    SUM(${dailyEntryPayments.amount}),
                    0
                )
            `,
        })
        .from(dailyEntryPayments)
        .where(
            and(
                eq(dailyEntryPayments.businessId, businessId),
                eq(dailyEntryPayments.paymentDate, today),
            ),
        )
        .get();

    const todayPayments = Number(
        paymentsResult?.total ?? 0,
    );

    // -------------------------------------------------------------------------
    // Daily Entry Outstanding
    // -------------------------------------------------------------------------
    //
    // Get payment totals grouped by entry first.
    // This is the same approach used by getDailyEntries().
    //
    const dailyEntryPaymentSummary = db
        .select({
            entryId: dailyEntryPayments.entryId,

            paidAmount: sql<number>`
                COALESCE(
                    SUM(${dailyEntryPayments.amount}),
                    0
                )
            `,
        })
        .from(dailyEntryPayments)
        .where(
            eq(
                dailyEntryPayments.businessId,
                businessId,
            ),
        )
        .groupBy(
            dailyEntryPayments.entryId,
        )
        .all();

    const paidByEntry = new Map<number, number>(
        dailyEntryPaymentSummary.map((payment) => [
            payment.entryId,
            Number(payment.paidAmount ?? 0),
        ]),
    );

    // Get all daily entries for this business.
    const dailyEntryRows = db
        .select({
            id: dailyEntries.id,
            total: dailyEntries.total,
        })
        .from(dailyEntries)
        .where(
            eq(dailyEntries.businessId, businessId),
        )
        .all();

    // Get daily entries that have already become invoices.
    const invoicedEntryRows = db
        .select({
            entryId: invoices.entryId,
        })
        .from(invoices)
        .where(
            eq(invoices.businessId, businessId),
        )
        .all();

    const invoicedEntryIds = new Set(
        invoicedEntryRows
            .map((row) => row.entryId)
            .filter(
                (id): id is number =>
                    id !== null,
            ),
    );

    let dailyEntryOutstanding = 0;

    for (const entry of dailyEntryRows) {
        // Don't count a daily entry twice if it has
        // already been converted into an invoice.
        if (invoicedEntryIds.has(entry.id)) {
            continue;
        }

        const total = Number(
            entry.total ?? 0,
        );

        const paid = paidByEntry.get(
            entry.id,
        ) ?? 0;

        dailyEntryOutstanding += Math.max(
            total - paid,
            0,
        );
    }

    // -------------------------------------------------------------------------
    // Invoice Outstanding
    // -------------------------------------------------------------------------
    const invoiceRows = db
        .select({
            id: invoices.id,
            total: invoices.total,
        })
        .from(invoices)
        .where(
            eq(invoices.businessId, businessId),
        )
        .all();

    const invoicePaymentSummary = db
        .select({
            invoiceId: payments.invoiceId,

            paidAmount: sql<number>`
                COALESCE(
                    SUM(${payments.amount}),
                    0
                )
            `,
        })
        .from(payments)
        .where(
            eq(payments.businessId, businessId),
        )
        .groupBy(
            payments.invoiceId,
        )
        .all();

    const paidByInvoice = new Map<number, number>(
        invoicePaymentSummary.map((payment) => [
            payment.invoiceId,
            Number(payment.paidAmount ?? 0),
        ]),
    );

    let invoiceOutstanding = 0;

    for (const invoice of invoiceRows) {
        const total = Number(
            invoice.total ?? 0,
        );

        const paid = paidByInvoice.get(
            invoice.id,
        ) ?? 0;

        invoiceOutstanding += Math.max(
            total - paid,
            0,
        );
    }

    const outstanding =
        dailyEntryOutstanding +
        invoiceOutstanding;

    console.log("[dashboard] Outstanding", {
        businessId,
        dailyEntryOutstanding,
        invoiceOutstanding,
        outstanding,
    });

    // -------------------------------------------------------------------------
    // Low Stock
    // -------------------------------------------------------------------------
    const lowStockResult = db
        .select({
            count: sql<number>`COUNT(*)`,
        })
        .from(products)
        .where(
            and(
                eq(products.businessId, businessId),
                eq(products.active, true),
                sql`${products.lowStockThreshold} IS NOT NULL`,
                lte(
                    products.currentStock,
                    products.lowStockThreshold!,
                ),
            ),
        )
        .get();

    // -------------------------------------------------------------------------
    // Return Dashboard Summary
    // -------------------------------------------------------------------------
    return {
        todaySales,
        todayPayments,
        outstanding,
        lowStock: Number(
            lowStockResult?.count ?? 0,
        ),
    };
}

export function getRecentTransactions(
    businessId: number,
    limit = 5,
): DashboardRecentTransaction[] {
    const transactions: DashboardRecentTransaction[] = [];

    // -------------------------------------------------------------------------
    // Customer name expression
    // -------------------------------------------------------------------------
    const customerNameExpression = sql<string>`
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
    `;

    // -------------------------------------------------------------------------
    // 1. Daily Entries / Sales
    // -------------------------------------------------------------------------
    const sales = db
        .select({
            id: dailyEntries.id,
            customerName: customerNameExpression,
            total: dailyEntries.total,
            createdAt: dailyEntries.createdAt,
        })
        .from(dailyEntries)
        .innerJoin(
            customers,
            eq(
                dailyEntries.customerId,
                customers.id,
            ),
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
            eq(
                dailyEntries.businessId,
                businessId,
            ),
        )
        .all();

    for (const sale of sales) {
        transactions.push({
            id: `sale-${sale.id}`,

            type: "CREDIT",

            category: "SALE",

            title: sale.customerName,

            description: "Sale",

            amount: Number(
                sale.total ?? 0,
            ),

            transactionDate: sale.createdAt,
        });
    }

    // -------------------------------------------------------------------------
    // 2. Customer Payments
    // -------------------------------------------------------------------------
    const customerPayments = db
        .select({
            id: dailyEntryPayments.id,
            customerName: customerNameExpression,
            amount: dailyEntryPayments.amount,
            createdAt: dailyEntryPayments.createdAt,
        })
        .from(dailyEntryPayments)
        .innerJoin(
            dailyEntries,
            eq(
                dailyEntryPayments.entryId,
                dailyEntries.id,
            ),
        )
        .innerJoin(
            customers,
            eq(
                dailyEntries.customerId,
                customers.id,
            ),
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
            eq(
                dailyEntryPayments.businessId,
                businessId,
            ),
        )
        .all();

    for (const payment of customerPayments) {
        transactions.push({
            id: `payment-${payment.id}`,

            type: "CREDIT",

            category: "PAYMENT",

            title: payment.customerName,

            description: "Payment Received",

            amount: Number(
                payment.amount ?? 0,
            ),

            transactionDate: payment.createdAt,
        });
    }

    // -------------------------------------------------------------------------
    // 3. Business Expenses
    // -------------------------------------------------------------------------
    const businessExpenses = db
        .select({
            id: expenses.id,
            categoryName: expenseCategories.name,
            description: expenses.description,
            amount: expenses.amount,
            createdAt: expenses.createdAt,
        })
        .from(expenses)
        .leftJoin(
            expenseCategories,
            eq(
                expenses.categoryId,
                expenseCategories.id,
            ),
        )
        .where(
            eq(
                expenses.businessId,
                businessId,
            ),
        )
        .all();

    for (const expense of businessExpenses) {
        transactions.push({
            id: `expense-${expense.id}`,

            type: "DEBIT",

            category: "EXPENSE",

            title:
                expense.categoryName ??
                "Business Expense",

            description: expense.description,

            amount: Number(
                expense.amount ?? 0,
            ),

            transactionDate: expense.createdAt,
        });
    }

    // -------------------------------------------------------------------------
    // 4. Stock Purchases
    // -------------------------------------------------------------------------
    const stockPurchasesRows = db
        .select({
            id: stockPurchases.id,
            supplierName: suppliers.name,
            total: stockPurchases.total,
            createdAt: stockPurchases.createdAt,
        })
        .from(stockPurchases)
        .leftJoin(
            suppliers,
            eq(
                stockPurchases.supplierId,
                suppliers.id,
            ),
        )
        .where(
            eq(
                stockPurchases.businessId,
                businessId,
            ),
        )
        .all();

    for (const purchase of stockPurchasesRows) {
        transactions.push({
            id: `stock-purchase-${purchase.id}`,

            type: "DEBIT",

            category: "STOCK_PURCHASE",

            title:
                purchase.supplierName ??
                "Stock Purchase",

            description: "Stock Purchase",

            amount: Number(
                purchase.total ?? 0,
            ),

            transactionDate: purchase.createdAt,
        });
    }

    // -------------------------------------------------------------------------
    // Sort newest first
    // -------------------------------------------------------------------------
    transactions.sort(
        (a, b) =>
            new Date(
                b.transactionDate,
            ).getTime() -
            new Date(
                a.transactionDate,
            ).getTime(),
    );

    // -------------------------------------------------------------------------
    // Return latest transactions
    // -------------------------------------------------------------------------
    return transactions.slice(
        0,
        limit,
    );
}

export function getSalesOverview(
    businessId: number,
    days = 7,
): DashboardSalesOverview[] {
    const result = db
        .select({
            date: dailyEntries.entryDate,
            total: sql<number>`
          COALESCE(SUM(${dailyEntries.total}), 0)
        `,
        })
        .from(dailyEntries)
        .where(
            and(
                eq(dailyEntries.businessId, businessId),
                sql`
            ${dailyEntries.entryDate} >= date(
              'now',
              '-' || ${days - 1} || ' days'
            )
          `,
            ),
        )
        .groupBy(dailyEntries.entryDate)
        .orderBy(dailyEntries.entryDate)
        .all();

    const salesByDate = new Map(
        result.map((item) => [
            item.date,
            Number(item.total ?? 0),
        ]),
    );

    const salesOverview: DashboardSalesOverview[] = [];

    for (let index = days - 1; index >= 0; index--) {
        const date = new Date();

        date.setDate(date.getDate() - index);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(
            2,
            "0",
        );
        const day = String(date.getDate()).padStart(2, "0");

        const dateString = `${year}-${month}-${day}`;

        salesOverview.push({
            date: dateString,
            total: salesByDate.get(dateString) ?? 0,
        });
    }

    return salesOverview;
}