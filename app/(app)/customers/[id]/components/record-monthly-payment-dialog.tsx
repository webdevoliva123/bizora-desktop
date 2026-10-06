"use client";

import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  PAYMENT_METHOD_OPTIONS,
  todayKey,
} from "@/app/(app)/daily-entries/components/payment-options";

interface RecordMonthlyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  accountMonth: string;
  outstandingAmount: number;
  onRecorded: () => void | Promise<void>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function parseAmountToPaise(value: string): number {
  const normalized = value.replace(/,/g, "").trim();

  if (!normalized) return 0;

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return Math.round(amount * 100);
}

/** Local-time "yyyy-MM-dd" (avoids the UTC shift of toISOString) */
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const paymentMethodLabel = (value: string) =>
  PAYMENT_METHOD_OPTIONS.find((option) => option.value === value)?.label ??
  value;

export default function RecordMonthlyPaymentDialog({
  open,
  onOpenChange,
  customerId,
  accountMonth,
  outstandingAmount,
  onRecorded,
}: RecordMonthlyPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentDate, setPaymentDate] = useState(todayKey());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setPaymentMethod("CASH");
      setPaymentDate(todayKey());
      setCalendarOpen(false);
      setReference("");
      setNotes("");
      setError("");
      setSaving(false);
    }
  }, [open]);

  const selectedDate = useMemo(
    () => new Date(`${paymentDate}T00:00:00`),
    [paymentDate],
  );

  const amountPaise = parseAmountToPaise(amount);
  const exceedsOutstanding = amountPaise > outstandingAmount;

  const canSubmit =
    amountPaise > 0 &&
    amountPaise <= outstandingAmount &&
    Boolean(paymentMethod) &&
    Boolean(paymentDate) &&
    !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/customers/${customerId}/monthly-account/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountMonth,
            amount: amountPaise,
            paymentMethod,
            paymentDate,
            reference: reference.trim() || null,
            notes: notes.trim() || null,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to record monthly payment.");
      }

      await onRecorded();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to record monthly payment:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to record monthly payment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Monthly Payment</DialogTitle>

          <DialogDescription>
            Record a payment against this customer's {accountMonth} monthly
            account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                Outstanding
              </span>

              <span className="text-base font-semibold tabular-nums text-red-600">
                {formatCurrency(outstandingAmount)}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="monthly-payment-amount">Amount</Label>

            <Input
              id="monthly-payment-amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={saving}
              aria-invalid={exceedsOutstanding}
            />

            {exceedsOutstanding && (
              <p className="text-xs text-destructive">
                Payment cannot exceed the outstanding amount of{" "}
                {formatCurrency(outstandingAmount)}.
              </p>
            )}
          </div>

          {/* Payment method + date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="monthly-payment-method">Payment Method</Label>

              <Select
                value={paymentMethod}
                onValueChange={(value) => {
                  if (value) setPaymentMethod(value);
                }}
                disabled={saving}
              >
                <SelectTrigger
                  id="monthly-payment-method"
                  className="w-full"
                >
                  <SelectValue placeholder="Select method">
                    {paymentMethodLabel(paymentMethod)}
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
              <Label htmlFor="monthly-payment-date">Payment Date</Label>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="monthly-payment-date"
                      type="button"
                      variant="outline"
                      disabled={saving}
                      className="w-full justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon className="size-4 opacity-60" />
                  <span>{formatDate(selectedDate)}</span>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    defaultMonth={selectedDate}
                    onSelect={(date) => {
                      if (!date) return;
                      setPaymentDate(toDateKey(date));
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <Label htmlFor="monthly-payment-reference">Reference</Label>

            <Input
              id="monthly-payment-reference"
              placeholder="Optional"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              disabled={saving}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="monthly-payment-notes">Notes</Label>

            <Textarea
              id="monthly-payment-notes"
              placeholder="Optional"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}