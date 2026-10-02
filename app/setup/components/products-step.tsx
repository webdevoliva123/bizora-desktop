"use client";

import { Package, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useSetupState } from "./setup-state";

const PRODUCT_UNITS = [
  "kg",
  "g",
  "litre",
  "ml",
  "piece",
  "pack",
  "dozen",
  "box",
  "unit",
] as const;

export function ProductsStep() {
  const { setupData, updateSetupData } = useSetupState();

  const addProduct = () => {
    updateSetupData("products", [
      ...setupData.products,
      {
        id: crypto.randomUUID(),
        name: "",
        category: "",
        unit: "piece",
        sellingPrice: "",
        purchasePrice: "",
        openingStock: "",
        lowStockThreshold: "",
        taxRate: "",
      },
    ]);
  };

  const removeProduct = (id: string) => {
    updateSetupData(
      "products",
      setupData.products.filter((product) => product.id !== id),
    );
  };

  const updateProduct = (
    id: string,
    field:
      | "name"
      | "category"
      | "unit"
      | "sellingPrice"
      | "purchasePrice"
      | "openingStock"
      | "lowStockThreshold"
      | "taxRate",
    value: string,
  ) => {
    updateSetupData(
      "products",
      setupData.products.map((product) =>
        product.id === id
          ? {
              ...product,
              [field]: value,
            }
          : product,
      ),
    );
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="size-5" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Products
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Add the products you sell and configure their pricing
              and stock information.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addProduct}
          >
            <Plus className="size-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {setupData.products.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Package className="mx-auto size-8 text-muted-foreground" />

          <p className="mt-3 text-sm font-medium">
            No products added yet
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            You can add products now or create them later from the
            Products section.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={addProduct}
          >
            <Plus className="size-4" />
            Add Product
          </Button>
        </div>
      )}

      {/* Products */}
      <div className="space-y-5">
        {setupData.products.map((product, index) => (
          <div
            key={product.id}
            className="rounded-lg border p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Product {index + 1}
                </p>

                <p className="text-xs text-muted-foreground">
                  Product, pricing, and inventory information
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeProduct(product.id)}
                aria-label={`Remove product ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="space-y-5">
              {/* Basic Information */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`product-name-${product.id}`}>
                    Product Name
                  </Label>

                  <Input
                    id={`product-name-${product.id}`}
                    value={product.name}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "name",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Fresh Milk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`product-category-${product.id}`}>
                    Category
                    <span className="ml-1 text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>

                  <Input
                    id={`product-category-${product.id}`}
                    value={product.category}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "category",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Dairy"
                  />
                </div>
              </div>

              {/* Unit */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`product-unit-${product.id}`}>
                    Unit
                  </Label>

                  <select
                    id={`product-unit-${product.id}`}
                    value={product.unit}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "unit",
                        event.target.value,
                      )
                    }
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {PRODUCT_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`product-tax-${product.id}`}>
                    Tax Rate
                    <span className="ml-1 text-muted-foreground">
                      (%)
                    </span>
                  </Label>

                  <Input
                    id={`product-tax-${product.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.taxRate}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "taxRate",
                        event.target.value,
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`selling-price-${product.id}`}>
                    Selling Price
                  </Label>

                  <Input
                    id={`selling-price-${product.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.sellingPrice}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "sellingPrice",
                        event.target.value,
                      )
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`purchase-price-${product.id}`}>
                    Purchase Price
                    <span className="ml-1 text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>

                  <Input
                    id={`purchase-price-${product.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.purchasePrice}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "purchasePrice",
                        event.target.value,
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`opening-stock-${product.id}`}>
                    Opening Stock
                  </Label>

                  <Input
                    id={`opening-stock-${product.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.openingStock}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "openingStock",
                        event.target.value,
                      )
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`low-stock-${product.id}`}>
                    Low Stock Threshold
                    <span className="ml-1 text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>

                  <Input
                    id={`low-stock-${product.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.lowStockThreshold}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "lowStockThreshold",
                        event.target.value,
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}