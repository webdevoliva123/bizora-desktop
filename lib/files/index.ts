import "server-only";

import fs from "node:fs";
import path from "node:path";

const BUSINESS_FILES_DIR = path.join(process.cwd(), "business-files");

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