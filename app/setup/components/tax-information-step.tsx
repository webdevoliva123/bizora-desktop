"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useSetupState } from "./setup-state";

export function TaxInformationStep() {
  const { setupData, updateSetupData } = useSetupState();

  const addRegistration = () => {
    updateSetupData("taxRegistrations", [
      ...setupData.taxRegistrations,
      {
        id: crypto.randomUUID(),
        taxSystem: setupData.taxSystem,
        registrationType: "",
        registrationNumber: "",
      },
    ]);
  };

  const removeRegistration = (id: string) => {
    updateSetupData(
      "taxRegistrations",
      setupData.taxRegistrations.filter(
        (registration) => registration.id !== id,
      ),
    );
  };

  const updateRegistration = (
    id: string,
    field:
      | "taxSystem"
      | "registrationType"
      | "registrationNumber",
    value: string,
  ) => {
    updateSetupData(
      "taxRegistrations",
      setupData.taxRegistrations.map((registration) =>
        registration.id === id
          ? {
              ...registration,
              [field]: value,
            }
          : registration,
      ),
    );
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tax Information
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Configure the tax system and registrations applicable to
          your business.
        </p>
      </div>

      <div className="space-y-6">
        {/* Tax System */}
        <div className="space-y-2">
          <Label htmlFor="tax-system">
            Tax System
          </Label>

          <Input
            id="tax-system"
            value={setupData.taxSystem}
            onChange={(event) =>
              updateSetupData(
                "taxSystem",
                event.target.value,
              )
            }
            placeholder="e.g. GST, VAT, Sales Tax"
          />

          <p className="text-xs text-muted-foreground">
            Enter the tax system used by your business. Leave this
            empty if your business is not registered for tax.
          </p>
        </div>

        {/* Registrations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Tax Registrations</Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Add any tax registration numbers associated with
                your business.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRegistration}
            >
              <Plus className="size-4" />
              Add Registration
            </Button>
          </div>

          {setupData.taxRegistrations.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No tax registrations added.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                You can skip this if your business does not have a
                tax registration.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {setupData.taxRegistrations.map(
              (registration, index) => (
                <div
                  key={registration.id}
                  className="rounded-lg border p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Registration {index + 1}
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        removeRegistration(
                          registration.id,
                        )
                      }
                      aria-label={`Remove registration ${
                        index + 1
                      }`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Registration Type */}
                    <div className="space-y-2">
                      <Label
                        htmlFor={`registration-type-${registration.id}`}
                      >
                        Registration Type
                      </Label>

                      <Input
                        id={`registration-type-${registration.id}`}
                        value={registration.registrationType}
                        onChange={(event) =>
                          updateRegistration(
                            registration.id,
                            "registrationType",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. GST Registration"
                      />
                    </div>

                    {/* Registration Number */}
                    <div className="space-y-2">
                      <Label
                        htmlFor={`registration-number-${registration.id}`}
                      >
                        Registration Number
                      </Label>

                      <Input
                        id={`registration-number-${registration.id}`}
                        value={
                          registration.registrationNumber
                        }
                        onChange={(event) =>
                          updateRegistration(
                            registration.id,
                            "registrationNumber",
                            event.target.value,
                          )
                        }
                        placeholder="Registration number"
                      />
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}