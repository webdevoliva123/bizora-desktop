import { and, desc, eq, sql } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import { db } from "@/lib/db";
import {
  businessRegistrations,
  businesses,
  customerBusinessDetails,
  customerPersonDetails,
  dailyEntries,
  dailyEntryItems,
  dailyEntryPayments,
  expenseCategories,
  expenses,
  monthlyAccountPayments,
  products,
  stockPurchasePayments,
  stockPurchases,
  suppliers,
  taxRegistrations,
  workerPayments,
  workers,
} from "@/lib/db/schema";
import { buildHealth, buildInsights, totalCosts } from "@/lib/reports/health";
import {
  bucketKeys,
  bucketLabel,
  bucketLongLabel,
  currentPeriodKey,
  monthsInPeriod,
  periodLabel,
  shiftPeriod,
  type ReportPeriodType,
} from "@/lib/reports/period";
import type {
  DueRow,
  ProductRow,
  RankedRow,
  ReportData,
  ReportPoint,
  ReportTotals,
  SalaryDueRow,
} from "@/lib/types/report";

/* -------------------------------------------------------------------------- */
/* Sources: every table that feeds the report                                 */
/* -------------------------------------------------------------------------- */

type Source = {
  table: SQLiteTable;
  date: SQLiteColumn;
  amount: SQLiteColumn;
  business: SQLiteColumn;
};

const SOURCES = {
  sales: {
    table: dailyEntries,
    date: dailyEntries.entryDate,
    amount: dailyEntries.total,
    business: dailyEntries.businessId,
  },
  entryPayments: {
    table: dailyEntryPayments,
    date: dailyEntryPayments.paymentDate,
    amount: dailyEntryPayments.amount,
    business: dailyEntryPayments.businessId,
  },
  accountPayments: {
    table: monthlyAccountPayments,
    date: monthlyAccountPayments.paymentDate,
    amount: monthlyAccountPayments.amount,
    business: monthlyAccountPayments.businessId,
  },
  purchases: {
    table: stockPurchases,
    date: stockPurchases.purchaseDate,
    amount: stockPurchases.total,
    business: stockPurchases.businessId,
  },
  supplierPayments: {
    table: stockPurchasePayments,
    date: stockPurchasePayments.paymentDate,
    amount: stockPurchasePayments.amount,
    business: stockPurchasePayments.businessId,
  },
  expenses: {
    table: expenses,
    date: expenses.expenseDate,
    amount: expenses.amount,
    business: expenses.businessId,
  },
  salaries: {
    table: workerPayments,
    date: workerPayments.paymentDate,
    amount: workerPayments.amount,
    business: workerPayments.businessId,
  },
} satisfies Record<string, Source>;

/** Compares the yyyy / yyyy-MM start of a date column with a period key. */
function compare(date: SQLiteColumn, prefix: string, op: "=" | "<" | "<=") {
  return sql`substr(${date}, 1, ${sql.raw(String(prefix.length))}) ${sql.raw(op)} ${prefix}`;
}

type Bucket = { total: number; count: number };

