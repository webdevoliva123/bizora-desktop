import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  businessPaymentDetails,
  businessRegistrations,
  businesses,
  customerBusinessDetails,
  customerPersonDetails,
  customers,
  dailyEntries,
  dailyEntryItems,
  monthlyAccountPayments,
  products,
  taxRegistrations,
} from "@/lib/db/schema";

import {
  getMonthlyAccount,
  type MonthlyAccountStatus,
} from "./monthly-account";

export interface MonthlyAccountBillItem {
  id: number;
  entryId: number;
  entryDate: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface MonthlyAccountBillEntry {
  id: number;
  entryDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: MonthlyAccountBillItem[];
}

export interface MonthlyAccountBillPayment {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference: string | null;
  notes: string | null;
}

export interface MonthlyAccountBill {
  business: {
    id: number;
    name: string;
    logoPath: string | null;
    businessType: string | null;
    businessCategory: string | null;
    country: string | null;
    currency: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  };

  customer: {
    id: number;
    name: string;
    type: "PERSON" | "BUSINESS";
  };

  accountMonth: string;

  entries: MonthlyAccountBillEntry[];

  payments: MonthlyAccountBillPayment[];

  total: number;
  paidAmount: number;
  outstandingAmount: number;
  status: MonthlyAccountStatus;

  paymentDetails: {
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
    branchName: string | null;
    routingCode: string | null;
    paymentIdentifier: string | null;
    qrImagePath: string | null;
    showBankDetails: boolean;
    showQr: boolean;
    paymentInstructions: string | null;
  } | null;

  taxRegistrations: {
    taxSystem: string | null;
    registrationNumber: string | null;
  }[];

