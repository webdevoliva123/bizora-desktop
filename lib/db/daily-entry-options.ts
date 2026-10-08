import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  customerBusinessDetails,
  customerPersonDetails,
  customers,
  products,
} from "@/lib/db/schema";

export interface DailyEntryCustomerOption {
  id: number;
  name: string;
}

export interface DailyEntryProductOption {
  id: number;
  name: string;
  unit: string;
  sellingPrice: number;
  taxRate: number | null;
}

export function getCustomersForDailyEntry(
    businessId: number,
  ): DailyEntryCustomerOption[] {
    const customerRows = db
      .select({
        id: customers.id,
        firstName: customerPersonDetails.firstName,
        lastName: customerPersonDetails.lastName,
        businessName: customerBusinessDetails.businessName,
      })
      .from(customers)
      .leftJoin(
        customerPersonDetails,
        eq(customerPersonDetails.customerId, customers.id),
      )
      .leftJoin(
        customerBusinessDetails,
        eq(customerBusinessDetails.customerId, customers.id),
      )
      .where(
        and(
          eq(customers.businessId, businessId),
          eq(customers.active, true),
          eq(customers.isSystem, false),
        ),
      )
      .all();
  
    return customerRows.map((customer) => {
      const personName =
        `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  
      const name =
        customer.businessName?.trim() ||
        personName ||
        "Unknown Customer";
  
      return {
        id: customer.id,
        name,
      };
    });
  }

export function getProductsForDailyEntry(
  businessId: number,
): DailyEntryProductOption[] {
  return db
    .select({
      id: products.id,
      name: products.name,
      unit: products.unit,
      sellingPrice: products.sellingPrice,
      taxRate: products.taxRate,
    })
    .from(products)
    .where(and(
        eq(products.businessId, businessId),
        eq(products.active, true),
        eq(products.isSystem, false)
    ))
    .all();
}