import "server-only";

import fs from "node:fs";
import path from "node:path";

const BUSINESS_FILES_DIR = path.join(
  process.cwd(),
  "business-files",
);

const SETUP_TEMP_DIR = path.join(
  BUSINESS_FILES_DIR,
  ".setup-temp",
);

export function getSetupTempDir() {
  return SETUP_TEMP_DIR;
}

export function ensureSetupTempDir() {
  const directories = [
    SETUP_TEMP_DIR,
    path.join(SETUP_TEMP_DIR, "logo"),
    path.join(SETUP_TEMP_DIR, "payment"),
  ];

  for (const directory of directories) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
}

export async function saveSetupTempFile(
  file: File,
  type: "logo" | "payment",
) {
  ensureSetupTempDir();

  const extension = getFileExtension(file.name);

  const safeExtension = extension
    ? `.${extension}`
    : "";

  const fileName = `${crypto.randomUUID()}${safeExtension}`;

  const relativePath = path.join(
    ".setup-temp",
    type,
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

  fs.writeFileSync(
    absolutePath,
    buffer,
  );

  return relativePath.replaceAll(
    path.sep,
    "/",
  );
}

export function deleteSetupTempDir() {
  if (!fs.existsSync(SETUP_TEMP_DIR)) {
    return;
  }

  fs.rmSync(SETUP_TEMP_DIR, {
    recursive: true,
    force: true,
  });
}

function getFileExtension(fileName: string) {
  const extension = path.extname(fileName);

  return extension
    .replace(".", "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}