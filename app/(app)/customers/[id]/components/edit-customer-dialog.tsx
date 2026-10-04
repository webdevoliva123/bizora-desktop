"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { CustomerDetails } from "@/lib/types/customer";

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerDetails;
  onSaved: () => void | Promise<void>;
}

interface FormState {
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
  active: boolean;
}

function toForm(customer: CustomerDetails): FormState {
  return {
    firstName: customer.person?.firstName ?? "",
    lastName: customer.person?.lastName ?? "",
    businessName: customer.business?.businessName ?? "",
    contactPerson: customer.business?.contactPerson ?? "",
    taxRegistrationNumber: customer.business?.taxRegistrationNumber ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    postalCode: customer.postalCode ?? "",
    active: customer.active,
  };
}

const orNull = (value: string) => value.trim() || null;

export default function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: EditCustomerDialogProps) {
  const isBusiness = customer.type === "BUSINESS";

  const [form, setForm] = useState<FormState>(() => toForm(customer));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Reset the form every time the dialog opens
  useEffect(() => {
    if (open) {
      setForm(toForm(customer));
      setErrors({});
      setSubmitError("");
    }
  }, [open, customer]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (isBusiness) {
      if (!form.businessName.trim()) next.businessName = "Business name is required.";
    } else if (!form.firstName.trim()) {
      next.firstName = "First name is required.";
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleReview() {
    if (validate()) setConfirmOpen(true);
  }

  async function handleConfirm() {
    try {
      setSaving(true);
      setSubmitError("");

      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: orNull(form.phone),
          email: orNull(form.email),
          address: orNull(form.address),
          city: orNull(form.city),
          state: orNull(form.state),
          postalCode: orNull(form.postalCode),
          active: form.active,
          ...(isBusiness
            ? {
                business: {
                  businessName: form.businessName.trim(),
                  contactPerson: orNull(form.contactPerson),
                  taxRegistrationNumber: orNull(form.taxRegistrationNumber),
                },
              }
            : {
                person: {
                  firstName: form.firstName.trim(),
                  lastName: orNull(form.lastName),
                },
              }),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update customer.");
      }

      await onSaved();
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to update customer.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>
              Update the details for this {isBusiness ? "business" : "person"}.
              The customer type can't be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {isBusiness ? (
              <>
                <Field
                  label="Business name"
                  required
                  error={errors.businessName}
                  className="sm:col-span-2"
                >
                  <Input
                    value={form.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                  />
                </Field>

                <Field label="Contact person">
                  <Input
                    value={form.contactPerson}
                    onChange={(e) => set("contactPerson", e.target.value)}
                  />
                </Field>

                <Field label="Tax registration number">
                  <Input
                    value={form.taxRegistrationNumber}
                    onChange={(e) => set("taxRegistrationNumber", e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="First name" required error={errors.firstName}>
                  <Input
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </Field>

                <Field label="Last name">
                  <Input
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                </Field>
              </>
            )}

            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>

            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>

            <Field label="Address" className="sm:col-span-2">
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>

            <Field label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>

            <Field label="State / Region">
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </Field>

            <Field label="Postal code">
              <Input
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 sm:self-end">
              <div>
                <Label htmlFor="customer-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive customers are hidden from new entries.
                </p>
              </div>
              <Switch
                id="customer-active"
                checked={form.active}
                onCheckedChange={(checked) => set("active", checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleReview}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save confirmation */}
      <Dialog open={confirmOpen} onOpenChange={(next) => !saving && setConfirmOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save changes?</DialogTitle>
            <DialogDescription>
              This will update the customer's details everywhere they appear.
            </DialogDescription>
          </DialogHeader>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setConfirmOpen(false)}
            >
              Go back
            </Button>
            <Button disabled={saving} onClick={handleConfirm}>
              {saving ? "Saving..." : "Confirm & save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}