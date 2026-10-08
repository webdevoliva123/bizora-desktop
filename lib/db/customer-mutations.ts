import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  customers,
  customerPersonDetails,
  customerBusinessDetails,
  dailyEntries,
  dailyEntryItems,
  dailyEntryPayments,
  invoices,
  invoiceItems,
  payments,
  monthlyAccountPayments,
} from "@/lib/db/schema";

export interface UpdateCustomerInput {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  active?: boolean;

  person?: {
    firstName: string;
    lastName?: string | null;
  };

  business?: {
    businessName: string;
    contactPerson?: string | null;
    taxRegistrationNumber?: string | null;
  };
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export function updateCustomer(
  businessId: number,
  customerId: number,
  input: UpdateCustomerInput,
) {
  return db.transaction((tx) => {
    const customer = tx
      .select({
        id: customers.id,
        type: customers.type,
      })
      .from(customers)
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.businessId, businessId),
        ),
      )
      .limit(1)
      .get();

    if (!customer) {
      throw new Error("Customer not found.");
    }

    const now = new Date().toISOString();

    tx.update(customers)
      .set({
        phone: nullableString(input.phone),
        email: nullableString(input.email),
        address: nullableString(input.address),
        city: nullableString(input.city),
        state: nullableString(input.state),
        postalCode: nullableString(input.postalCode),
        active: input.active ?? true,
        updatedAt: now,
      })
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.businessId, businessId),
        ),
      )
      .run();

    if (customer.type === "PERSON") {
      if (!input.person) {
        throw new Error("Person details are required.");
      }

      const firstName = requiredString(
        input.person.firstName,
        "First name",
      );

      const personDetails = tx
        .select({
          id: customerPersonDetails.id,
        })
        .from(customerPersonDetails)
        .where(eq(customerPersonDetails.customerId, customerId))
        .limit(1)
        .get();

      if (personDetails) {
        tx.update(customerPersonDetails)
          .set({
            firstName,
            lastName: nullableString(input.person.lastName),
            updatedAt: now,
          })
          .where(eq(customerPersonDetails.id, personDetails.id))
          .run();
      } else {
        tx.insert(customerPersonDetails)
          .values({
            customerId,
            firstName,
            lastName: nullableString(input.person.lastName),
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    }

    if (customer.type === "BUSINESS") {
      if (!input.business) {
        throw new Error("Business details are required.");
      }

      const businessName = requiredString(
        input.business.businessName,
        "Business name",
      );

      const businessDetails = tx
        .select({
          id: customerBusinessDetails.id,
        })
        .from(customerBusinessDetails)
        .where(eq(customerBusinessDetails.customerId, customerId))
        .limit(1)
        .get();

      if (businessDetails) {
        tx.update(customerBusinessDetails)
          .set({
            businessName,
            contactPerson: nullableString(input.business.contactPerson),
            taxRegistrationNumber: nullableString(
              input.business.taxRegistrationNumber,
            ),
            updatedAt: now,
          })
          .where(eq(customerBusinessDetails.id, businessDetails.id))
          .run();
      } else {
        tx.insert(customerBusinessDetails)
          .values({
            customerId,
            businessName,
            contactPerson: nullableString(input.business.contactPerson),
            taxRegistrationNumber: nullableString(
              input.business.taxRegistrationNumber,
            ),
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    }

    return customerId;
  });
}

export function deleteCustomer(
    businessId: number,
    customerId: number,
  ) {
    return db.transaction((tx) => {
      const customer = tx
        .select({
          id: customers.id,
        })
        .from(customers)
        .where(
          and(
            eq(customers.id, customerId),
            eq(customers.businessId, businessId),
          ),
        )
        .limit(1)
        .get();
  
      if (!customer) {
        throw new Error("Customer not found.");
      }
  
      // Check whether this customer has any daily entries.
      const dailyEntry = tx
        .select({
          id: dailyEntries.id,
        })
        .from(dailyEntries)
        .where(
          and(
            eq(dailyEntries.businessId, businessId),
            eq(dailyEntries.customerId, customerId),
          ),
        )
        .limit(1)
        .get();
  
      // Check whether this customer has any invoices.
      const invoice = tx
        .select({
          id: invoices.id,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.businessId, businessId),
            eq(invoices.customerId, customerId),
          ),
        )
        .limit(1)
        .get();
  
      // Check whether this customer has any monthly account payments.
      const monthlyPayment = tx
        .select({
          id: monthlyAccountPayments.id,
        })
        .from(monthlyAccountPayments)
        .where(
          and(
            eq(monthlyAccountPayments.businessId, businessId),
            eq(monthlyAccountPayments.customerId, customerId),
          ),
        )
        .limit(1)
        .get();
  
      const hasHistory =
        !!dailyEntry ||
        !!invoice ||
        !!monthlyPayment;
  
      // ------------------------------------------------------------
      // Customer has history:
      // NEVER permanently delete the customer.
      // Simply deactivate them.
      // ------------------------------------------------------------
      if (hasHistory) {
        tx.update(customers)
          .set({
            active: false,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(customers.id, customerId),
              eq(customers.businessId, businessId),
            ),
          )
          .run();
  
        return {
          customerId,
          deleted: false,
          deactivated: true,
        };
      }
  
      // ------------------------------------------------------------
      // Customer has NO history:
      // Safe to permanently delete.
      // ------------------------------------------------------------
  
      tx.delete(customerPersonDetails)
        .where(eq(customerPersonDetails.customerId, customerId))
        .run();
  
      tx.delete(customerBusinessDetails)
        .where(eq(customerBusinessDetails.customerId, customerId))
        .run();
  
      tx.delete(customers)
        .where(
          and(
            eq(customers.id, customerId),
            eq(customers.businessId, businessId),
          ),
        )
        .run();
  
      return {
        customerId,
        deleted: true,
        deactivated: false,
      };
    });
  }