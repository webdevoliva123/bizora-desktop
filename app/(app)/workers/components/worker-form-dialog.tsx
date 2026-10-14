"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  WORKER_PAYMENT_TYPE_OPTIONS,
  type WorkerDetails,
} from "@/lib/types/worker";

import { paymentTypeLabel, toPaise, todayKey } from "./worker-shared";

interface FormState {
  name: string;
  role: string;
  phone: string;
  email: string;
  joiningDate: string;
  paymentType: string;
  defaultPaymentAmount: string; // rupees, as typed
  address: string;
  notes: string;
}

const toForm = (worker?: WorkerDetails): FormState => ({
  name: worker?.name ?? "",
  role: worker?.role ?? "",
  phone: worker?.phone ?? "",
  email: worker?.email ?? "",
  joiningDate: worker?.joiningDate?.slice(0, 10) ?? "",
  paymentType: worker?.paymentType ?? "MONTHLY",
  defaultPaymentAmount:
    worker?.defaultPaymentAmount != null
      ? (worker.defaultPaymentAmount / 100).toFixed(2)
      : "",
  address: worker?.address ?? "",
  notes: worker?.notes ?? "",
});

interface WorkerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a worker to edit, leave empty to create. */
  worker?: WorkerDetails;
  onSaved: () => void | Promise<void>;
}

export function WorkerFormDialog({
  open,
  onOpenChange,
  worker,
  onSaved,
}: WorkerFormDialogProps) {
  const isEdit = Boolean(worker);

  const [form, setForm] = useState<FormState>(() => toForm(worker));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset every time the dialog opens
  useEffect(() => {
    if (open) {
      setForm(toForm(worker));
      setError("");
      setSaving(false);
    }
  }, [open, worker]);

  const field =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Worker name is required.");
      return;
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    if (form.joiningDate && form.joiningDate > todayKey()) {
      setError("Joining date can't be in the future.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        isEdit ? `/api/workers/${worker!.id}` : "/api/workers",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            phone: form.phone,
            email: form.email,
            joiningDate: form.joiningDate || null,
            paymentType: form.paymentType,
            defaultPaymentAmount: form.defaultPaymentAmount.trim()
              ? toPaise(form.defaultPaymentAmount)
              : null,
            address: form.address,
            notes: form.notes,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save worker.");
      }

      await onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save worker.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit worker" : "Add worker"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this worker."
              : "Add someone who works for your business."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="worker-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="worker-name"
                value={form.name}
                onChange={field("name")}
                placeholder="Enter worker name"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-role">Role</Label>
              <Input
                id="worker-role"
                value={form.role}
                onChange={field("role")}
                placeholder="e.g. Cashier, Helper"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-joining">Joining date</Label>
              <Input
                id="worker-joining"
                type="date"
                max={todayKey()}
                value={form.joiningDate}
                onChange={field("joiningDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-phone">Phone</Label>
              <Input
                id="worker-phone"
                type="tel"
                value={form.phone}
                onChange={field("phone")}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-email">Email</Label>
              <Input
                id="worker-email"
                type="email"
                value={form.email}
                onChange={field("email")}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Salary type</Label>
              <Select
                value={form.paymentType}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    paymentType: value ?? "MONTHLY",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type">
                    {paymentTypeLabel(form.paymentType)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {WORKER_PAYMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-amount">Default salary (₹)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="worker-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className="pl-7 tabular-nums"
                  placeholder="0.00"
                  value={form.defaultPaymentAmount}
                  onChange={field("defaultPaymentAmount")}
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="worker-address">Address</Label>
              <Input
                id="worker-address"
                value={form.address}
                onChange={field("address")}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="worker-notes">Notes</Label>
              <Textarea
                id="worker-notes"
                rows={3}
                value={form.notes}
                onChange={field("notes")}
                placeholder="Optional"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add worker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Header "Add Worker" button                                                 */
/* -------------------------------------------------------------------------- */

export default function AddWorkerDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Worker</Button>

      <WorkerFormDialog
        open={open}
        onOpenChange={setOpen}
        onSaved={() => {
          window.dispatchEvent(new Event("workers:refresh"));
        }}
      />
    </>
  );
}