import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

import { getBusinessFilesRoot } from "@/lib/paths";

const BUSINESS_FILES_DIR = getBusinessFilesRoot();

const ALLOWED_PREFIX = ".setup-temp/";

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(request: NextRequest) {
  const relativePath =
    request.nextUrl.searchParams.get("path");

  if (!relativePath) {
    return new NextResponse(
      "File path is required.",
      { status: 400 },
    );
  }

  const normalizedPath = relativePath
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");

  /*
   * Only allow files inside .setup-temp.
   */
  if (!normalizedPath.startsWith(ALLOWED_PREFIX)) {
    return new NextResponse(
      "Invalid file path.",
      { status: 403 },
    );
  }

  /*
   * Prevent directory traversal.
   */
  const absolutePath = path.resolve(
    BUSINESS_FILES_DIR,
    normalizedPath,
  );

  const setupTempDirectory = path.resolve(
    BUSINESS_FILES_DIR,
    ".setup-temp",
  );

  if (
    absolutePath !== setupTempDirectory &&
    !absolutePath.startsWith(
      `${setupTempDirectory}${path.sep}`,
    )
  ) {
    return new NextResponse(
      "Invalid file path.",
      { status: 403 },
    );
  }

  if (!fs.existsSync(absolutePath)) {
    return new NextResponse(
      "File not found.",
      { status: 404 },
    );
  }

  const extension = path
    .extname(absolutePath)
    .replace(".", "")
    .toLowerCase();

  const contentType =
    MIME_TYPES[extension] ??
    "application/octet-stream";

  const file = fs.readFileSync(absolutePath);

  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}