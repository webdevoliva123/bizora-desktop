"use server";

import { revalidatePath } from "next/cache";

import { getSetupStatus } from "@/lib/db/business";
import { deleteWorkerPayment } from "@/lib/db/worker-payments";
import { setWorkerActive } from "@/lib/db/workers";

export type WorkerActionResult =
  | { success: true }
  | { success: false; error: string };

async function run(fn: (businessId: number) => void): Promise<WorkerActionResult> {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      throw new Error("Complete your business setup first.");
    }

    fn(setup.businessId);
    revalidatePath("/workers");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

/** Activate or deactivate a worker. Workers are never hard-deleted. */
export async function setWorkerActiveAction(
  workerId: number,
  active: boolean,
): Promise<WorkerActionResult> {
  return run((businessId) => {
    if (!setWorkerActive(businessId, workerId, active)) {
      throw new Error("Worker not found.");
    }
  });
}

export async function deleteWorkerPaymentAction(
  workerId: number,
  paymentId: number,
): Promise<WorkerActionResult> {
  return run((businessId) => {
    if (!deleteWorkerPayment(businessId, workerId, paymentId)) {
      throw new Error("Payment not found.");
    }
  });
}