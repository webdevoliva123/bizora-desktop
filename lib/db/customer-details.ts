import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  customers,
  customerPersonDetails,
  customerBusinessDetails,
  dailyEntries,
} from "@/lib/db/schema";

export interface CustomerDetailsSummary {
  customerId: number;

  totalEntries: number;
  totalSales: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface CustomerDetailsData {
  id: number;
  businessId: number;
  type: "PERSON" | "BUSINESS";

  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;

  active: boolean;

  person: {
    firstName: string;
    lastName: string | null;
  } | null;

  business: {
    businessName: string;
    contactPerson: string | null;
    taxRegistrationNumber: string | null;
  } | null;

  createdAt: string;
  updatedAt: string;

  summary: CustomerDetailsSummary;
}

export function getCustomerDetails(
  businessId: number,
  customerId: number,
): CustomerDetailsData | null {
  const customer = db
    .select({
      id: customers.id,
      businessId: customers.businessId,
      type: customers.type,

      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      city: customers.city,
      state: customers.state,
      postalCode: customers.postalCode,

      active: customers.active,

      personFirstName: customerPersonDetails.firstName,
      personLastName: customerPersonDetails.lastName,

      businessName: customerBusinessDetails.businessName,
      contactPerson: customerBusinessDetails.contactPerson,
      taxRegistrationNumber:
        customerBusinessDetails.taxRegistrationNumber,

      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
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
    .limit(1)
    .all();
    ;

  const row = customer[0];

  if (!row) {
    return null;
  }

  const summaryRow = db
    .select({
      totalEntries: sql<number>`COUNT(${dailyEntries.id})`,

      totalSales: sql<number>`
        COALESCE(SUM(${dailyEntries.total}), 0)
      `,

      totalPaid: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${dailyEntries.paymentStatus} = 'PAID'
              THEN ${dailyEntries.total}
              ELSE 0
            END
          ),
          0
        )
      `,
    })
    .from(dailyEntries)
    .where(
      and(
        eq(dailyEntries.businessId, businessId),
        eq(dailyEntries.customerId, customerId),
      ),
    ).all();

  const summary = summaryRow[0];

  const totalEntries = Number(summary?.totalEntries ?? 0);
  const totalSales = Number(summary?.totalSales ?? 0);
  const totalPaid = Number(summary?.totalPaid ?? 0);

  return {
    id: row.id,
    businessId: row.businessId,
    type:
      String(row.type).toUpperCase() === "BUSINESS"
        ? "BUSINESS"
        : "PERSON",

    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,

    active: row.active,

    person:
      row.personFirstName !== null
        ? {
            firstName: row.personFirstName,
            lastName: row.personLastName,
          }
        : null,

    business:
      row.businessName !== null
        ? {
            businessName: row.businessName,
            contactPerson: row.contactPerson,
            taxRegistrationNumber:
              row.taxRegistrationNumber,
          }
        : null,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,

    summary: {
      customerId: row.id,
      totalEntries,
      totalSales,
      totalPaid,
      totalOutstanding: Math.max(
        totalSales - totalPaid,
        0,
      ),
    },
  };
}