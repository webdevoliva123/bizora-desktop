"use server";

import { revalidatePath } from "next/cache";
import {
    addDailyEntryPayment,
    deleteDailyEntry,
    updateDailyEntry,
  } from "@/lib/db/daily-entry-mutations";
import { getSetupStatus } from "@/lib/db/business";
import {
  createDailyEntry,
  type CreateDailyEntryInput,
} from "@/lib/db/daily-entry-create";
import { createQuickSale } from "@/lib/db/quick-sale-create";
import { PAYMENT_METHOD, PAYMENT_STATUS, PAYMENT_TYPE } from "@/common";

export interface CreateDailyEntryActionInput {
    customerId: number | null;
  
    paymentType: PAYMENT_TYPE;
  
    paymentStatus: PAYMENT_STATUS;
  
    paymentAmount: number;
  
    paymentMethod: PAYMENT_METHOD | null;
  
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
        paymentType: input.paymentType,
        paymentStatus: input.paymentStatus,
        paymentAmount: input.paymentAmount,
        paymentMethod: input.paymentMethod as PAYMENT_METHOD || null,
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

  
  type ActionResult = { success: true } | { success: false; error: string };
  
  function revalidateDailyEntries() {
    revalidatePath("/daily-entries");
    revalidatePath("/dashboard");
  }
  
  function failure(error: unknown, fallback: string): ActionResult {
    console.error(fallback, error);
  
    return {
      success: false,
      error: error instanceof Error ? error.message : fallback,
    };
  }
  
  async function getBusinessId(): Promise<number | null> {
    const setupStatus = await getSetupStatus();
  
    return setupStatus.completed && setupStatus.businessId
      ? setupStatus.businessId
      : null;
  }
  
  /* ---------------------------------- Update --------------------------------- */
  
  export interface UpdateDailyEntryActionInput {
    entryId: number;
    customerId: number | null;
    paymentType: PAYMENT_TYPE;
    notes: string | null;
    items: { productId: number | null; quantity: number }[];
  }
  
  export async function updateDailyEntryAction(
    input: UpdateDailyEntryActionInput,
  ): Promise<ActionResult> {
    const businessId = await getBusinessId();
  
    if (!businessId) {
      return { success: false, error: "Business setup is not complete." };
    }
  
    if (!input.customerId) {
      return { success: false, error: "Please select a customer." };
    }
  
    if (
      !input.items.length ||
      !input.items.every(
        (item) =>
          item.productId !== null &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0,
      )
    ) {
      return {
        success: false,
        error: "Please select a product and enter a valid quantity for every row.",
      };
    }
  
    try {
      updateDailyEntry({
        businessId,
        entryId: input.entryId,
        customerId: input.customerId,
        paymentType: input.paymentType,
        notes: input.notes,
        items: input.items.map((item) => ({
          productId: item.productId as number,
          quantity: item.quantity,
        })),
      });
  
      revalidateDailyEntries();
  
      return { success: true };
    } catch (error) {
      return failure(error, "Failed to update the daily entry.");
    }
  }
  
  /* ------------------------------- Add payment ------------------------------- */
  
  export interface AddDailyEntryPaymentActionInput {
    entryId: number;
    amount: number; // paise
    paymentMethod: PAYMENT_METHOD
    paymentDate: string;
    reference: string | null;
    notes: string | null;
  }
  
  export async function addDailyEntryPaymentAction(
    input: AddDailyEntryPaymentActionInput,
  ): Promise<ActionResult> {
    const businessId = await getBusinessId();
  
    if (!businessId) {
      return { success: false, error: "Business setup is not complete." };
    }
  
    try {
      addDailyEntryPayment({ businessId, ...input });
  
      revalidateDailyEntries();
  
      return { success: true };
    } catch (error) {
      return failure(error, "Failed to record the payment.");
    }
  }
  
  /* --------------------------------- Delete ---------------------------------- */
  
  export async function deleteDailyEntryAction(
    entryId: number,
  ): Promise<ActionResult> {
    const businessId = await getBusinessId();
  
    if (!businessId) {
      return { success: false, error: "Business setup is not complete." };
    }
  
    try {
      deleteDailyEntry(businessId, entryId);
  
      revalidateDailyEntries();
  
      return { success: true };
    } catch (error) {
      return failure(error, "Failed to delete the daily entry.");
    }
  }

  export interface CreateQuickSaleActionInput {
    amount: number;
    paymentMethod: PAYMENT_METHOD;
    paymentDate: string;
    paymentReference: string | null;
    notes: string | null;
  }
  
  export async function createQuickSaleAction(
    input: CreateQuickSaleActionInput,
  ): Promise<
    | { success: true; id: number }
    | { success: false; error: string }
  > {
    try {
      const businessId = await getBusinessId();
  
      if (!businessId) {
        return {
          success: false,
          error: "Business setup is incomplete.",
        };
      }
  
      if (!Number.isInteger(input.amount) || input.amount <= 0) {
        return {
          success: false,
          error: "Sale amount must be greater than zero.",
        };
      }
  
      if (!input.paymentDate) {
        return {
          success: false,
          error: "Payment date is required.",
        };
      }
  
      const result = createQuickSale({
        businessId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paymentDate: input.paymentDate,
        paymentReference: input.paymentReference,
        notes: input.notes,
      });
  
      revalidateDailyEntries();
  
      return {
        success: true,
        id: result.id,
      };
    } catch (error) {
      console.error("[daily-entries] Failed to create quick sale:", error);
  
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create quick sale.",
      };
    }
  }