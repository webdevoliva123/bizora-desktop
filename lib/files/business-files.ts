import "server-only";

import fs from "node:fs";
import path from "node:path";

import { getBusinessFilesDir } from "@/lib/files";

const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

/** Saves an uploaded image into business-files/business and returns its relative path. */
export async function saveBusinessImage(file: File): Promise<string> {
  const extension = EXTENSIONS[file.type];

  if (!extension) throw new Error("Upload a PNG, JPG or WebP image.");
  if (file.size === 0) throw new Error("The selected file is empty.");
  if (file.size > MAX_BYTES) throw new Error("The image must be 5 MB or smaller.");

  const directory = path.join(getBusinessFilesDir(), "business");
  fs.mkdirSync(directory, { recursive: true });

  const fileName = `${crypto.randomUUID()}${extension}`;

  fs.writeFileSync(
    path.join(directory, fileName),
    Buffer.from(await file.arrayBuffer()),
  );

  return `business/${fileName}`;
}

/** Deletes a saved file. Only paths inside business-files/business are ever touched. */
export function removeBusinessFile(relativePath: string | null | undefined) {
  if (!relativePath) return;

  const normalized = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");

  if (!normalized.startsWith("business/")) return;

  const root = path.resolve(getBusinessFilesDir(), "business");
  const absolute = path.resolve(getBusinessFilesDir(), normalized);

  if (!absolute.startsWith(`${root}${path.sep}`)) return;

  try {
    fs.rmSync(absolute, { force: true });
  } catch (error) {
    console.error("[settings] Failed to remove file:", error);
  }
}