import "server-only";

import fs from "node:fs";
import path from "node:path";

import { getBusinessFilesRoot } from "@/lib/paths";

const BUSINESS_FILES_DIR = getBusinessFilesRoot();

export function getBusinessFilesDir() {
  return BUSINESS_FILES_DIR;
}

export function ensureBusinessFilesDir() {
  const directories = [
    BUSINESS_FILES_DIR,
    path.join(BUSINESS_FILES_DIR, "business"),
    path.join(BUSINESS_FILES_DIR, "customers"),
    path.join(BUSINESS_FILES_DIR, "products"),
    path.join(BUSINESS_FILES_DIR, "documents"),
    path.join(BUSINESS_FILES_DIR, "invoices"),
    path.join(BUSINESS_FILES_DIR, "backups"),
  ];

  for (const directory of directories) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
}

/**
 * Save a browser File into Bizora's local business-files directory.
 *
 * Returns the relative path that should be stored in SQLite.
 *
 * Example:
 * business/logo-1727900000000.png
 */
export async function saveBusinessFile(
  file: File,
  folder: "business" | "customers" | "products" | "documents" | "invoices",
) {
  ensureBusinessFilesDir();

  const extension = getFileExtension(file.name);

  const safeExtension = extension
    ? `.${extension}`
    : "";

  const fileName = `${crypto.randomUUID()}${safeExtension}`;

  const relativePath = path.join(
    folder,
    fileName,
  );

  const absolutePath = path.join(
    BUSINESS_FILES_DIR,
    relativePath,
  );

  const directory = path.dirname(absolutePath);

  fs.mkdirSync(directory, {
    recursive: true,
  });

  const buffer = Buffer.from(
    await file.arrayBuffer(),
  );

  fs.writeFileSync(absolutePath, buffer);

  return relativePath.replaceAll(path.sep, "/");
}

function getFileExtension(fileName: string) {
  const extension = path.extname(fileName);

  return extension
    .replace(".", "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}