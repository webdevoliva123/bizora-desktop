import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import { getFilePath } from "@/lib/files/path";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { path: filePathParts } = await params;

    if (!filePathParts?.length) {
      return new NextResponse("File path is required.", {
        status: 400,
      });
    }

    const relativePath = filePathParts.join("/");

    const actualPath = getFilePath(relativePath);

    if (!actualPath) {
      return new NextResponse("Invalid file path.", {
        status: 400,
      });
    }

    if (!fs.existsSync(actualPath)) {
      return new NextResponse("File not found.", {
        status: 404,
      });
    }

    const extension = path.extname(actualPath).toLowerCase();

    const contentType =
      MIME_TYPES[extension] ?? "application/octet-stream";

    const file = fs.readFileSync(actualPath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Failed to serve file:", error);

    return new NextResponse("Failed to load file.", {
      status: 500,
    });
  }
}