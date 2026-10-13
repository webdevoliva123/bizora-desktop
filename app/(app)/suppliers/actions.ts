"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { getSetupStatus } from "@/lib/db/business";
import {
  createSupplier,
  updateSupplier,
  type SupplierInput,
} from "@/lib/db/suppliers";

export type SupplierActionResult =
  | { success: true }
  | { success: false; error: string };

async function run(fn: () => void | Promise<void>): Promise<SupplierActionResult> {
  try {
    await fn();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

async function requireBusinessId(): Promise<number> {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    throw new Error("Complete your business setup first.");
  }

  return setup.businessId;
}

function validate(
  businessId: number,
  input: SupplierInput,
  excludeId?: number,
): SupplierInput {
  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();

  if (!name) throw new Error("Supplier name is required.");
  if (name.length > 120) throw new Error("Supplier name is too long.");

  if (phone && !/^[0-9+()\-\s]{6,20}$/.test(phone)) {
    throw new Error("Enter a valid phone number.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const duplicate = db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(
      and(
        eq(suppliers.businessId, businessId),
        sql`lower(${suppliers.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(suppliers.id, excludeId) : undefined,
      ),
    )
    .get();

  if (duplicate) throw new Error("A supplier with this name already exists.");

  return { ...input, name };
}

export async function createSupplierAction(
  input: SupplierInput,
): Promise<SupplierActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();

    createSupplier(businessId, { ...validate(businessId, input), active: true });

    revalidatePath("/suppliers");
  });
}

export async function updateSupplierAction(
  supplierId: number,
  input: SupplierInput,
): Promise<SupplierActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();

    const updated = updateSupplier(
      businessId,
      supplierId,
      validate(businessId, input, supplierId),
    );

    if (!updated) throw new Error("Supplier not found.");

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${supplierId}`);
    revalidatePath("/stock-purchases");
  });
}