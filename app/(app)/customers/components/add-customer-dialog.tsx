"use client";

import { useState } from "react";
import { Building2, Loader2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CUSTOMER_TYPE } from "@/common";



interface FormState {
  type: CUSTOMER_TYPE;

  firstName: string;
  lastName: string;

  businessName: string;
  contactPerson: string;
  taxRegistrationNumber: string;

  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

const INITIAL_FORM: FormState = {
  type: "PERSON",

  firstName: "",
  lastName: "",

  businessName: "",
  contactPerson: "",
  taxRegistrationNumber: "",

  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setError("");
  }

  function handleOpenChange(value: boolean) {
    if (!value && !saving) {
      resetForm();
    }

    setOpen(value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (form.type === "PERSON" && !form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (form.type === "BUSINESS" && !form.businessName.trim()) {
      setError("Business name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: form.type,

          firstName:
            form.type === "PERSON"
              ? form.firstName.trim()
              : null,

          lastName:
            form.type === "PERSON"
              ? form.lastName.trim() || null
              : null,

          businessName:
            form.type === "BUSINESS"
              ? form.businessName.trim()
              : null,

          contactPerson:
            form.type === "BUSINESS"
              ? form.contactPerson.trim() || null
              : null,

          taxRegistrationNumber:
            form.type === "BUSINESS"
              ? form.taxRegistrationNumber.trim() || null
              : null,

          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          postalCode: form.postalCode.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create customer.",
        );
      }

      setOpen(false);
      resetForm();

      window.dispatchEvent(new Event("customers:refresh"));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create customer.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger >
        <Button>Add Customer</Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>

          <DialogDescription>
            Add a person or business customer to your business.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Type */}
          <div className="space-y-3">
            <Label>Customer Type</Label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField("type", "PERSON")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  form.type === "PERSON"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <UserRound className="size-5" />
                </div>

                <div>
                  <p className="font-medium">Person</p>
                  <p className="text-xs text-muted-foreground">
                    Individual customer
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateField("type", "BUSINESS")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  form.type === "BUSINESS"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="size-5" />
                </div>

                <div>
                  <p className="font-medium">Business</p>
                  <p className="text-xs text-muted-foreground">
                    Company or organization
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Type-specific fields */}
          {form.type === "PERSON" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>

                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(event) =>
                      updateField("firstName", event.target.value)
                    }
                    placeholder="Enter first name"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>

                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">
                  Business Name{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(event) =>
                    updateField("businessName", event.target.value)
                  }
                  placeholder="Enter business name"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">
                    Contact Person
                  </Label>

                  <Input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(event) =>
                      updateField(
                        "contactPerson",
                        event.target.value,
                      )
                    }
                    placeholder="Enter contact person"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRegistrationNumber">
                    Tax Registration Number
                  </Label>

                  <Input
                    id="taxRegistrationNumber"
                    value={form.taxRegistrationNumber}
                    onChange={(event) =>
                      updateField(
                        "taxRegistrationNumber",
                        event.target.value,
                      )
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                Contact Information
              </h3>

              <p className="text-xs text-muted-foreground">
                Optional contact details for this customer.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>

                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>

                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                Address
              </h3>

              <p className="text-xs text-muted-foreground">
                Optional address information.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>

              <Input
                id="address"
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                placeholder="Street address"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>

                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) =>
                    updateField("city", event.target.value)
                  }
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State / Region</Label>

                <Input
                  id="state"
                  value={form.state}
                  onChange={(event) =>
                    updateField("state", event.target.value)
                  }
                  placeholder="State / Region"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  Postal Code
                </Label>

                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(event) =>
                    updateField("postalCode", event.target.value)
                  }
                  placeholder="Postal code"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              {saving ? "Saving..." : "Save Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}