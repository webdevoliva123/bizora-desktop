"use server";

import { revalidatePath } from "next/cache";

import { getSetupStatus } from "@/lib/db/business";
import {
  parseBusinessInput,
  replaceRegulatoryRegistrations,
  replaceTaxRegistrations,
  savePaymentDetails,
  setBusinessLogoPath,
  setPaymentQrPath,
  updateBusiness,
  type BusinessInput,
  type PaymentInput,
  type RegulatoryRowInput,
  type TaxRowInput,
} from "@/lib/db/settings";
import { removeBusinessFile, saveBusinessImage } from "@/lib/files/business-files";
import type { ActionResult, PathResult } from "@/lib/types/settings";

async function requireBusinessId(): Promise<number> {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    throw new Error("Complete your business setup first.");
  }

  return setup.businessId;
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

async function run(fn: () => void | Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    return { success: true };
  } catch (error) {
    return { success: false, error: messageOf(error) };
  }
}

async function runPath(fn: () => Promise<string | null>): Promise<PathResult> {
  try {
    return { success: true, path: await fn() };
  } catch (error) {
    return { success: false, error: messageOf(error) };
  }
}

/** The business name and logo appear in the app shell, so refresh every page. */
function refresh() {
  revalidatePath("/", "layout");
}

function fileFrom(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) throw new Error("No file was provided.");

  return file;
}

/* -------------------------------------------------------------------------- */
/* Business                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateBusinessAction(input: BusinessInput) {
  return run(async () => {
    const businessId = await requireBusinessId();

    updateBusiness(businessId, parseBusinessInput(input));
    refresh();
  });
}

export async function uploadLogoAction(formData: FormData) {
  return runPath(async () => {
    const businessId = await requireBusinessId();
    const path = await saveBusinessImage(fileFrom(formData));

    let previous: string | null;

    try {
      previous = setBusinessLogoPath(businessId, path);
    } catch (error) {
      removeBusinessFile(path);
      throw error;
    }

    removeBusinessFile(previous);
    refresh();

    return path;
  });
}

export async function removeLogoAction() {
  return runPath(async () => {
    const businessId = await requireBusinessId();

    removeBusinessFile(setBusinessLogoPath(businessId, null));
    refresh();

    return null;
  });
}

/* -------------------------------------------------------------------------- */
/* Tax + regulatory                                                           */
/* -------------------------------------------------------------------------- */

export async function updateTaxAction(rows: TaxRowInput[]) {
  return run(async () => {
    const businessId = await requireBusinessId();

    replaceTaxRegistrations(businessId, rows);
    refresh();
  });
}

export async function updateRegulatoryAction(rows: RegulatoryRowInput[]) {
  return run(async () => {
    const businessId = await requireBusinessId();

    replaceRegulatoryRegistrations(businessId, rows);
    refresh();
  });
}

/* -------------------------------------------------------------------------- */
/* Payment details                                                            */
/* -------------------------------------------------------------------------- */

export async function updatePaymentAction(input: PaymentInput) {
  return run(async () => {
    const businessId = await requireBusinessId();

    savePaymentDetails(businessId, input);
    refresh();
  });
}

export async function uploadQrAction(formData: FormData) {
  return runPath(async () => {
    const businessId = await requireBusinessId();
    const path = await saveBusinessImage(fileFrom(formData));

    let previous: string | null;

    try {
      previous = setPaymentQrPath(businessId, path);
    } catch (error) {
      removeBusinessFile(path);
      throw error;
    }

    removeBusinessFile(previous);
    refresh();

    return path;
  });
}

export async function removeQrAction() {
  return runPath(async () => {
    const businessId = await requireBusinessId();

    removeBusinessFile(setPaymentQrPath(businessId, null));
    refresh();

    return null;
  });
}