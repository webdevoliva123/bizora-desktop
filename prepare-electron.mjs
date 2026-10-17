
import {
  cpSync,
  existsSync,
  lstatSync,
  readFileSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

// Runs after `next build`, before electron-builder.
// 1. Completes the Next.js standalone folder.
// 2. Copies better-sqlite3 and its runtime dependencies.
// 3. Verifies that Electron can load better-sqlite3.

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
const rootModules = path.join(root, "node_modules");
const standaloneModules = path.join(standalone, "node_modules");
const isWin = process.platform === "win32";

function fail(message) {
  console.error(`\n[prepare-electron] ${message}\n`);
  process.exit(1);
}

function copyDirectory(source, destination) {
  if (!existsSync(source)) {
    fail(`Required directory not found: ${source}`);
  }

  cpSync(source, destination, { recursive: true });
}

if (!existsSync(path.join(standalone, "server.js"))) {
  fail("Missing .next/standalone/server.js. Run `npm run build` first.");
}

// 1. Copy static assets and public files.
copyDirectory(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static"),
);

const publicDir = path.join(root, "public");

if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(standalone, "public"), {
    recursive: true,
  });
}

// 2. Copy better-sqlite3 and its runtime dependencies.
// Use real directories instead of relying on Next.js traced symlinks.
function copyPackage(name, seen = new Set()) {
  if (seen.has(name)) return;
  seen.add(name);

  const source = path.join(rootModules, name);

  if (!existsSync(source)) {
    fail(`Dependency "${name}" is missing from node_modules.`);
  }

  const destination = path.join(standaloneModules, name);

  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, { recursive: true });

  const manifestPath = path.join(source, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    if (dependency !== "prebuild-install") {
      copyPackage(dependency, seen);
    }
  }
}

if (!existsSync(path.join(rootModules, "better-sqlite3"))) {
  fail('better-sqlite3 is not installed. Run `npm install` first.');
}

copyPackage("better-sqlite3");

// Ensure Next.js's traced symlink cannot break electron-builder's file scan.
const tracedModules = path.join(standalone, ".next", "node_modules");

if (existsSync(tracedModules)) {
  for (const entry of [
    "better-sqlite3-90e2652d1716b047",
  ]) {
    const tracedPath = path.join(tracedModules, entry);

    try {
      const stats = lstatSync(tracedPath);

      if (stats.isSymbolicLink()) {
        unlinkSync(tracedPath);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

// Copy prebuilt binaries from the installed package.
// This preserves the binaries already supplied by better-sqlite3.
const sourcePrebuilds = path.join(
  rootModules,
  "better-sqlite3",
  "prebuilds",
);
const targetPrebuilds = path.join(
  standaloneModules,
  "better-sqlite3",
  "prebuilds",
);

copyDirectory(sourcePrebuilds, targetPrebuilds);

const electronVersion = JSON.parse(
  readFileSync(
    path.join(rootModules, "electron", "package.json"),
    "utf8",
  ),
).version;

const targetPlatform = process.env.npm_config_platform || process.platform;
const targetArch = process.env.npm_config_arch || process.arch;

console.log(
  `[prepare-electron] Electron ${electronVersion}; ` +
    `build host ${process.platform}-${process.arch}; ` +
    `requested target ${targetPlatform}-${targetArch}`,
);

const moduleDir = path.join(standaloneModules, "better-sqlite3");

// Only rebuild locally for the host platform.
// Cross-platform native compilation requires an appropriate toolchain.
if (targetPlatform === process.platform && targetArch === process.arch) {
  console.log("[prepare-electron] Rebuilding better-sqlite3 for Electron...");

  const rebuild = spawnSync(
    isWin ? "npx.cmd" : "npx",
    [
      "@electron/rebuild",
      "-f",
      "-w",
      "better-sqlite3",
      "-v",
      electronVersion,
      "-m",
      standalone,
    ],
    {
      cwd: root,
      stdio: "inherit",
      shell: isWin,
    },
  );

  if (rebuild.status !== 0) {
    fail("Electron native-module rebuild failed.");
  }
} else {
  console.log(
    "[prepare-electron] Skipping host rebuild for a cross-platform target.",
  );
}

// 3. Smoke-test only when the requested target matches this machine.
// Electron cannot run a Windows native module on macOS.
if (targetPlatform === process.platform && targetArch === process.arch) {
  const electronBinary = createRequire(import.meta.url)("electron");

  const test = spawnSync(
    electronBinary,
    [
      "-e",
      "const Database = require(process.argv[1]); " +
        "new Database(':memory:').close(); " +
        "console.log('better-sqlite3 loads in Electron: OK');",
      moduleDir,
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
      },
    },
  );

  if (test.status !== 0) {
    fail(
      "Electron could not load better-sqlite3. " +
        "Packaging stopped to avoid producing a broken application.",
    );
  }
} else {
  console.log(
    "[prepare-electron] Cross-platform native-module smoke test skipped.",
  );
}

console.log("[prepare-electron] Standalone server is ready for packaging.");
