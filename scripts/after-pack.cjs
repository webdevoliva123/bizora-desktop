// electron-builder never copies folders named "node_modules" from
// extraResources, so we put them into the packaged app ourselves.
const fs = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(context) {
  const resources =
    context.electronPlatformName === "darwin"
      ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, "Contents", "Resources")
      : path.join(context.appOutDir, "resources");

  const standalone = path.join(context.packager.projectDir, ".next", "standalone");
  const appDir = path.join(resources, "app");

  // 1. app/node_modules  (next, react, better-sqlite3, ...)
  const modulesSrc = path.join(standalone, "node_modules");
  const modulesDest = path.join(appDir, "node_modules");
  fs.rmSync(modulesDest, { recursive: true, force: true });
  fs.cpSync(modulesSrc, modulesDest, { recursive: true, dereference: true });

  // 2. app/.next/node_modules  (Next's hashed aliases, e.g. better-sqlite3-<hash>)
  const aliasSrc = path.join(standalone, ".next", "node_modules");
  const aliasDest = path.join(appDir, ".next", "node_modules");
  fs.rmSync(aliasDest, { recursive: true, force: true });
  if (fs.existsSync(aliasSrc)) {
    fs.mkdirSync(aliasDest, { recursive: true });
    for (const entry of fs.readdirSync(aliasSrc)) {
      const packageName = entry.replace(/-[0-9a-f]{16}$/, "");
      const fromRoot = path.join(modulesDest, packageName);
      const target = path.join(aliasDest, entry);
      if (fs.existsSync(fromRoot)) {
        fs.cpSync(fromRoot, target, { recursive: true, dereference: true });
      } else {
        fs.cpSync(path.join(aliasSrc, entry), target, { recursive: true, dereference: true });
      }
    }
  }

  // 3. drop SQLite binaries of other platforms
  const keep = `${context.electronPlatformName === "darwin" ? "darwin" : context.electronPlatformName === "win32" ? "win32" : "linux"}-`;
  const prebuildDirs = [path.join(modulesDest, "better-sqlite3", "prebuilds")];
  if (fs.existsSync(aliasDest)) {
    for (const entry of fs.readdirSync(aliasDest)) {
      if (entry.startsWith("better-sqlite3")) prebuildDirs.push(path.join(aliasDest, entry, "prebuilds"));
    }
  }
  for (const dir of prebuildDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.startsWith(keep) || file.startsWith("linuxmusl")) fs.rmSync(path.join(dir, file), { force: true });
    }
  }

  if (!fs.existsSync(path.join(modulesDest, "next", "package.json"))) {
    throw new Error("after-pack: 'next' is missing from the packaged app.");
  }
  console.log("  • after-pack: node_modules copied into the app");
};
