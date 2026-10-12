"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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

import { createProduct } from "../actions";
import type { CreateProductInput } from "../actions";
import { CategoryCombobox, ProductCategory } from "./category-combobox";

interface ProductDialogProps {
  categories: ProductCategory[];
}

const units = [
  "piece",
  "kg",
  "gram",
  "litre",
  "ml",
  "box",
  "packet",
  "dozen",
];

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

export function ProductDialog({ categories }: ProductDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [unit, setUnit] = useState("piece");
  const [sellingPrice, setSellingPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [taxRate, setTaxRate] = useState("0");

  function resetForm() {
    setName("");
    setCategoryName("");
    setUnit("piece");
    setSellingPrice("");
    setPurchasePrice("");
    setCurrentStock("0");
    setLowStockThreshold("");
    setTaxRate("0");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selling = Number(sellingPrice);
    const purchase =
      purchasePrice.trim() === "" ? null : Number(purchasePrice);
    const stock = Number(currentStock);
    const threshold =
      lowStockThreshold.trim() === "" ? null : Number(lowStockThreshold);
    const tax = Number(taxRate);

    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (
      !sellingPrice.trim() ||
      !Number.isFinite(selling) ||
      selling < 0 ||
      !Number.isSafeInteger(Math.round(selling * 100))
    ) {
      toast.error("Enter a valid selling price.");
      return;
    }

    if (
      purchase !== null &&
      (!Number.isFinite(purchase) ||
        purchase < 0 ||
        !Number.isSafeInteger(Math.round(purchase * 100)))
    ) {
      toast.error("Enter a valid purchase price.");
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      toast.error("Enter a valid opening stock.");
      return;
    }

    if (
      threshold !== null &&
      (!Number.isFinite(threshold) || threshold < 0)
    ) {
      toast.error("Enter a valid low-stock threshold.");
      return;
    }

    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      toast.error("Tax rate must be between 0 and 100.");
      return;
    }

    const input: CreateProductInput = {
      name: name.trim(),
      categoryName: categoryName.trim(),
      unit,
      sellingPrice: Math.round(selling * 100),
      purchasePrice: purchase === null ? null : Math.round(purchase * 100),
      currentStock: stock,
      lowStockThreshold: threshold,
      taxRate: tax,
    };

    startTransition(async () => {
      try {
        const result = await createProduct(input);

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        resetForm();
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Unable to save the product. Please try again.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return;

        setOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      {/* render prop avoids nesting a <button> inside the trigger's <button> */}
      <DialogTrigger
        render={
          <Button type="button">
            <Plus className="mr-2 size-4" />
            Add Product
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Add a product with its category, pricing, unit, and stock details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Full Cream Milk"
              maxLength={120}
              disabled={isPending}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-category">Category</Label>

              <CategoryCombobox
                id="product-category"
                categories={categories}
                value={categoryName}
                onChange={setCategoryName}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-unit">Unit *</Label>
              <Select
                value={unit}
                onValueChange={(value) => {
                  if (value !== null) setUnit(value);
                }}
                disabled={isPending}
              >
                <SelectTrigger id="product-unit" className="w-full">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>

                <SelectContent>
                  {units.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="selling-price">Selling Price (₹) *</Label>
              <Input
                id="selling-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(event) => setSellingPrice(event.target.value)}
                placeholder="0.00"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-price">Purchase Price (₹)</Label>
              <Input
                id="purchase-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(event) => setPurchasePrice(event.target.value)}
                placeholder="Optional"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opening-stock">Opening Stock *</Label>
              <Input
                id="opening-stock"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={currentStock}
                onChange={(event) => setCurrentStock(event.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low-stock">Low Stock Alert At</Label>
              <Input
                id="low-stock"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={lowStockThreshold}
                onChange={(event) => setLowStockThreshold(event.target.value)}
                placeholder="Optional"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax-rate">Tax Rate (%)</Label>
            <Input
              id="tax-rate"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
