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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createQuickProduct } from "../actions";
import type { ProductOption } from "@/lib/types/stock-purchase";

const UNITS = ["piece", "kg", "g", "litre", "ml", "box", "packet", "dozen"];

type QuickProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onCreated: (product: ProductOption) => void;
};

export function QuickProductDialog({
  open,
  onOpenChange,
  initialName = "",
  onCreated,
}: QuickProductDialogProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("piece");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setUnit("piece");
      setPurchasePrice("");
      setSellingPrice("");
      setTaxRate("0");
      setError(null);
    }
  }, [open, initialName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    setError(null);

    const selling = Number(sellingPrice);
    const purchase = purchasePrice.trim() === "" ? null : Number(purchasePrice);
    const tax = Number(taxRate);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (sellingPrice.trim() === "" || !Number.isFinite(selling) || selling < 0) {
      setError("Enter a valid selling price.");
      return;
    }

    if (purchase !== null && (!Number.isFinite(purchase) || purchase < 0)) {
      setError("Enter a valid purchase price.");
      return;
    }

    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      setError("Tax must be between 0 and 100.");
      return;
    }

    setSaving(true);

    try {
      const product = await createQuickProduct({
        name,
        unit,
        sellingPrice: Math.round(selling * 100),
        purchasePrice: purchase === null ? null : Math.round(purchase * 100),
        taxRate: tax,
      });
      onCreated(product);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New product</DialogTitle>
            <DialogDescription>
              The product is added to your catalogue with zero stock. Stock
              increases when you save this purchase.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="quickProductName">Product name</Label>
              <Input
                id="quickProductName"
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Basmati Rice"
              />
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(value) => setUnit(value ?? "piece")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickProductTax">Tax (%)</Label>
              <Input
                id="quickProductTax"
                type="number"
                min="0"
                max="100"
                step="any"
                value={taxRate}
                onChange={(event) => setTaxRate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickProductPurchase">Purchase price (₹)</Label>
              <Input
                id="quickProductPurchase"
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(event) => setPurchasePrice(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickProductSelling">Selling price (₹)</Label>
              <Input
                id="quickProductSelling"
                type="number"
                min="0"
                step="0.01"
                required
                value={sellingPrice}
                onChange={(event) => setSellingPrice(event.target.value)}
              />
            </div>
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
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
