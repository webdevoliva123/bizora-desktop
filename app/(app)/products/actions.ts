
"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { productCategories, products } from "@/lib/db/schema";
import { getSetupStatus } from "@/lib/db/business";

export interface CreateProductInput {
  name: string;
  categoryName: string;
  unit: string;
  sellingPrice: number;
  purchasePrice: number | null;
  currentStock: number;
  lowStockThreshold: number | null;
  taxRate: number;
}

export async function createProduct(input: CreateProductInput) {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    return {
      success: false,
      message: "Business setup is incomplete.",
    };
  }

  const businessId = setup.businessId;
  const name = input.name.trim();
  const unit = input.unit.trim();
  const categoryName = input.categoryName.trim();

  if (!name) {
    return { success: false, message: "Product name is required." };
  }

  if (name.length > 120) {
    return {
      success: false,
      message: "Product name cannot exceed 120 characters.",
    };
  }

  if (!unit) {
    return { success: false, message: "Please select a unit." };
  }

  if (
    !Number.isSafeInteger(input.sellingPrice) ||
    input.sellingPrice < 0
  ) {
    return { success: false, message: "Enter a valid selling price." };
  }

  if (
    input.purchasePrice !== null &&
    (!Number.isSafeInteger(input.purchasePrice) ||
      input.purchasePrice < 0)
  ) {
    return { success: false, message: "Enter a valid purchase price." };
  }

  if (
    !Number.isFinite(input.currentStock) ||
    input.currentStock < 0
  ) {
    return { success: false, message: "Enter a valid current stock." };
  }

  if (
    input.lowStockThreshold !== null &&
    (!Number.isFinite(input.lowStockThreshold) ||
      input.lowStockThreshold < 0)
  ) {
    return {
      success: false,
      message: "Enter a valid low-stock threshold.",
    };
  }

  if (
    !Number.isFinite(input.taxRate) ||
    input.taxRate < 0 ||
    input.taxRate > 100
  ) {
    return {
      success: false,
      message: "Tax rate must be between 0 and 100.",
    };
  }

  if (categoryName.length > 100) {
    return {
      success: false,
      message: "Category name cannot exceed 100 characters.",
    };
  }

  const existingProduct = db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.name, name),
        eq(products.isSystem, false),
      ),
    )
    .get();

  if (existingProduct) {
    return {
      success: false,
      message: "A product with this name already exists.",
    };
  }

  const now = new Date().toISOString();

  try {
    db.transaction((tx) => {
      let categoryId: number | null = null;

      if (categoryName) {
        const existingCategories = tx
          .select({
            id: productCategories.id,
            name: productCategories.name,
          })
          .from(productCategories)
          .where(eq(productCategories.businessId, businessId))
          .all();

        const existingCategory = existingCategories.find(
          (category) =>
            category.name.toLowerCase() === categoryName.toLowerCase(),
        );

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const result = tx
            .insert(productCategories)
            .values({
              businessId,
              name: categoryName,
              createdAt: now,
            })
            .returning({ id: productCategories.id })
            .get();

          categoryId = result.id;
        }
      }

      tx.insert(products)
        .values({
          businessId,
          categoryId,
          name,
          unit,
          sellingPrice: input.sellingPrice,
          purchasePrice: input.purchasePrice,
          currentStock: input.currentStock,
          lowStockThreshold: input.lowStockThreshold,
          taxRate: input.taxRate,
          active: true,
          isSystem: false,
          systemKey: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    });
  } catch (error) {
    console.error("Failed to create product:", error);

    return {
      success: false,
      message: "Unable to create product. Please try again.",
    };
  }

  revalidatePath("/products");

  return {
    success: true,
    message: "Product created successfully.",
  };
}


