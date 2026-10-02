export function getFileUrl(
    filePath: string | null | undefined,
  ): string | null {
    if (!filePath) {
      return null;
    }
  
    return `/api/files/${filePath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }