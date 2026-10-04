import "server-only";

import { and, desc, eq, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
    customerBusinessDetails,
    customerPersonDetails,
    customers,
  dailyEntries,
  invoices,
  payments,
  products,
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

  /*
   * Today's Sales
   *
   * Daily entries represent the business sales activity.
   * Money is stored in minor currency units.
   */
  const salesResult = db
    .select({
      total: sql<number>`COALESCE(SUM(${dailyEntries.total}), 0)`,
    })
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.businessId, businessId),
        eq(dailyEntries.entryDate, today),
      ),
    )
    .get();

  /*
   * Today's Payments
   */
  const paymentsResult = db
    .select({
      total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.businessId, businessId),
        eq(payments.paymentDate, today),
      ),
    )
    .get();

  /*
   * Outstanding
   *
   * Calculate invoice total minus payments received
   * against those invoices.
   */
  const outstandingResult = db
    .select({
      total: sql<number>`
        COALESCE(
          SUM(${invoices.total}) -
          COALESCE(
            (
              SELECT SUM(${payments.amount})
              FROM ${payments}
              WHERE ${payments.invoiceId} = ${invoices.id}
            ),
            0
          ),
          0
        )
      `,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.businessId, businessId),
        sql`${invoices.status} != 'PAID'`,
      ),
    )
    .get();

  /*
   * Low Stock
   *
   * Only count active products that have a configured
   * low-stock threshold.
   */
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

  return {
    todaySales: Number(salesResult?.total ?? 0),
    todayPayments: Number(paymentsResult?.total ?? 0),
    outstanding: Number(outstandingResult?.total ?? 0),
    lowStock: Number(lowStockResult?.count ?? 0),
  };
}

export function getRecentTransactions(
    businessId: number,
    limit = 5,
  ): DashboardRecentTransaction[] {
    const transactions = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerName: sql<string>`
          CASE
            WHEN ${customers.type} = 'PERSON'
              THEN (
                SELECT
                  TRIM(
                    COALESCE(${customerPersonDetails.firstName}, '') ||
                    ' ' ||
                    COALESCE(${customerPersonDetails.lastName}, '')
                  )
                FROM ${customerPersonDetails}
                WHERE ${customerPersonDetails.customerId} = ${customers.id}
                LIMIT 1
              )
            WHEN ${customers.type} = 'BUSINESS'
              THEN (
                SELECT ${customerBusinessDetails.businessName}
                FROM ${customerBusinessDetails}
                WHERE ${customerBusinessDetails.customerId} = ${customers.id}
                LIMIT 1
              )
            ELSE 'Unknown Customer'
          END
        `,
        total: invoices.total,
        status: invoices.status,
        invoiceDate: invoices.invoiceDate,
      })
      .from(invoices)
      .innerJoin(
        customers,
        eq(invoices.customerId, customers.id),
      )
      .where(eq(invoices.businessId, businessId))
      .orderBy(desc(invoices.invoiceDate))
      .limit(limit)
      .all();
  
    return transactions;
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