  businessRegistrations: {
    authorityName: string | null;
    registrationType: string | null;
    registrationNumber: string | null;
  }[];
}

export function getMonthlyAccountBill(
  businessId: number,
  customerId: number,
  accountMonth: string,
): MonthlyAccountBill | null {
  if (!/^\d{4}-\d{2}$/.test(accountMonth)) {
    return null;
  }

  /*
   * --------------------------------------------------------------------------
   * Monthly account
   * --------------------------------------------------------------------------
   *
   * Reuse the existing monthly-account calculation so the bill and the
   * Customer Account page always use the same totals/status/payment logic.
   */
  const account = getMonthlyAccount(
    businessId,
    customerId,
    accountMonth,
  );

  if (!account) {
    return null;
  }

  /*
   * --------------------------------------------------------------------------
   * Business
   * --------------------------------------------------------------------------
   */
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

  /*
   * --------------------------------------------------------------------------
   * Customer
   * --------------------------------------------------------------------------
   */
  const customer = db
    .select({
      id: customers.id,

      type: sql<"PERSON" | "BUSINESS">`
        UPPER(${customers.type})
      `,

      personFirstName: customerPersonDetails.firstName,
      personLastName: customerPersonDetails.lastName,

      businessName: customerBusinessDetails.businessName,
    })
    .from(customers)
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
        eq(customers.id, customerId),
        eq(customers.businessId, businessId),
      ),
    )
    .get();

  if (!customer) {
    return null;
  }

  const customerName =
    customer.type === "BUSINESS"
      ? customer.businessName || "Unknown Customer"
      : [customer.personFirstName, customer.personLastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "Unknown Customer";

  /*
   * --------------------------------------------------------------------------
   * Monthly entries
   * --------------------------------------------------------------------------
   *
   * Only entries marked MONTHLY belong on this monthly account statement.
   *
   * Immediate entries are deliberately excluded.
   */
  const monthlyEntries = db
    .select({
      id: dailyEntries.id,
      entryDate: dailyEntries.entryDate,
      subtotal: dailyEntries.subtotal,
      discount: dailyEntries.discount,
      tax: dailyEntries.tax,
      total: dailyEntries.total,
    })
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.businessId, businessId),
        eq(dailyEntries.customerId, customerId),
        eq(dailyEntries.paymentType, "MONTHLY"),
        sql`
          substr(${dailyEntries.entryDate}, 1, 7) = ${accountMonth}
        `,
      ),
    )
    .orderBy(
      asc(dailyEntries.entryDate),
      asc(dailyEntries.id),
    )
    .all();

  /*
   * --------------------------------------------------------------------------
   * Items for monthly entries
   * --------------------------------------------------------------------------
   */
  const entries: MonthlyAccountBillEntry[] =
    monthlyEntries.map((entry) => {
      const items = db
        .select({
          id: dailyEntryItems.id,
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
          eq(
            dailyEntryItems.entryId,
            entry.id,
          ),
        )
        .orderBy(asc(dailyEntryItems.id))
        .all();

      return {
        id: entry.id,
        entryDate: entry.entryDate,
        subtotal: Number(entry.subtotal),
        discount: Number(entry.discount),
        tax: Number(entry.tax),
        total: Number(entry.total),

        items: items.map((item) => ({
          id: item.id,
          entryId: entry.id,
          entryDate: entry.entryDate,
          productName: item.productName,
          unit: item.unit,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate ?? 0),
          total: Number(item.total),
        })),
      };
    });

  /*
   * --------------------------------------------------------------------------
   * Monthly account payments
   * --------------------------------------------------------------------------
   *
   * Every payment remains an individual transaction.
   * We intentionally do NOT merge these payments.
   */
  const payments = db
    .select({
      id: monthlyAccountPayments.id,
      amount: monthlyAccountPayments.amount,
      paymentMethod: monthlyAccountPayments.paymentMethod,
      paymentDate: monthlyAccountPayments.paymentDate,
      reference: monthlyAccountPayments.reference,
      notes: monthlyAccountPayments.notes,
    })
    .from(monthlyAccountPayments)
    .where(
      and(
        eq(
          monthlyAccountPayments.businessId,
          businessId,
        ),
        eq(
          monthlyAccountPayments.customerId,
          customerId,
        ),
        eq(
          monthlyAccountPayments.accountMonth,
          accountMonth,
        ),
      ),
    )
    .orderBy(
      asc(monthlyAccountPayments.paymentDate),
      asc(monthlyAccountPayments.id),
    )
    .all();

  /*
   * --------------------------------------------------------------------------
   * Payment details
   * --------------------------------------------------------------------------
   */
  const paymentDetails = db
    .select({
      bankName: businessPaymentDetails.bankName,
      accountName: businessPaymentDetails.accountName,
      accountNumber: businessPaymentDetails.accountNumber,
      branchName: businessPaymentDetails.branchName,
      routingCode: businessPaymentDetails.routingCode,
      paymentIdentifier:
        businessPaymentDetails.paymentIdentifier,
      qrImagePath: businessPaymentDetails.qrImagePath,
      showBankDetails:
        businessPaymentDetails.showBankDetails,
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

  /*
   * --------------------------------------------------------------------------
   * Tax registrations
   * --------------------------------------------------------------------------
   */
  const taxRegistrationRows = db
    .select({
      taxSystem: taxRegistrations.taxSystem,
      registrationNumber:
        taxRegistrations.registrationNumber,
    })
    .from(taxRegistrations)
    .where(
      and(
        eq(
          taxRegistrations.businessId,
          businessId,
        ),
        eq(
          taxRegistrations.isRegistered,
          true,
        ),
      ),
    )
    .orderBy(desc(taxRegistrations.id))
    .all();

  /*
   * --------------------------------------------------------------------------
   * Business registrations
   * --------------------------------------------------------------------------
   */
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

  /*
   * --------------------------------------------------------------------------
   * Return monthly account bill
   * --------------------------------------------------------------------------
   */
  return {
    business,

    customer: {
      id: customer.id,
      name: customerName,
      type: customer.type,
    },

    accountMonth,

    entries,

    payments: payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      reference: payment.reference,
      notes: payment.notes,
    })),

    total: Number(account.total),
    paidAmount: Number(account.paidAmount),
    outstandingAmount: Number(
      account.outstandingAmount,
    ),
    status: account.status,

    paymentDetails: paymentDetails
      ? {
          bankName: paymentDetails.bankName,
          accountName: paymentDetails.accountName,
          accountNumber:
            paymentDetails.accountNumber,
          branchName: paymentDetails.branchName,
          routingCode: paymentDetails.routingCode,
          paymentIdentifier:
            paymentDetails.paymentIdentifier,
          qrImagePath: paymentDetails.qrImagePath,
          showBankDetails:
            Boolean(paymentDetails.showBankDetails),
          showQr: Boolean(paymentDetails.showQr),
          paymentInstructions:
            paymentDetails.paymentInstructions,
        }
      : null,

    taxRegistrations: taxRegistrationRows,

    businessRegistrations:
      businessRegistrationRows,
  };
}