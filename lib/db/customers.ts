import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
    customers,
    customerBusinessDetails,
    customerPersonDetails,
    dailyEntries,
} from "@/lib/db/schema";

import type {
    CustomerDetails,
    CustomerListItem,
    CustomerType,
    CustomerTypeFilter,
} from "@/lib/types/customer";

function normalizeCustomerType(
    value: string | null | undefined,
): CustomerType {
    return value?.toUpperCase() === "BUSINESS"
        ? "BUSINESS"
        : "PERSON";
}

function getCustomerName(row: {
    type: string | null;
    personFirstName: string | null;
    personLastName: string | null;
    businessName: string | null;
}) {
    const type = normalizeCustomerType(row.type);

    if (type === "BUSINESS") {
        return (
            row.businessName?.trim() ||
            "Unnamed Business"
        );
    }

    return (
        [
            row.personFirstName,
            row.personLastName,
        ]
            .filter(Boolean)
            .join(" ")
            .trim() || "Unnamed Customer"
    );
}

export interface GetCustomersOptions {
    type?: CustomerTypeFilter;
    search?: string;
}

export function getCustomers(
    businessId: number,
    options: GetCustomersOptions = {},
): CustomerListItem[] {
    const {
        type = "ALL",
        search = "",
    } = options;

    const conditions = [
        eq(customers.businessId, businessId),
    ];

    if (type !== "ALL") {
        conditions.push(
            sql`UPPER(${customers.type}) = ${type}`,
        );
    }

    const searchValue = search.trim();

    if (searchValue) {
        const pattern = `%${searchValue.toLowerCase()}%`;

        conditions.push(
            sql`(
        LOWER(
          COALESCE(
            ${customerBusinessDetails.businessName},
            TRIM(
              COALESCE(
                ${customerPersonDetails.firstName},
                ''
              ) || ' ' ||
              COALESCE(
                ${customerPersonDetails.lastName},
                ''
              )
            )
          )
        ) LIKE ${pattern}
        OR LOWER(
          COALESCE(${customers.phone}, '')
        ) LIKE ${pattern}
        OR LOWER(
          COALESCE(${customers.email}, '')
        ) LIKE ${pattern}
      )`,
        );
    }

    const rows = db
        .select({
            id: customers.id,

            type: sql<string>`
        UPPER(${customers.type})
      `,

            phone: customers.phone,
            email: customers.email,
            city: customers.city,
            active: customers.active,
            createdAt: customers.createdAt,

            personFirstName:
                customerPersonDetails.firstName,

            personLastName:
                customerPersonDetails.lastName,

            businessName:
                customerBusinessDetails.businessName,

            entryCount: sql<number>`
        COUNT(${dailyEntries.id})
      `,
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
        .leftJoin(
            dailyEntries,
            eq(
                dailyEntries.customerId,
                customers.id,
            ),
        )
        .where(and(...conditions))
        .groupBy(
            customers.id,
            customers.type,
            customers.phone,
            customers.email,
            customers.city,
            customers.active,
            customers.createdAt,
            customerPersonDetails.firstName,
            customerPersonDetails.lastName,
            customerBusinessDetails.businessName,
        )
        .orderBy(
            asc(
                sql`
          LOWER(
            COALESCE(
              ${customerBusinessDetails.businessName},
              TRIM(
                COALESCE(
                  ${customerPersonDetails.firstName},
                  ''
                ) || ' ' ||
                COALESCE(
                  ${customerPersonDetails.lastName},
                  ''
                )
              )
            )
          )
        `,
            ),
        )
        .all();

    return rows.map((row) => ({
        id: row.id,
        type: normalizeCustomerType(row.type),
        name: getCustomerName(row),
        phone: row.phone,
        email: row.email,
        city: row.city,
        active: row.active,
        entryCount: Number(row.entryCount),
        createdAt: row.createdAt,
    }));
}

export interface CreateCustomerInput {
    businessId: number;
    type: "PERSON" | "BUSINESS";

    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;

    firstName?: string | null;
    lastName?: string | null;

    businessName?: string | null;
    contactPerson?: string | null;
    taxRegistrationNumber?: string | null;
}

export async function createCustomer(input: CreateCustomerInput) {

    const now = new Date().toISOString();


    const result = await db.transaction(async (tx) => {
        const customerResult = await tx
            .insert(customers)
            .values({
                businessId: input.businessId,
                type: input.type,
                phone: input.phone ?? null,
                email: input.email ?? null,
                address: input.address ?? null,
                city: input.city ?? null,
                state: input.state ?? null,
                postalCode: input.postalCode ?? null,
                active: true,
                createdAt: now,
                updatedAt: now,
            })
            .returning({
                id: customers.id,
            });

        const customer = customerResult[0];

        if (!customer) {
            throw new Error("Failed to create customer.");
        }

        if (input.type === "PERSON") {
            await tx.insert(customerPersonDetails).values({
                customerId: customer.id,
                firstName: input.firstName?.trim() ?? "",
                lastName: input.lastName?.trim() || null,
                createdAt: now,
                updatedAt: now,
            });
        }

        if (input.type === "BUSINESS") {
            await tx.insert(customerBusinessDetails).values({
                customerId: customer.id,
                businessName: input.businessName?.trim() ?? "",
                contactPerson: input.contactPerson?.trim() || null,
                taxRegistrationNumber:
                    input.taxRegistrationNumber?.trim() || null,
                createdAt: now,
                updatedAt: now,
            });
        }

        return customer.id;
    });

    return result;
}