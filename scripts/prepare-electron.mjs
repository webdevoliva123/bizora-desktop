// Runs after `next build`, before electron-builder.
//  1. completes the Next standalone folder (static assets + public)
//  2. puts the full better-sqlite3 package (it ships prebuilt binaries) in it
//  3. smoke-tests that Electron itself can load SQLite
import { cpSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
const sqliteSource = path.join(root, "node_modules", "better-sqlite3");
const sqliteTarget = path.join(standalone, "node_modules", "better-sqlite3");

function fail(message) {
  console.error(`\n[prepare-electron] ${message}\n`);
  process.exit(1);
}

if (!existsSync(path.join(standalone, "server.js"))) {
  fail("Missing .next/standalone/server.js. Run `npm run build` first.");
}
if (!existsSync(path.join(sqliteSource, "package.json"))) {
  fail("better-sqlite3 is not installed. Run `npm install` first.");
}

// 1. static assets + public
cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });
if (existsSync(path.join(root, "public"))) {
  cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
}

// 2. SQLite: real copy (not Next's symlink), prebuilt binaries only
rmSync(sqliteTarget, { recursive: true, force: true });
cpSync(sqliteSource, sqliteTarget, { recursive: true, dereference: true });
// A locally compiled build/ (for plain Node) must never win over the prebuilds.
for (const leftover of ["build", "deps", "src"]) {
  rmSync(path.join(sqliteTarget, leftover), { recursive: true, force: true });
}

const hostBinary = `${process.platform}-${process.arch}.node`;
if (!existsSync(path.join(sqliteTarget, "prebuilds", hostBinary))) {
  fail(`No prebuilt SQLite binary for this machine (${hostBinary}).`);
}
console.log(`[prepare-electron] SQLite prebuild found: ${hostBinary}`);

// 3. smoke test inside Electron's own Node
const electronBinary = createRequire(import.meta.url)("electron");
const test = spawnSync(
  electronBinary,
  [
    "-e",
    "const D=require(process.argv[1]);const db=new D(':memory:');db.exec('create table t(x)');db.close();console.log('[prepare-electron] SQLite loads inside Electron: OK')",
    sqliteTarget,
  ],
  { stdio: "inherit", env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" } },
);
if (test.status !== 0) {
  fail("Electron could not load better-sqlite3. Packaging stopped so you don't ship a broken app.");
}

console.log("[prepare-electron] Standalone server is ready for packaging.");
