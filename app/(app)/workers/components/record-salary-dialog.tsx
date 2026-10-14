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
import { PAYMENT_METHOD_OPTIONS } from "@/common";

import { methodLabel, toPaise, todayKey } from "./worker-shared";

interface RecordSalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: number;
  workerName: string;
  /** Paise. Prefills the amount when set. */
  defaultAmount: number | null;
  /** yyyy-MM salary month to preselect. */
  initialMonth: string;
  onRecorded: () => void | Promise<void>;
}

export default function RecordSalaryDialog({
  open,
  onOpenChange,
  workerId,
  workerName,
  defaultAmount,
  initialMonth,
  onRecorded,
}: RecordSalaryDialogProps) {
  const [month, setMonth] = useState(initialMonth);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentDate, setPaymentDate] = useState(todayKey());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMonth(initialMonth);
      setAmount(defaultAmount ? (defaultAmount / 100).toFixed(2) : "");
      setPaymentMethod("CASH");
      setPaymentDate(todayKey());
      setReference("");
      setNotes("");
      setError("");
      setSaving(false);
    }
  }, [open, initialMonth, defaultAmount]);

  const amountPaise = toPaise(amount);
  const canSubmit =
    amountPaise > 0 && Boolean(month) && Boolean(paymentDate) && !saving;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    if (paymentDate > todayKey()) {
      setError("Choose a payment date that is not in the future.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/workers/${workerId}/salary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPeriod: month,
          amount: amountPaise,
          paymentMethod,
          paymentDate,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to record salary.");
      }

      await onRecorded();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record salary.");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add salary payment</DialogTitle>
          <DialogDescription>
            Record a salary payment made to {workerName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="salary-month">Salary month</Label>
              <Input
                id="salary-month"
                type="month"
                required
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="salary-amount">Amount (₹)</Label>
              <Input
                id="salary-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={saving}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value ?? "OTHER")}
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method">
                    {methodLabel(paymentMethod)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="salary-date">Payment date</Label>
              <Input
                id="salary-date"
                type="date"
                max={todayKey()}
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="salary-reference">Reference</Label>
            <Input
              id="salary-reference"
              placeholder="Optional"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="salary-notes">Notes</Label>
            <Textarea
              id="salary-notes"
              rows={2}
              placeholder="Optional"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
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
            <Button type="submit" disabled={!canSubmit}>
              {saving && <Loader2 className="animate-spin" />}
              {saving ? "Saving..." : "Add payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}