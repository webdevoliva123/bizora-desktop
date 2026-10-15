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
import type { RegulatoryRow } from "@/lib/types/settings";

import { updateRegulatoryAction } from "../actions";
import { SettingsFormFooter } from "./settings-form-footer";

type Row = {
  key: string;
  authorityName: string;
  registrationType: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
};

const newRow = (): Row => ({
  key: crypto.randomUUID(),
  authorityName: "",
  registrationType: "",
  registrationNumber: "",
  issueDate: "",
  expiryDate: "",
});

export function RegulatorySettingsForm({
  registrations,
}: {
  registrations: RegulatoryRow[];
}) {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>(() =>
    registrations.map((item) => ({
      key: crypto.randomUUID(),
      authorityName: item.authorityName,
      registrationType: item.registrationType,
      registrationNumber: item.registrationNumber ?? "",
      issueDate: item.issueDate?.slice(0, 10) ?? "",
      expiryDate: item.expiryDate?.slice(0, 10) ?? "",
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

    const result = await updateRegulatoryAction(
      rows.map(({ key: _key, ...row }) => row),
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
              <CardTitle>Regulatory & food safety</CardTitle>
              <CardDescription>
                Licences and registrations issued by government, food-safety or other
                authorities. Their numbers are printed in the footer of your documents.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSaved(false);
                setRows((current) => [...current, newRow()]);
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
              <p className="text-sm font-medium">No registrations added</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Skip this if your business has no applicable registrations.
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

                  <div className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`authority-${row.key}`}>Authority</Label>
                        <Input
                          id={`authority-${row.key}`}
                          value={row.authorityName}
                          onChange={(event) =>
                            update(row.key, { authorityName: event.target.value })
                          }
                          placeholder="e.g. Food Safety Authority"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`type-${row.key}`}>Registration type</Label>
                        <Input
                          id={`type-${row.key}`}
                          value={row.registrationType}
                          onChange={(event) =>
                            update(row.key, { registrationType: event.target.value })
                          }
                          placeholder="e.g. Food Business License"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`number-${row.key}`}>Registration number</Label>
                      <Input
                        id={`number-${row.key}`}
                        value={row.registrationNumber}
                        onChange={(event) =>
                          update(row.key, { registrationNumber: event.target.value })
                        }
                        placeholder="Registration number"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`issue-${row.key}`}>Issue date</Label>
                        <Input
                          id={`issue-${row.key}`}
                          type="date"
                          value={row.issueDate}
                          onChange={(event) => update(row.key, { issueDate: event.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`expiry-${row.key}`}>Expiry date</Label>
                        <Input
                          id={`expiry-${row.key}`}
                          type="date"
                          value={row.expiryDate}
                          onChange={(event) =>
                            update(row.key, { expiryDate: event.target.value })
                          }
                        />
                      </div>
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