function bucketed(
  source: Source,
  businessId: number,
  prefix: string,
  bucketLen: number,
) {
  const bucket = sql<string>`substr(${source.date}, 1, ${sql.raw(String(bucketLen))})`;

  const rows = db
    .select({
      bucket,
      total: sql<number>`coalesce(sum(${source.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(source.table)
    .where(and(eq(source.business, businessId), compare(source.date, prefix, "=")))
    .groupBy(bucket)
    .all();

  return new Map<string, Bucket>(
    rows.map((row) => [
      row.bucket,
      { total: Number(row.total), count: Number(row.count) },
    ]),
  );
}

function sumUpTo(
  source: Source,
  businessId: number,
  prefix: string,
  op: "<" | "<=",
) {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${source.amount}), 0)` })
    .from(source.table)
    .where(and(eq(source.business, businessId), compare(source.date, prefix, op)))
    .get();

  return Number(row?.total ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Period rows + totals                                                       */
/* -------------------------------------------------------------------------- */

type Row = {
  key: string;
  sales: number;
  salesCount: number;
  purchases: number;
  purchaseCount: number;
  expenses: number;
  expenseCount: number;
  salaries: number;
  collected: number;
  supplierPaid: number;
};

function collectRows(
  businessId: number,
  type: ReportPeriodType,
  key: string,
): Row[] {
  const bucketLen = type === "month" ? 10 : 7;

  const sales = bucketed(SOURCES.sales, businessId, key, bucketLen);
  const entryPayments = bucketed(SOURCES.entryPayments, businessId, key, bucketLen);
  const accountPayments = bucketed(SOURCES.accountPayments, businessId, key, bucketLen);
  const purchases = bucketed(SOURCES.purchases, businessId, key, bucketLen);
  const supplierPayments = bucketed(SOURCES.supplierPayments, businessId, key, bucketLen);
  const expenseRows = bucketed(SOURCES.expenses, businessId, key, bucketLen);
  const salaries = bucketed(SOURCES.salaries, businessId, key, bucketLen);

  const total = (map: Map<string, Bucket>, bucketKey: string) =>
    map.get(bucketKey)?.total ?? 0;
  const count = (map: Map<string, Bucket>, bucketKey: string) =>
    map.get(bucketKey)?.count ?? 0;

  return bucketKeys(type, key).map((bucketKey) => ({
    key: bucketKey,
    sales: total(sales, bucketKey),
    salesCount: count(sales, bucketKey),
    purchases: total(purchases, bucketKey),
    purchaseCount: count(purchases, bucketKey),
    expenses: total(expenseRows, bucketKey),
    expenseCount: count(expenseRows, bucketKey),
    salaries: total(salaries, bucketKey),
    collected:
      total(entryPayments, bucketKey) + total(accountPayments, bucketKey),
    supplierPaid: total(supplierPayments, bucketKey),
  }));
}

function toTotals(rows: Row[]): ReportTotals {
  const sum = (pick: (row: Row) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);

  const sales = sum((row) => row.sales);
  const purchases = sum((row) => row.purchases);
  const expenseTotal = sum((row) => row.expenses);
  const salaries = sum((row) => row.salaries);
  const collected = sum((row) => row.collected);
  const supplierPaid = sum((row) => row.supplierPaid);

  const cashOut = supplierPaid + expenseTotal + salaries;
  const profit = sales - purchases - expenseTotal - salaries;

  return {
    sales,
    salesCount: sum((row) => row.salesCount),
    purchases,
    purchaseCount: sum((row) => row.purchaseCount),
    expenses: expenseTotal,
    expenseCount: sum((row) => row.expenseCount),
    salaries,
    collected,
    supplierPaid,
    cashIn: collected,
    cashOut,
    netCash: collected - cashOut,
    profit,
    margin: sales > 0 ? profit / sales : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Breakdown lists (inside the period)                                        */
/* -------------------------------------------------------------------------- */

const customerName = sql<string>`coalesce(${customerBusinessDetails.businessName}, trim(${customerPersonDetails.firstName} || ' ' || coalesce(${customerPersonDetails.lastName}, '')), 'Customer')`;

function getBreakdown(businessId: number, key: string) {
  const productRows: ProductRow[] = db
    .select({
      id: dailyEntryItems.productId,
      name: products.name,
      unit: products.unit,
      quantity: sql<number>`coalesce(sum(${dailyEntryItems.quantity}), 0)`,
      amount: sql<number>`coalesce(sum(${dailyEntryItems.total}), 0)`,
    })
    .from(dailyEntryItems)
    .innerJoin(dailyEntries, eq(dailyEntries.id, dailyEntryItems.entryId))
    .innerJoin(products, eq(products.id, dailyEntryItems.productId))
    .where(
      and(
        eq(dailyEntries.businessId, businessId),
        compare(dailyEntries.entryDate, key, "="),
      ),
    )
    .groupBy(dailyEntryItems.productId, products.name, products.unit)
    .orderBy(desc(sql`sum(${dailyEntryItems.total})`))
    .limit(8)
    .all()
    .map((row) => ({
      ...row,
      quantity: Number(row.quantity),
      amount: Number(row.amount),
    }));

  const customerRows: RankedRow[] = db
    .select({
      id: dailyEntries.customerId,
      name: customerName,
      count: sql<number>`count(*)`,
      amount: sql<number>`coalesce(sum(${dailyEntries.total}), 0)`,
    })
    .from(dailyEntries)
    .leftJoin(
      customerBusinessDetails,
      eq(customerBusinessDetails.customerId, dailyEntries.customerId),
    )
    .leftJoin(
      customerPersonDetails,
      eq(customerPersonDetails.customerId, dailyEntries.customerId),
    )
    .where(
      and(
        eq(dailyEntries.businessId, businessId),
        compare(dailyEntries.entryDate, key, "="),
      ),
    )
    .groupBy(
      dailyEntries.customerId,
      customerBusinessDetails.businessName,
      customerPersonDetails.firstName,
      customerPersonDetails.lastName,
    )
    .orderBy(desc(sql`sum(${dailyEntries.total})`))
    .limit(8)
    .all()
    .map((row) => ({
      ...row,
      count: Number(row.count),
      amount: Number(row.amount),
    }));

  const categoryRows: RankedRow[] = db
    .select({
      id: expenses.categoryId,
      name: sql<string>`coalesce(${expenseCategories.name}, 'Uncategorised')`,
      count: sql<number>`count(*)`,
      amount: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(
      and(
        eq(expenses.businessId, businessId),
        compare(expenses.expenseDate, key, "="),
      ),
    )
    .groupBy(expenses.categoryId, expenseCategories.name)
    .orderBy(desc(sql`sum(${expenses.amount})`))
    .all()
    .map((row) => ({
      ...row,
      count: Number(row.count),
      amount: Number(row.amount),
    }));

  const supplierRows: RankedRow[] = db
    .select({
      id: stockPurchases.supplierId,
      name: sql<string>`coalesce(${suppliers.name}, 'No supplier')`,
      count: sql<number>`count(*)`,
      amount: sql<number>`coalesce(sum(${stockPurchases.total}), 0)`,
    })
    .from(stockPurchases)
    .leftJoin(suppliers, eq(suppliers.id, stockPurchases.supplierId))
    .where(
      and(
        eq(stockPurchases.businessId, businessId),
        compare(stockPurchases.purchaseDate, key, "="),
      ),
    )
    .groupBy(stockPurchases.supplierId, suppliers.name)
    .orderBy(desc(sql`sum(${stockPurchases.total})`))
    .limit(8)
    .all()
    .map((row) => ({
      ...row,
      count: Number(row.count),
      amount: Number(row.amount),
    }));

  return {
    products: productRows,
    customers: customerRows,
    expenseCategories: categoryRows,
    suppliers: supplierRows,
  };
}

/* -------------------------------------------------------------------------- */
/* Dues (balances as of the end of the period)                                */
/* -------------------------------------------------------------------------- */

function getDues(businessId: number, key: string) {
  const sold = db
    .select({
      id: dailyEntries.customerId,
      name: customerName,
      amount: sql<number>`coalesce(sum(${dailyEntries.total}), 0)`,
    })
    .from(dailyEntries)
    .leftJoin(
      customerBusinessDetails,
      eq(customerBusinessDetails.customerId, dailyEntries.customerId),
    )
    .leftJoin(
      customerPersonDetails,
      eq(customerPersonDetails.customerId, dailyEntries.customerId),
    )
    .where(
      and(
        eq(dailyEntries.businessId, businessId),
        compare(dailyEntries.entryDate, key, "<="),
      ),
    )
    .groupBy(
      dailyEntries.customerId,
      customerBusinessDetails.businessName,
      customerPersonDetails.firstName,
      customerPersonDetails.lastName,
    )
    .all();

  const entryPaid = db
    .select({
      id: dailyEntries.customerId,
      amount: sql<number>`coalesce(sum(${dailyEntryPayments.amount}), 0)`,
    })
    .from(dailyEntryPayments)
    .innerJoin(dailyEntries, eq(dailyEntries.id, dailyEntryPayments.entryId))
    .where(
      and(
        eq(dailyEntryPayments.businessId, businessId),
        compare(dailyEntryPayments.paymentDate, key, "<="),
      ),
    )
    .groupBy(dailyEntries.customerId)
    .all();

  const accountPaid = db
    .select({
      id: monthlyAccountPayments.customerId,
      amount: sql<number>`coalesce(sum(${monthlyAccountPayments.amount}), 0)`,
    })
    .from(monthlyAccountPayments)
    .where(
      and(
        eq(monthlyAccountPayments.businessId, businessId),
        compare(monthlyAccountPayments.paymentDate, key, "<="),
      ),
    )
    .groupBy(monthlyAccountPayments.customerId)
    .all();

  const customerPaid = new Map<number, number>();
  for (const row of [...entryPaid, ...accountPaid]) {
    customerPaid.set(row.id, (customerPaid.get(row.id) ?? 0) + Number(row.amount));
  }

  const customerDues: DueRow[] = sold
    .map((row) => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount) - (customerPaid.get(row.id) ?? 0),
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const bought = db
    .select({
      id: stockPurchases.supplierId,
      name: sql<string>`coalesce(${suppliers.name}, 'No supplier')`,
      amount: sql<number>`coalesce(sum(${stockPurchases.total}), 0)`,
    })
    .from(stockPurchases)
    .leftJoin(suppliers, eq(suppliers.id, stockPurchases.supplierId))
    .where(
      and(
        eq(stockPurchases.businessId, businessId),
        compare(stockPurchases.purchaseDate, key, "<="),
      ),
    )
    .groupBy(stockPurchases.supplierId, suppliers.name)
    .all();

  const supplierPaid = db
    .select({
      id: stockPurchases.supplierId,
      amount: sql<number>`coalesce(sum(${stockPurchasePayments.amount}), 0)`,
    })
    .from(stockPurchasePayments)
    .innerJoin(
      stockPurchases,
      eq(stockPurchases.id, stockPurchasePayments.purchaseId),
    )
    .where(
      and(
        eq(stockPurchasePayments.businessId, businessId),
        compare(stockPurchasePayments.paymentDate, key, "<="),
      ),
    )
    .groupBy(stockPurchases.supplierId)
    .all();

  const paidBySupplier = new Map<string, number>(
    supplierPaid.map((row) => [String(row.id), Number(row.amount)]),
  );

  const supplierDues: DueRow[] = bought
    .map((row) => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount) - (paidBySupplier.get(String(row.id)) ?? 0),
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return { customers: customerDues, suppliers: supplierDues };
}

/* -------------------------------------------------------------------------- */
/* Salary due (monthly-paid workers only)                                     */
/* -------------------------------------------------------------------------- */

function getSalaryDue(
  businessId: number,
  type: ReportPeriodType,
  key: string,
): { total: number; workers: SalaryDueRow[] } {
  const thisMonth = currentPeriodKey("month");
  const months = monthsInPeriod(type, key).filter((month) => month <= thisMonth);

  if (months.length === 0) return { total: 0, workers: [] };

  const staff = db
    .select({
      id: workers.id,
      name: workers.name,
      role: workers.role,
      joiningDate: workers.joiningDate,
      amount: workers.defaultPaymentAmount,
    })
    .from(workers)
    .where(
      and(
        eq(workers.businessId, businessId),
        eq(workers.active, true),
        eq(workers.paymentType, "MONTHLY"),
      ),
    )
    .all();

  const period = sql<string>`coalesce(${workerPayments.paymentPeriod}, substr(${workerPayments.paymentDate}, 1, 7))`;

  const paid = db
    .select({
      workerId: workerPayments.workerId,
      period,
      amount: sql<number>`coalesce(sum(${workerPayments.amount}), 0)`,
    })
    .from(workerPayments)
    .where(
      and(
        eq(workerPayments.businessId, businessId),
        sql`${period} in (${sql.join(
          months.map((month) => sql`${month}`),
          sql`, `,
        )})`,
      ),
    )
    .groupBy(workerPayments.workerId, period)
    .all();

  const paidMap = new Map<string, number>(
    paid.map((row) => [`${row.workerId}|${row.period}`, Number(row.amount)]),
  );

  const rows: SalaryDueRow[] = [];

  for (const person of staff) {
    const monthly = person.amount ?? 0;
    if (monthly <= 0) continue;

    let expected = 0;
    let paidTotal = 0;
    let due = 0;

    for (const month of months) {
      if (person.joiningDate && person.joiningDate.slice(0, 7) > month) continue;

      const paidThisMonth = paidMap.get(`${person.id}|${month}`) ?? 0;

      expected += monthly;
      paidTotal += paidThisMonth;
      due += Math.max(monthly - paidThisMonth, 0);
    }

    if (expected > 0) {
      rows.push({
        id: person.id,
        name: person.name,
        role: person.role,
        expected,
        paid: paidTotal,
        due,
      });
    }
  }

  rows.sort((a, b) => b.due - a.due);

  return {
    total: rows.reduce((sum, row) => sum + row.due, 0),
    workers: rows,
  };
}

/* -------------------------------------------------------------------------- */
/* Full report                                                                */
/* -------------------------------------------------------------------------- */

export function getReport(
  businessId: number,
  type: ReportPeriodType,
  key: string,
): ReportData | null {
  const business = db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .get();

  if (!business) return null;

  const previousKey = shiftPeriod(type, key, -1);
  const label = periodLabel(type, key);
  const previousLabel = periodLabel(type, previousKey);

  const rows = collectRows(businessId, type, key);
  const previousRows = collectRows(businessId, type, previousKey);

  const totals = toTotals(rows);
  const previous = toTotals(previousRows);

  // Balances carried in from before this period, then rolled forward per bucket
  let receivable =
    sumUpTo(SOURCES.sales, businessId, key, "<") -
    sumUpTo(SOURCES.entryPayments, businessId, key, "<") -
    sumUpTo(SOURCES.accountPayments, businessId, key, "<");

  let payable =
    sumUpTo(SOURCES.purchases, businessId, key, "<") -
    sumUpTo(SOURCES.supplierPayments, businessId, key, "<");

  const series: ReportPoint[] = rows.map((row, index) => {
    receivable += row.sales - row.collected;
    payable += row.purchases - row.supplierPaid;

    return {
      key: row.key,
      label: bucketLabel(type, row.key),
      sales: row.sales,
      purchases: row.purchases,
      expenses: row.expenses,
      salaries: row.salaries,
      profit: row.sales - row.purchases - row.expenses - row.salaries,
      cashIn: row.collected,
      cashOut: row.supplierPaid + row.expenses + row.salaries,
      receivable: Math.max(receivable, 0),
      payable: Math.max(payable, 0),
      previousSales: previousRows[index]?.sales ?? 0,
    };
  });

  const salaryDue = getSalaryDue(businessId, type, key);
  const last = series[series.length - 1];

  const outstanding = {
    receivable: last?.receivable ?? 0,
    payable: last?.payable ?? 0,
    salaryDue: salaryDue.total,
  };

  const breakdown = getBreakdown(businessId, key);
  const dues = getDues(businessId, key);

  const currency = business.currency || "INR";
  const money = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);

  const peakPoint = series.reduce<ReportPoint | null>(
    (best, point) => (point.sales > (best?.sales ?? 0) ? point : best),
    null,
  );

  const health = buildHealth(totals, previous, outstanding.receivable, previousLabel);

  const insights = buildInsights({
    type,
    current: totals,
    previous,
    previousLabel,
    receivable: outstanding.receivable,
    payable: outstanding.payable,
    salaryDue: { total: salaryDue.total, workers: salaryDue.workers.filter((w) => w.due > 0).length },
    topExpense: breakdown.expenseCategories[0]
      ? {
          name: breakdown.expenseCategories[0].name,
          amount: breakdown.expenseCategories[0].amount,
        }
      : null,
    peak: peakPoint
      ? { label: bucketLongLabel(type, peakPoint.key), sales: peakPoint.sales }
      : null,
    money,
  });

  const taxes = db
    .select({
      taxSystem: taxRegistrations.taxSystem,
      registrationNumber: taxRegistrations.registrationNumber,
    })
    .from(taxRegistrations)
    .where(eq(taxRegistrations.businessId, businessId))
    .all();

  const registrations = db
    .select({
      registrationType: businessRegistrations.registrationType,
      registrationNumber: businessRegistrations.registrationNumber,
    })
    .from(businessRegistrations)
    .where(eq(businessRegistrations.businessId, businessId))
    .all();

  return {
    period: {
      type,
      key,
      label,
      previousKey,
      previousLabel,
      isCurrent: key === currentPeriodKey(type),
    },
    business: {
      name: business.name,
      logoPath: business.logoPath,
      businessCategory: business.businessCategory,
      country: business.country,
      currency,
      address: business.address,
      city: business.city,
      state: business.state,
      postalCode: business.postalCode,
      phone: business.phone,
      email: business.email,
    },
    totals,
    previous,
    series,
    outstanding,
    health,
    insights,
    breakdown,
    dues: { ...dues, salaries: salaryDue.workers.filter((worker) => worker.due > 0) },
    taxRegistrations: taxes,
    businessRegistrations: registrations,
    generatedAt: new Date().toISOString(),
  };
}

export { totalCosts };