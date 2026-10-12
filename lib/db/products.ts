import "server-only";

import { and, asc, eq, like, ne, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { productCategories, products } from "@/lib/db/schema";

export type ProductStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface GetProductsOptions {
  search?: string;
  categoryId?: number | null;
  status?: ProductStatusFilter;
}

export function getProducts(
  businessId: number,
  options: GetProductsOptions = {},
) {
  const conditions = [
    eq(products.businessId, businessId),
    eq(products.isSystem, false),
  ];

  const search = options.search?.trim();

  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
      )!,
    );
  }

  if (options.categoryId) {
    conditions.push(eq(products.categoryId, options.categoryId));
  }

  if (options.status === "ACTIVE") {
    conditions.push(eq(products.active, true));
  } else if (options.status === "INACTIVE") {
    conditions.push(eq(products.active, false));
  }

  return db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      unit: products.unit,
      sellingPrice: products.sellingPrice,
      purchasePrice: products.purchasePrice,
      currentStock: products.currentStock,
      lowStockThreshold: products.lowStockThreshold,
      taxRate: products.taxRate,
      active: products.active,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(
      productCategories,
      eq(products.categoryId, productCategories.id),
    )
    .where(and(...conditions))
    .orderBy(asc(products.name))
    .all();
}

export function getProductById(
  businessId: number,
  productId: number,
) {
  return db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      unit: products.unit,
      sellingPrice: products.sellingPrice,
      purchasePrice: products.purchasePrice,
      currentStock: products.currentStock,
      lowStockThreshold: products.lowStockThreshold,
      taxRate: products.taxRate,
      active: products.active,
      isSystem: products.isSystem,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(
      productCategories,
      eq(products.categoryId, productCategories.id),
    )
    .where(
      and(
        eq(products.id, productId),
        eq(products.businessId, businessId),
        eq(products.isSystem, false),
      ),
    )
    .get();
}

export function getProductCategories(businessId: number) {
  return db
    .select({
      id: productCategories.id,
      name: productCategories.name,
    })
    .from(productCategories)
    .where(eq(productCategories.businessId, businessId))
    .orderBy(asc(productCategories.name))
    .all();
}