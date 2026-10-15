import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SettingsFormFooter({
  saving,
  saved,
  error,
  label = "Save changes",
}: {
  saving: boolean;
  saved: boolean;
  error: string | null;
  label?: string;
}) {
  return (
    <div className="space-y-3 border-t pt-6">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && !saving && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="size-4" />
            Saved
          </span>
        )}

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {saving ? "Saving..." : label}
        </Button>
      </div>
    </div>
  );
}