export interface UpdateProductInput extends CreateProductInput {
    productId: number;
  }
  
  export async function updateProduct(input: UpdateProductInput) {
    const setup = await getSetupStatus();
  
    if (!setup.completed || !setup.businessId) {
      return {
        success: false,
        message: "Business setup is incomplete.",
      };
    }
  
    const businessId = setup.businessId;
    const name = input.name.trim();
    const unit = input.unit.trim();
    const categoryName = input.categoryName.trim();
  
    if (!Number.isSafeInteger(input.productId) || input.productId <= 0) {
      return { success: false, message: "Invalid product." };
    }
  
    if (!name || name.length > 120) {
      return {
        success: false,
        message: "Enter a valid product name (maximum 120 characters).",
      };
    }
  
    if (!unit) {
      return { success: false, message: "Please select a unit." };
    }
  
    if (
      !Number.isSafeInteger(input.sellingPrice) ||
      input.sellingPrice < 0
    ) {
      return { success: false, message: "Enter a valid selling price." };
    }
  
    if (
      input.purchasePrice !== null &&
      (!Number.isSafeInteger(input.purchasePrice) ||
        input.purchasePrice < 0)
    ) {
      return { success: false, message: "Enter a valid purchase price." };
    }
  
    if (
      !Number.isFinite(input.currentStock) ||
      input.currentStock < 0
    ) {
      return { success: false, message: "Enter a valid current stock." };
    }
  
    if (
      input.lowStockThreshold !== null &&
      (!Number.isFinite(input.lowStockThreshold) ||
        input.lowStockThreshold < 0)
    ) {
      return {
        success: false,
        message: "Enter a valid low-stock threshold.",
      };
    }
  
    if (
      !Number.isFinite(input.taxRate) ||
      input.taxRate < 0 ||
      input.taxRate > 100
    ) {
      return {
        success: false,
        message: "Tax rate must be between 0 and 100.",
      };
    }
  
    if (categoryName.length > 100) {
      return {
        success: false,
        message: "Category name cannot exceed 100 characters.",
      };
    }
  
    const product = db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, input.productId),
          eq(products.businessId, businessId),
          eq(products.isSystem, false),
        ),
      )
      .get();
  
    if (!product) {
      return {
        success: false,
        message: "Product not found.",
      };
    }
  
    const duplicate = db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.businessId, businessId),
          eq(products.name, name),
          ne(products.id, input.productId),
          eq(products.isSystem, false),
        ),
      )
      .get();
  
    if (duplicate) {
      return {
        success: false,
        message: "Another product with this name already exists.",
      };
    }
  
    try {
      const now = new Date().toISOString();
  
      db.transaction((tx) => {
        let categoryId: number | null = null;
  
        if (categoryName) {
          const existingCategories = tx
            .select({
              id: productCategories.id,
              name: productCategories.name,
            })
            .from(productCategories)
            .where(eq(productCategories.businessId, businessId))
            .all();
  
          const existingCategory = existingCategories.find(
            (category) =>
              category.name.toLowerCase() === categoryName.toLowerCase(),
          );
  
          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            const createdCategory = tx
              .insert(productCategories)
              .values({
                businessId,
                name: categoryName,
                createdAt: now,
              })
              .returning({ id: productCategories.id })
              .get();
  
            categoryId = createdCategory.id;
          }
        }
  
        tx.update(products)
          .set({
            name,
            categoryId,
            unit,
            sellingPrice: input.sellingPrice,
            purchasePrice: input.purchasePrice,
            currentStock: input.currentStock,
            lowStockThreshold: input.lowStockThreshold,
            taxRate: input.taxRate,
            updatedAt: now,
          })
          .where(
            and(
              eq(products.id, input.productId),
              eq(products.businessId, businessId),
              eq(products.isSystem, false),
            ),
          )
          .run();
      });
    } catch (error) {
      console.error("Failed to update product:", error);
  
      return {
        success: false,
        message: "Unable to update product. Please try again.",
      };
    }
  
    revalidatePath("/products");
  
    return {
      success: true,
      message: "Product updated successfully.",
    };
  }
  
  export async function setProductActive(
    productId: number,
    active: boolean,
  ) {
    const setup = await getSetupStatus();
  
    if (!setup.completed || !setup.businessId) {
      return {
        success: false,
        message: "Business setup is incomplete.",
      };
    }
  
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return { success: false, message: "Invalid product." };
    }
  
    if (typeof active !== "boolean") {
      return { success: false, message: "Invalid product status." };
    }
  
    const result = db
      .update(products)
      .set({
        active,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(products.id, productId),
          eq(products.businessId, setup.businessId),
          eq(products.isSystem, false),
        ),
      )
      .run();
  
    if (result.changes === 0) {
      return {
        success: false,
        message: "Product not found or could not be updated.",
      };
    }
  
    revalidatePath("/products");
  
    return {
      success: true,
      message: active
        ? "Product activated successfully."
        : "Product deactivated successfully.",
    };
  }
  