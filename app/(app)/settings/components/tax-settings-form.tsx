"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaxRegistrationRow } from "@/lib/types/settings";

import { updateTaxAction } from "../actions";
import { SettingsFormFooter } from "./settings-form-footer";

type Row = { key: string; taxSystem: string; registrationNumber: string };

const newRow = (taxSystem = ""): Row => ({
  key: crypto.randomUUID(),
  taxSystem,
  registrationNumber: "",
});

export function TaxSettingsForm({ registrations }: { registrations: TaxRegistrationRow[] }) {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>(() =>
    registrations.map((item) => ({
      key: crypto.randomUUID(),
      taxSystem: item.taxSystem,
      registrationNumber: item.registrationNumber ?? "",
    })),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, patch: Partial<Row>) {
    setSaved(false);
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const result = await updateTaxAction(
      rows.map(({ taxSystem, registrationNumber }) => ({ taxSystem, registrationNumber })),
    );

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle>Tax information</CardTitle>
              <CardDescription>
                Tax registrations are printed in the footer of your bills, statements and
                reports.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSaved(false);
                setRows((current) => [...current, newRow(current[0]?.taxSystem ?? "")]);
              }}
            >
              <Plus />
              Add registration
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm font-medium">No tax registrations</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Skip this if your business is not registered for tax.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row, index) => (
                <div key={row.key} className="rounded-lg border p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium">Registration {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Remove registration ${index + 1}`}
                      onClick={() => {
                        setSaved(false);
                        setRows((current) => current.filter((item) => item.key !== row.key));
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`system-${row.key}`}>Tax system</Label>
                      <Input
                        id={`system-${row.key}`}
                        value={row.taxSystem}
                        onChange={(event) => update(row.key, { taxSystem: event.target.value })}
                        placeholder="e.g. GST, VAT, Sales Tax"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`number-${row.key}`}>Registration number</Label>
                      <Input
                        id={`number-${row.key}`}
                        value={row.registrationNumber}
                        onChange={(event) =>
                          update(row.key, { registrationNumber: event.target.value })
                        }
                        placeholder="e.g. 27ABCDE1234F1Z5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SettingsFormFooter saving={saving} saved={saved} error={error} />
        </CardContent>
      </Card>
    </form>
  );
}