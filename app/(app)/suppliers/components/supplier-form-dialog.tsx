"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type { SupplierRecord } from "@/lib/types/supplier";
import { createSupplierAction, updateSupplierAction } from "../actions";

type FormState = {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  taxRegistrationNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
  active: boolean;
};

const toForm = (supplier?: SupplierRecord): FormState => ({
  name: supplier?.name ?? "",
  contactPerson: supplier?.contactPerson ?? "",
  phone: supplier?.phone ?? "",
  email: supplier?.email ?? "",
  taxRegistrationNumber: supplier?.taxRegistrationNumber ?? "",
  address: supplier?.address ?? "",
  city: supplier?.city ?? "",
  state: supplier?.state ?? "",
  postalCode: supplier?.postalCode ?? "",
  notes: supplier?.notes ?? "",
  active: supplier?.active ?? true,
});

function SupplierForm({
  supplier,
  onDone,
  onCancel,
}: {
  supplier?: SupplierRecord;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(supplier);

  const [form, setForm] = useState<FormState>(() => toForm(supplier));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field =
    (key: keyof Omit<FormState, "active">) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    setSaving(true);

    const result = supplier
      ? await updateSupplierAction(supplier.id, form)
      : await createSupplierAction(form);

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Supplier name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={field("name")}
              placeholder="e.g. Sharma Dairy Traders"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input
              id="contactPerson"
              value={form.contactPerson}
              onChange={field("contactPerson")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={field("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={field("email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRegistrationNumber">Tax / GST number</Label>
            <Input
              id="taxRegistrationNumber"
              value={form.taxRegistrationNumber}
              onChange={field("taxRegistrationNumber")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={field("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={field("city")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={field("state")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input
                id="postalCode"
                value={form.postalCode}
                onChange={field("postalCode")}
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={field("notes")}
            />
          </div>
        </div>

        {/* Status: edit only */}
        {isEdit && (
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive suppliers can't be picked for new stock purchases. Their
                history is kept.
              </p>
            </div>
            <Switch
              id="active"
              checked={form.active}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, active: checked }))
              }
            />
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="shrink-0 border-t bg-destructive/10 px-6 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/30 px-6 py-4">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {isEdit ? "Save changes" : "Add supplier"}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Controlled dialog (used by the table's edit button)                        */
/* -------------------------------------------------------------------------- */

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierRecord;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{supplier ? "Edit supplier" : "Add supplier"}</DialogTitle>
          <DialogDescription>
            {supplier
              ? "Update contact details or mark the supplier active or inactive."
              : "Add someone you buy stock from."}
          </DialogDescription>
        </DialogHeader>

        <SupplierForm
          key={supplier?.id ?? "new"}
          supplier={supplier}
          onDone={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Header "Add Supplier" button                                               */
/* -------------------------------------------------------------------------- */

export function AddSupplierDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Add Supplier
      </Button>
      <SupplierFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail page "Edit" button                                                  */
/* -------------------------------------------------------------------------- */

export function EditSupplierButton({ supplier }: { supplier: SupplierRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        Edit
      </Button>
      <SupplierFormDialog open={open} onOpenChange={setOpen} supplier={supplier} />
    </>
  );
}