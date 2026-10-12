
import { Package } from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

import {
  getSetupStatus,
  getBusinessBasicDetails,
} from "@/lib/db/business";

import {
  getProductCategories,
  getProducts,
} from "@/lib/db/products";

import { ProductDialog } from "./components/product-dialog";
import { ProductsTable } from "./components/products-table";

export default async function ProductsPage() {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    return null;
  }

  const business = getBusinessBasicDetails();

  if (!business) {
    return null;
  }

  const products = getProducts(setup.businessId);
  const categories = getProductCategories(setup.businessId);

  const activeProducts = products.filter((product) => product.active);
  const inactiveProducts = products.filter((product) => !product.active);

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="Manage your products, prices, and stock."
        actions={<ProductDialog categories={categories} />}
      />

      <section className="mt-6 space-y-6">
        {/* Product summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total Products
              </p>
              <Package className="size-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-2xl font-semibold">
              {products.length}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Active Products
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {activeProducts.length}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Inactive Products
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {inactiveProducts.length}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Product Categories
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {categories.length}
            </p>
          </div>
        </div>

        {/* Searchable product listing */}
        <ProductsTable
          products={products}
          categories={categories}
        />
      </section>
    </PageContainer>
  );
}
