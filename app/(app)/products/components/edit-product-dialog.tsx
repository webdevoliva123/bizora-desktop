"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";

import { setProductActive, updateProduct } from "../actions";
import type { UpdateProductInput } from "../actions";
import { CategoryCombobox } from "./category-combobox";
import type { ProductCategory } from "./category-combobox";

export type EditableProduct = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  unit: string;
  sellingPrice: number; // paise
  purchasePrice: number | null; // paise
  currentStock: number;
  lowStockThreshold: number | null;
  taxRate: number | null;
  active: boolean;
};

interface EditProductDialogProps {
  product: EditableProduct | null;
  categories: ProductCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

/** paise -> "125.50" */
const toRupees = (paise: number | null) =>
  paise === null ? "" : (paise / 100).toFixed(2);

interface FormState {
  name: string;
  categoryName: string;
  unit: string;
  sellingPrice: string;
  purchasePrice: string;
  currentStock: string;
  lowStockThreshold: string;
  taxRate: string;
  active: boolean;
}

function toForm(product: EditableProduct): FormState {
  return {
    name: product.name,
    categoryName: product.categoryName ?? "",
    unit: product.unit,
    sellingPrice: toRupees(product.sellingPrice),
    purchasePrice: toRupees(product.purchasePrice),
    currentStock: String(product.currentStock),
    lowStockThreshold:
      product.lowStockThreshold === null
        ? ""
        : String(product.lowStockThreshold),
    taxRate: String(product.taxRate ?? 0),
    active: product.active,
  };
}

export function EditProductDialog({
  product,
  categories,
  open,
  onOpenChange,
}: EditProductDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<FormState | null>(null);

  // Load the selected product into the form every time the dialog opens
  useEffect(() => {
    if (open && product) setForm(toForm(product));
  }, [open, product]);

  if (!product || !form) {
    return null;
  }

  const initial = toForm(product);

  const hasChanges = (Object.keys(initial) as (keyof FormState)[]).some(
    (key) => initial[key] !== form[key],
  );

  // Units already on the product but not in the preset list stay selectable
  const unitOptions = units.includes(form.unit) ? units : [form.unit, ...units];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!product || !form) return;

    const selling = Number(form.sellingPrice);
    const purchase =
      form.purchasePrice.trim() === "" ? null : Number(form.purchasePrice);
    const stock = Number(form.currentStock);
    const threshold =
      form.lowStockThreshold.trim() === ""
        ? null
        : Number(form.lowStockThreshold);
    const tax = Number(form.taxRate);

    if (!form.name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (
      !form.sellingPrice.trim() ||
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
      toast.error("Enter a valid current stock.");
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

    const input: UpdateProductInput = {
      productId: product.id,
      name: form.name.trim(),
      categoryName: form.categoryName.trim(),
      unit: form.unit,
      sellingPrice: Math.round(selling * 100),
      purchasePrice: purchase === null ? null : Math.round(purchase * 100),
      currentStock: stock,
      lowStockThreshold: threshold,
      taxRate: tax,
    };

    const activeChanged = form.active !== product.active;

    startTransition(async () => {
      try {
        const result = await updateProduct(input);

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        if (activeChanged) {
          const statusResult = await setProductActive(
            product.id,
            form.active,
          );

          if (!statusResult.success) {
            // Details were saved; only the status change failed
            toast.error(
              `Product details were saved, but the status was not changed: ${statusResult.message}`,
            );
            router.refresh();
            return;
          }
        }

        toast.success(result.message);
        onOpenChange(false);
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
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the details for {product.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-product-name">Product Name *</Label>
            <Input
              id="edit-product-name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              maxLength={120}
              disabled={isPending}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-product-category">Category</Label>

              <CategoryCombobox
                id="edit-product-category"
                categories={categories}
                value={form.categoryName}
                onChange={(value) => set("categoryName", value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-product-unit">Unit *</Label>
              <Select
                value={form.unit}
                onValueChange={(value) => {
                  if (value !== null) set("unit", value);
                }}
                disabled={isPending}
              >
                <SelectTrigger id="edit-product-unit" className="w-full">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>

                <SelectContent>
                  {unitOptions.map((item) => (
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
              <Label htmlFor="edit-selling-price">Selling Price (₹) *</Label>
              <Input
                id="edit-selling-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={(event) => set("sellingPrice", event.target.value)}
                placeholder="0.00"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-purchase-price">Purchase Price (₹)</Label>
              <Input
                id="edit-purchase-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(event) => set("purchasePrice", event.target.value)}
                placeholder="Optional"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-current-stock">Current Stock *</Label>
              <Input
                id="edit-current-stock"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={form.currentStock}
                onChange={(event) => set("currentStock", event.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-low-stock">Low Stock Alert At</Label>
              <Input
                id="edit-low-stock"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={form.lowStockThreshold}
                onChange={(event) =>
                  set("lowStockThreshold", event.target.value)
                }
                placeholder="Optional"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tax-rate">Tax Rate (%)</Label>
            <Input
              id="edit-tax-rate"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              value={form.taxRate}
              onChange={(event) => set("taxRate", event.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
            <div>
              <Label htmlFor="edit-product-active">Active</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Turn this off to mark the product as inactive.
              </p>
            </div>

            <Switch
              id="edit-product-active"
              checked={form.active}
              onCheckedChange={(checked) => set("active", checked)}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isPending || !hasChanges}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
