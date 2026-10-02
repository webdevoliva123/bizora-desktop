"use server";

import {
  saveSetupTempFile,
} from "@/lib/files/setup-temp";

import { saveSetup } from "@/lib/db/setup";

export async function uploadSetupTempFile(
  file: File,
  type: "logo" | "payment",
) {
  if (!file || file.size === 0) {
    throw new Error("No file was provided.");
  }

  return saveSetupTempFile(file, type);
}

export async function completeSetup(
  input: Parameters<typeof saveSetup>[0],
) {
  return saveSetup(input);
}