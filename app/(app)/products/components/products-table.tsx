"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Package, Pencil, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EditProductDialog } from "./edit-product-dialog";

type Product = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  unit: string;
  sellingPrice: number;
  purchasePrice: number | null;
  currentStock: number;
  lowStockThreshold: number | null;
  taxRate: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProductCategory = {
  id: number;
  name: string;
};

interface ProductsTableProps {
  products: Product[];
  categories: ProductCategory[];
}

/* -------------------------------------------------------------------------- */
/* Filter options                                                             */
/* -------------------------------------------------------------------------- */

type StatusFilter = "all" | "active" | "inactive";

const ALL_CATEGORIES = "all";
const NO_CATEGORY = "none";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const isStatusFilter = (value: unknown): value is StatusFilter =>
  STATUS_OPTIONS.some((option) => option.value === value);

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

function formatPrice(amount: number | null) {
  return amount === null ? "—" : currency.format(amount / 100);
}

function isLowStock(product: Product) {
  return (
    product.active &&
    product.lowStockThreshold !== null &&
    product.currentStock <= product.lowStockThreshold
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditOpen(true);
  }

  const categoryOptions = useMemo(
    () => [
      { value: ALL_CATEGORIES, label: "All categories" },
      { value: NO_CATEGORY, label: "No category" },
      ...categories.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ],
    [categories],
  );

  // The select shows the label (not the raw value like "all")
  const categoryLabel =
    categoryOptions.find((option) => option.value === category)?.label ??
    "All categories";

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "All statuses";

  const filtersActive =
    search.trim() !== "" || category !== ALL_CATEGORIES || status !== "all";

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.categoryName ?? "").toLowerCase().includes(query);

      const matchesCategory =
        category === ALL_CATEGORIES ||
        String(product.categoryId ?? NO_CATEGORY) === category;

      const matchesStatus =
        status === "all" ||
        (status === "active" && product.active) ||
        (status === "inactive" && !product.active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, category, status]);

  const lowStockCount = useMemo(
    () => filteredProducts.filter(isLowStock).length,
    [filteredProducts],
  );

  function clearFilters() {
    setSearch("");
    setCategory(ALL_CATEGORIES);
    setStatus("all");
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm sm:flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products or categories..."
            aria-label="Search products or categories"
            className={cn("pl-9", search && "pr-9")}
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center">
          {/* Category */}
          <Select
            value={category}
            onValueChange={(value) => {
              if (value !== null) setCategory(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Category">
              <SelectValue placeholder="All categories">
                {categoryLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={status}
            onValueChange={(value) => {
              if (isStatusFilter(value)) setStatus(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-40" aria-label="Status">
              <SelectValue placeholder="All statuses">
                {statusLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filtersActive && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Product</TableHead>
              <TableHead className="px-4">Category</TableHead>
              <TableHead className="px-4">Unit</TableHead>
              <TableHead className="px-4 text-right">Selling Price</TableHead>
              <TableHead className="px-4 text-right">Purchase Price</TableHead>
              <TableHead className="px-4 text-right">Current Stock</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-56 text-center">
                  <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No products found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {filtersActive
                      ? "Try changing your search or filters."
                      : "Add your first product to get started."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const lowStock = isLowStock(product);
                const inactive = !product.active;

                return (
                  <TableRow
                    key={product.id}
                    className={cn(
                      "transition-colors",
                      // Inactive: grey gradient. Low stock: red gradient.
                      // (Low stock only applies to active products.)
                      inactive
                        ? "bg-gradient-to-r from-slate-100/90 via-slate-50/50 to-transparent hover:from-slate-200/80 hover:via-slate-100/60 "
                        : lowStock
                          ? "bg-gradient-to-r from-red-100/80 via-red-50/40 to-transparent hover:from-red-200/70 hover:via-red-50/60 "
                          : "hover:bg-muted/50",
                    )}
                  >
                    <TableCell className="px-4">
                      <div className="font-medium">{product.name}</div>
                      {product.taxRate ? (
                        <div className="text-xs text-muted-foreground">
                          Tax: {product.taxRate}%
                        </div>
                      ) : null}
                    </TableCell>

                    <TableCell className="px-4">
                      {product.categoryName || "—"}
                    </TableCell>

                    <TableCell className="px-4 capitalize">
                      {product.unit}
                    </TableCell>

                    <TableCell className="px-4 text-right tabular-nums">
                      {formatPrice(product.sellingPrice)}
                    </TableCell>

                    <TableCell className="px-4 text-right tabular-nums">
                      {formatPrice(product.purchasePrice)}
                    </TableCell>

                    <TableCell className="px-4 text-right tabular-nums">
                      <span
                        className={cn(
                          lowStock && "font-semibold text-red-700 dark:text-red-400",
                        )}
                      >
                        {product.currentStock}
                      </span>

                      {lowStock && (
                        <div className="flex items-center justify-end gap-1 text-xs font-medium text-red-700 dark:text-red-400">
                          <AlertTriangle className="size-3" />
                          Low stock
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="px-4">
                      <Badge
                        variant="outline"
                        className={
                          product.active
                            ? "border-transparent bg-emerald-100 text-emerald-700"
                            : "border-transparent bg-muted text-muted-foreground"
                        }
                      >
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>

          {filteredProducts.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8} className="px-4 text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length}{" "}
                  {products.length === 1 ? "product" : "products"}
                  {lowStockCount > 0 && (
                    <span className="ml-3 font-medium text-red-700 dark:text-red-400">
                      {lowStockCount} low on stock
                    </span>
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <EditProductDialog
        product={editingProduct}
        categories={categories}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}