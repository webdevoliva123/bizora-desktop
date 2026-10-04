import "server-only";

import { eq } from "drizzle-orm";

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
      .where(eq(customers.businessId, businessId))
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
    .where(eq(products.businessId, businessId))
    .all();
}