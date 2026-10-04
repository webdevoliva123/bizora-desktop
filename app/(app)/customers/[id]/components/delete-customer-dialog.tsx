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

interface DeleteCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
  customerType: "PERSON" | "BUSINESS";
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

  useEffect(() => {
    if (open) {
      setTyped("");
      setError("");
    }
  }, [open]);

  const nameLabel = customerType === "BUSINESS" ? "business name" : "customer name";
  const matches = typed.trim() === customerName;

  async function handleDelete() {
    if (!matches) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete customer.");
      }

      onOpenChange(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !deleting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete customer</DialogTitle>
          <DialogDescription>
            This action is permanent and can't be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          Deleting <span className="font-semibold">{customerName}</span> will also
          permanently delete{" "}
          <span className="font-semibold">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </span>{" "}
          and all payments recorded against them.
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-name">
            Type <span className="font-semibold">{customerName}</span> to confirm
          </Label>
          <Input
            id="confirm-name"
            value={typed}
            autoComplete="off"
            placeholder={`Enter ${nameLabel}`}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleDelete();
            }}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!matches || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Delete customer and entries"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}