
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
import { CUSTOMER_TYPE } from "@/common";

interface DeleteCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
  customerType: CUSTOMER_TYPE;
  entryCount: number;
  onDeleted: () => void;
}

export default function DeleteCustomerDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerType,
  entryCount,
  onDeleted,
}: DeleteCustomerDialogProps) {
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const hasHistory = entryCount > 0;

  useEffect(() => {
    if (open) {
      setTyped("");
      setError("");
    }
  }, [open]);

  const nameLabel =
    customerType === "BUSINESS" ? "business name" : "customer name";

  const matches = typed.trim() === customerName;

  async function handleDeleteOrDeactivate() {
    if (!matches) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Failed to ${hasHistory ? "deactivate" : "delete"} customer.`,
        );
      }

      onOpenChange(false);
      onDeleted();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${hasHistory ? "deactivate" : "delete"} customer.`,
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !deleting && onOpenChange(next)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasHistory ? "Deactivate customer" : "Delete customer"}
          </DialogTitle>

          <DialogDescription>
            {hasHistory
              ? "This customer has transaction history, so they will be deactivated instead of permanently deleted."
              : "This customer has no transaction history and can be permanently deleted."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          {hasHistory ? (
            <>
              <span className="font-semibold">{customerName}</span> has{" "}
              <span className="font-semibold">
                {entryCount} {entryCount === 1 ? "entry" : "entries"}
              </span>{" "}
              in the system.
              <br />
              <br />
              The customer will be <strong>deactivated</strong>. Their
              entries, invoices, and payments will be preserved and will not
              be deleted.
            </>
          ) : (
            <>
              <span className="font-semibold">{customerName}</span> has no
              transaction history.
              <br />
              <br />
              The customer and their basic details will be permanently
              deleted. This action cannot be undone.
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-name">
            Type{" "}
            <span className="font-semibold">{customerName}</span> to confirm
          </Label>

          <Input
            id="confirm-name"
            value={typed}
            autoComplete="off"
            placeholder={`Enter ${nameLabel}`}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleDeleteOrDeactivate();
              }
            }}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            disabled={!matches || deleting}
            onClick={handleDeleteOrDeactivate}
          >
            {deleting
              ? hasHistory
                ? "Deactivating..."
                : "Deleting..."
              : hasHistory
                ? "Deactivate customer"
                : "Delete customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
