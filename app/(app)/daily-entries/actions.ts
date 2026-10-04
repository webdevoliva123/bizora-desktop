"use server";

import { revalidatePath } from "next/cache";

import { getSetupStatus } from "@/lib/db/business";
import {
  createDailyEntry,
  type CreateDailyEntryInput,
} from "@/lib/db/daily-entry-create";

export interface CreateDailyEntryActionInput {
  customerId: number | null;

  paymentStatus:
    | "UNPAID"
    | "PARTIAL"
    | "PAID";

  paymentAmount: number;

  paymentMethod:
    | "CASH"
    | "BANK_TRANSFER"
    | "CARD"
    | "OTHER"
    | null;

  paymentDate: string | null;

  paymentReference: string | null;

  notes: string | null;

  items: {
    productId: number | null;
    quantity: number;
  }[];
}

export async function createDailyEntryAction(
  input: CreateDailyEntryActionInput,
) {
  const setupStatus = await getSetupStatus();

  if (!setupStatus.completed || !setupStatus.businessId) {
    return {
      success: false,
      error: "Business setup is not complete.",
    };
  }

  if (!input.customerId) {
    return {
      success: false,
      error: "Please select a customer.",
    };
  }

  if (!input.items.length) {
    return {
      success: false,
      error: "At least one product is required.",
    };
  }

  const validItems = input.items.every(
    (item) =>
      item.productId !== null &&
      Number.isFinite(item.quantity) &&
      item.quantity > 0,
  );

  if (!validItems) {
    return {
      success: false,
      error:
        "Please select a product and enter a valid quantity.",
    };
  }

  try {
    const payload: CreateDailyEntryInput = {
      businessId: setupStatus.businessId,
      customerId: input.customerId,

      paymentStatus: input.paymentStatus,
      paymentAmount: input.paymentAmount,
      paymentMethod: input.paymentMethod,
      paymentDate: input.paymentDate,
      paymentReference: input.paymentReference,

      notes: input.notes,

      items: input.items.map((item) => ({
        productId: item.productId as number,
        quantity: item.quantity,
      })),
    };

    const result = createDailyEntry(payload);

    revalidatePath("/daily-entries");
    revalidatePath("/dashboard");

    return {
      success: true,
      id: result.id,
    };
  } catch (error) {
    console.error(
      "Failed to create daily entry:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create daily entry.",
    };
  }
}