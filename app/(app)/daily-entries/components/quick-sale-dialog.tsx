"use client";

import { useState } from "react";
import { Loader2, Plus, ReceiptIndianRupee } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createQuickSaleAction } from "../actions";
import { PAYMENT_METHOD, PAYMENT_METHOD_OPTIONS } from "@/common";

type PaymentMethod = PAYMENT_METHOD;



function todayKey() {
  const now = new Date();

  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

export function QuickSaleDialog() {
  const [open, setOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH");
  const [paymentReference, setPaymentReference] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const numericAmount = Number(amount);

  const amountInPaise =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? Math.round(numericAmount * 100)
      : 0;

  const amountError =
    amount !== "" && (!Number.isFinite(numericAmount) || numericAmount <= 0)
      ? "Enter an amount greater than zero."
      : null;

  const canSubmit = amountInPaise > 0 && !isSaving;

  function resetForm() {
    setAmount("");
    setPaymentMethod("CASH");
    setPaymentReference("");
    setSaveError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaveError(null);

    if (amountInPaise <= 0) {
      setSaveError("Enter a sale amount greater than zero.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createQuickSaleAction({
        amount: amountInPaise,
        paymentMethod,
        paymentDate: todayKey(),
        paymentReference: paymentReference.trim() || null,
        notes: null,
      });

      if (!result.success) {
        setSaveError(result.error ?? "Failed to record the sale.");
        return;
      }

      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("[quick-sale] Failed to create sale", error);

      setSaveError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return;

    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  }

  const selectedPaymentMethod = PAYMENT_METHOD_OPTIONS.find(
    (option) => option.value === paymentMethod,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            <ReceiptIndianRupee className="mr-2 size-4" />
            Quick Sale
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Quick Sale</DialogTitle>

            <DialogDescription>
              Record a counter sale without creating a customer
              or selecting a product.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Sale Amount */}
            <div className="space-y-2">
              <Label htmlFor="quick-sale-amount">
                Sale Amount
              </Label>

              <Input
                id="quick-sale-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setSaveError(null);
                }}
                autoFocus
              />

              {amountError && (
                <p className="text-sm text-destructive">
                  {amountError}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="quick-sale-payment-method">
                Payment Method
              </Label>

              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as PaymentMethod)
                }
              >
                <SelectTrigger id="quick-sale-payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>

                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Reference */}
            <div className="space-y-2">
              <Label htmlFor="quick-sale-reference">
                Payment Reference
                <span className="ml-1 text-muted-foreground">
                  (optional)
                </span>
              </Label>

              <Input
                id="quick-sale-reference"
                placeholder={
                  selectedPaymentMethod?.referencePlaceholder ??
                  "Optional"
                }
                value={paymentReference}
                onChange={(event) =>
                  setPaymentReference(event.target.value)
                }
                maxLength={100}
              />
            </div>

            {/* Info */}
            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              This sale will be recorded as a{" "}
              <span className="font-medium text-foreground">
                Quick Sale
              </span>{" "}
              and marked as fully paid.
            </div>

            {saveError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {saveError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={!canSubmit}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Complete Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}