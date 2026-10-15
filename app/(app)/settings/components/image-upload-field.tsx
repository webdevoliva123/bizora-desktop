"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getFileUrl } from "@/lib/files/urls";
import type { PathResult } from "@/lib/types/settings";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export function ImageUploadField({
  path,
  alt,
  uploadLabel,
  onUpload,
  onRemove,
}: {
  path: string | null;
  alt: string;
  uploadLabel: string;
  onUpload: (formData: FormData) => Promise<PathResult>;
  onRemove: () => Promise<PathResult>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [current, setCurrent] = useState(path);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError("Upload a PNG, JPG or WebP image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    setError(null);
    setBusy("upload");

    const formData = new FormData();
    formData.set("file", file);

    const result = await onUpload(formData);

    setBusy(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setCurrent(result.path);
    router.refresh();
  }

  async function handleRemove() {
    setError(null);
    setBusy("remove");

    const result = await onRemove();

    setBusy(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setCurrent(null);
    router.refresh();
  }

  const url = current ? getFileUrl(current) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {url ? (
            <img src={url} alt={alt} className="size-full object-contain" />
          ) : (
            <ImageIcon className="size-8 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => inputRef.current?.click()}
            >
              {busy === "upload" ? <Loader2 className="animate-spin" /> : <Upload />}
              {busy === "upload" ? "Uploading..." : current ? "Replace" : uploadLabel}
            </Button>

            {current && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={busy !== null}
                onClick={() => void handleRemove()}
              >
                {busy === "remove" ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Remove
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            PNG, JPG or WebP, up to 5 MB. Saved as soon as you choose a file.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={handleChange}
      />

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}