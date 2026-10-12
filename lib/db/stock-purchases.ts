
import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  products,
  stockPurchaseItems,
  stockPurchasePayments,
  stockPurchases,
  suppliers,
} from "@/lib/db/schema";
import { StockPurchaseListItem } from "../types/stock-purchase";

export function getStockPurchases(businessId: number): StockPurchaseListItem[] {
    return db
      .select({
        id: stockPurchases.id,
        purchaseNumber: stockPurchases.purchaseNumber,
        purchaseDate: stockPurchases.purchaseDate,
        supplierName: suppliers.name,
        total: stockPurchases.total,
        paymentStatus: stockPurchases.paymentStatus,
        paidAmount: sql<number>`coalesce((select sum(${stockPurchasePayments.amount}) from ${stockPurchasePayments} where ${stockPurchasePayments.purchaseId} = ${stockPurchases.id}), 0)`,
        paymentCount: sql<number>`(select count(*) from ${stockPurchasePayments} where ${stockPurchasePayments.purchaseId} = ${stockPurchases.id})`,
        itemCount: sql<number>`(select count(*) from ${stockPurchaseItems} where ${stockPurchaseItems.purchaseId} = ${stockPurchases.id})`,
      })
      .from(stockPurchases)
      .leftJoin(suppliers, eq(suppliers.id, stockPurchases.supplierId))
      .where(eq(stockPurchases.businessId, businessId))
      .orderBy(desc(stockPurchases.purchaseDate), desc(stockPurchases.id))
      .all();
  }

export function getStockPurchaseById(
  businessId: number,
  purchaseId: number,
) {
  const purchase = db
    .select({
      id: stockPurchases.id,
      supplierId: stockPurchases.supplierId,
      supplierName: suppliers.name,
      purchaseDate: stockPurchases.purchaseDate,
      purchaseNumber: stockPurchases.purchaseNumber,
      subtotal: stockPurchases.subtotal,
      tax: stockPurchases.tax,
      total: stockPurchases.total,
      paymentStatus: stockPurchases.paymentStatus,
      paymentMethod: stockPurchases.paymentMethod,
      paymentDate: stockPurchases.paymentDate,
      paymentReference: stockPurchases.paymentReference,
      notes: stockPurchases.notes,
    })
    .from(stockPurchases)
    .leftJoin(
      suppliers,
      eq(stockPurchases.supplierId, suppliers.id),
    )
    .where(
      and(
        eq(stockPurchases.id, purchaseId),
        eq(stockPurchases.businessId, businessId),
      ),
    )
    .get();

  if (!purchase) {
    return undefined;
  }

  const items = db
    .select({
      id: stockPurchaseItems.id,
      productId: stockPurchaseItems.productId,
      productName: stockPurchaseItems.productName,
      unit: stockPurchaseItems.unit,
      quantity: stockPurchaseItems.quantity,
      unitPrice: stockPurchaseItems.unitPrice,
      taxRate: stockPurchaseItems.taxRate,
      total: stockPurchaseItems.total,
    })
    .from(stockPurchaseItems)
    .where(eq(stockPurchaseItems.purchaseId, purchaseId))
    .all();

  return { ...purchase, items };
}

export function getActiveSuppliers(businessId: number) {
  return db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      phone: suppliers.phone,
    })
    .from(suppliers)
    .where(
      and(
        eq(suppliers.businessId, businessId),
        eq(suppliers.active, true),
      ),
    )
    .orderBy(asc(suppliers.name))
    .all();
}

export function getPurchasableProducts(businessId: number) {
  return db
    .select({
      id: products.id,
      name: products.name,
      unit: products.unit,
      purchasePrice: products.purchasePrice,
      taxRate: products.taxRate,
      currentStock: products.currentStock,
    })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.active, true),
        eq(products.isSystem, false),
      ),
    )
    .orderBy(asc(products.name))
    .all();
}

export function getStockPurchaseItemCount(purchaseId: number) {
  const items = db
    .select({ id: stockPurchaseItems.id })
    .from(stockPurchaseItems)
    .where(eq(stockPurchaseItems.purchaseId, purchaseId))
    .all();

  return items.length;
}
