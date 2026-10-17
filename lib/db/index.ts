import "server-only";

import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { getDatabasePath, getMigrationsDir } from "@/lib/paths";

import * as schema from "./schema";

type BizoraDb = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { __bizoraDb?: BizoraDb };

/**
 * Opens the database (creating the file + folder if missing) and applies
 * every pending migration. Safe to call many times: it only runs once.
 */
export function getDb(): BizoraDb {
  if (globalForDb.__bizoraDb) {
    return globalForDb.__bizoraDb;
  }

  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const instance = drizzle(sqlite, { schema });

  // Creates all tables on first launch, upgrades them on later versions.
  migrate(instance, { migrationsFolder: getMigrationsDir() });

  globalForDb.__bizoraDb = instance;
  return instance;
}

/**
 * Same API as before (`db.select()...`), but the connection is only opened
 * on first use, so `next build` never touches a database.
 */
export const db = new Proxy({} as BizoraDb, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
