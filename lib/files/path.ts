import "server-only";

import path from "node:path";

const BUSINESS_FILES_DIR = path.resolve(
  process.cwd(),
  "business-files",
);

export function getFilePath(
  filePath: string | null | undefined,
): string | null {
  if (!filePath) {
    return null;
  }

  const resolvedPath = path.resolve(
    BUSINESS_FILES_DIR,
    filePath,
  );

  const relativePath = path.relative(
    BUSINESS_FILES_DIR,
    resolvedPath,
  );

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return resolvedPath;
}