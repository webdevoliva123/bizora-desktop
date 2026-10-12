
import { Package, PackageCheck, PackageX, Tags } from "lucide-react";

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
import StatCard from "@/components/global-common/stat-card";

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
          <StatCard
            title="Total Products"
            value={products.length}
            icon={Package}
          />

          <StatCard
            title="Active Products"
            value={activeProducts.length}
            icon={PackageCheck}
          />

          <StatCard
            title="Inactive Products"
            value={inactiveProducts.length}
            icon={PackageX}
          />

          <StatCard
            title="Product Categories"
            value={categories.length}
            icon={Tags}
          />
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
