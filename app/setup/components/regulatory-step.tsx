"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useSetupState } from "./setup-state";

export function RegulatoryStep() {
  const { setupData, updateSetupData } = useSetupState();

  const addRegistration = () => {
    updateSetupData("businessRegistrations", [
      ...setupData.businessRegistrations,
      {
        id: crypto.randomUUID(),
        authorityName: "",
        registrationType: "",
        registrationNumber: "",
        issueDate: "",
        expiryDate: "",
      },
    ]);
  };

  const removeRegistration = (id: string) => {
    updateSetupData(
      "businessRegistrations",
      setupData.businessRegistrations.filter(
        (registration) => registration.id !== id,
      ),
    );
  };

  const updateRegistration = (
    id: string,
    field:
      | "authorityName"
      | "registrationType"
      | "registrationNumber"
      | "issueDate"
      | "expiryDate",
    value: string,
  ) => {
    updateSetupData(
      "businessRegistrations",
      setupData.businessRegistrations.map((registration) =>
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
          Regulatory & Food Safety
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Add business registrations, food-safety information, or
          other regulatory details applicable to your business.
        </p>
      </div>

      <div className="space-y-6">
        {/* Business Registrations */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Business Registrations</Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Add registrations issued by government, food-safety,
                licensing, or other regulatory authorities.
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

          {/* Empty State */}
          {setupData.businessRegistrations.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No registrations added.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                You can skip this step if your business does not
                have any applicable registrations.
              </p>
            </div>
          )}

          {/* Registration List */}
          <div className="space-y-4">
            {setupData.businessRegistrations.map(
              (registration, index) => (
                <div
                  key={registration.id}
                  className="rounded-lg border p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Registration {index + 1}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Regulatory registration details
                      </p>
                    </div>

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

                  <div className="space-y-5">
                    {/* Authority + Type */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`authority-${registration.id}`}
                        >
                          Authority
                        </Label>

                        <Input
                          id={`authority-${registration.id}`}
                          value={registration.authorityName}
                          onChange={(event) =>
                            updateRegistration(
                              registration.id,
                              "authorityName",
                              event.target.value,
                            )
                          }
                          placeholder="e.g. Food Safety Authority"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`registration-type-${registration.id}`}
                        >
                          Registration Type
                        </Label>

                        <Input
                          id={`registration-type-${registration.id}`}
                          value={
                            registration.registrationType
                          }
                          onChange={(event) =>
                            updateRegistration(
                              registration.id,
                              "registrationType",
                              event.target.value,
                            )
                          }
                          placeholder="e.g. Food Business License"
                        />
                      </div>
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

                    {/* Dates */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`issue-date-${registration.id}`}
                        >
                          Issue Date
                        </Label>

                        <Input
                          id={`issue-date-${registration.id}`}
                          type="date"
                          value={registration.issueDate}
                          onChange={(event) =>
                            updateRegistration(
                              registration.id,
                              "issueDate",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`expiry-date-${registration.id}`}
                        >
                          Expiry Date
                        </Label>

                        <Input
                          id={`expiry-date-${registration.id}`}
                          type="date"
                          value={registration.expiryDate}
                          onChange={(event) =>
                            updateRegistration(
                              registration.id,
                              "expiryDate",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {/* Additional Notes */}
        <section className="space-y-2 border-t pt-6">
          <Label htmlFor="regulatory-notes">
            Additional Notes
            <span className="ml-1 text-muted-foreground">
              (Optional)
            </span>
          </Label>

          <Textarea
            id="regulatory-notes"
            value={setupData.regulatoryNotes}
            onChange={(event) =>
              updateSetupData(
                "regulatoryNotes",
                event.target.value,
              )
            }
            placeholder="Add any additional regulatory or food-safety notes..."
            rows={4}
          />

          <p className="text-xs text-muted-foreground">
            These notes are stored with your business information
            and can be updated later.
          </p>
        </section>
      </div>
    </div>
  );
}