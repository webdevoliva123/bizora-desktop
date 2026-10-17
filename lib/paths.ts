import "server-only";

import path from "node:path";

/**
 * Root folder for ALL user data (database + uploaded files).
 *
 * - Packaged Electron app: Electron's main process sets BIZORA_USER_DATA_DIR
 *   to app.getPath("userData") (a writable, per-user folder that survives
 *   app updates).
 * - `npm run dev`: falls back to the project folder, like before.
 */
export function getDataRoot() {
  return process.env.BIZORA_USER_DATA_DIR
    ? path.resolve(process.env.BIZORA_USER_DATA_DIR)
    : /* turbopackIgnore: true */ process.cwd();
}

export function getDatabasePath() {
  return path.join(getDataRoot(), "data", "bizora.db");
}

export function getBusinessFilesRoot() {
  return path.join(getDataRoot(), "business-files");
}

/** Folder containing the drizzle *.sql migrations + meta/_journal.json */
export function getMigrationsDir() {
  return process.env.BIZORA_MIGRATIONS_DIR
    ? path.resolve(process.env.BIZORA_MIGRATIONS_DIR)
    : path.join(/* turbopackIgnore: true */ process.cwd(), "drizzle");
}
