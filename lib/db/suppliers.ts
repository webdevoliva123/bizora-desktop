
import { and, asc, desc, eq, getTableColumns, inArray, like, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { stockPurchaseItems, stockPurchasePayments, stockPurchases, suppliers } from "@/lib/db/schema";
import { SupplierListItem, SupplierPurchase } from "../types/supplier";

export type SupplierInput = {
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  taxRegistrationNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  active?: boolean;
};

function clean(value?: string | null) {
  return value?.trim() || null;
}

export function getSuppliers(
  businessId: number,
  search = "",
  includeInactive = true,
) {
  const query = search.trim();

  const conditions = [
    eq(suppliers.businessId, businessId),
    ...(includeInactive ? [] : [eq(suppliers.active, true)]),
    ...(query
      ? [
          or(
            like(suppliers.name, `%${query}%`),
            like(suppliers.contactPerson, `%${query}%`),
            like(suppliers.phone, `%${query}%`),
            like(suppliers.email, `%${query}%`),
          )!,
        ]
      : []),
  ];

  return db
    .select()
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(desc(suppliers.active), asc(suppliers.name))
    .all();
}

export function getSupplierById(
  businessId: number,
  supplierId: number,
) {
  return db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.id, supplierId),
        eq(suppliers.businessId, businessId),
      ),
    )
    .get();
}

export function createSupplier(
  businessId: number,
  input: SupplierInput,
) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Supplier name is required.");
  }

  const now = new Date().toISOString();

  const result = db
    .insert(suppliers)
    .values({
      businessId,
      name,
      contactPerson: clean(input.contactPerson),
      phone: clean(input.phone),
      email: clean(input.email)?.toLowerCase() ?? null,
      taxRegistrationNumber: clean(input.taxRegistrationNumber),
      address: clean(input.address),
      city: clean(input.city),
      state: clean(input.state),
      postalCode: clean(input.postalCode),
      notes: clean(input.notes),
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return getSupplierById(businessId, Number(result.lastInsertRowid));
}

export function updateSupplier(
  businessId: number,
  supplierId: number,
  input: SupplierInput,
) {
  const existing = getSupplierById(businessId, supplierId);

  if (!existing) return undefined;

  const name = input.name.trim();

  if (!name) {
    throw new Error("Supplier name is required.");
  }

  db.update(suppliers)
    .set({
      name,
      contactPerson: clean(input.contactPerson),
      phone: clean(input.phone),
      email: clean(input.email)?.toLowerCase() ?? null,
      taxRegistrationNumber: clean(input.taxRegistrationNumber),
      address: clean(input.address),
      city: clean(input.city),
      state: clean(input.state),
      postalCode: clean(input.postalCode),
      notes: clean(input.notes),
      active: input.active ?? existing.active,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(suppliers.id, supplierId),
        eq(suppliers.businessId, businessId),
      ),
    )
    .run();

  return getSupplierById(businessId, supplierId);
}

export function deleteSupplier(
  businessId: number,
  supplierId: number,
) {
  const existing = getSupplierById(businessId, supplierId);

  if (!existing) {
    return { success: false as const, reason: "not_found" as const };
  }

  const linkedPurchase = db
    .select({ id: stockPurchases.id })
    .from(stockPurchases)
    .where(
      and(
        eq(stockPurchases.businessId, businessId),
        eq(stockPurchases.supplierId, supplierId),
      ),
    )
    .get();

  if (linkedPurchase) {
    return {
      success: false as const,
      reason: "has_purchases" as const,
    };
  }

  db.delete(suppliers)
    .where(
      and(
        eq(suppliers.id, supplierId),
        eq(suppliers.businessId, businessId),
      ),
    )
    .run();

  return { success: true as const };
}


export function getSuppliersWithStats(businessId: number): SupplierListItem[] {
    return db
      .select({
        ...getTableColumns(suppliers),
        purchaseCount: sql<number>`(select count(*) from stock_purchases sp where sp.supplier_id = suppliers.id)`,
        totalAmount: sql<number>`coalesce((select sum(sp.total) from stock_purchases sp where sp.supplier_id = suppliers.id), 0)`,
        paidAmount: sql<number>`coalesce((select sum(spp.amount) from stock_purchase_payments spp inner join stock_purchases sp on sp.id = spp.purchase_id where sp.supplier_id = suppliers.id), 0)`,
      })
      .from(suppliers)
      .where(eq(suppliers.businessId, businessId))
      .orderBy(desc(suppliers.active), asc(suppliers.name))
      .all();
  }
  
  export function getSupplierPurchases(
    businessId: number,
    supplierId: number,
  ): SupplierPurchase[] {
    const purchases = db
      .select({
        id: stockPurchases.id,
        purchaseNumber: stockPurchases.purchaseNumber,
        purchaseDate: stockPurchases.purchaseDate,
        total: stockPurchases.total,
        paymentStatus: stockPurchases.paymentStatus,
      })
      .from(stockPurchases)
      .where(
        and(
          eq(stockPurchases.businessId, businessId),
          eq(stockPurchases.supplierId, supplierId),
        ),
      )
      .orderBy(desc(stockPurchases.purchaseDate), desc(stockPurchases.id))
      .all();
  
    if (purchases.length === 0) return [];
  
    const ids = purchases.map((purchase) => purchase.id);
  
    const items = db
      .select({
        id: stockPurchaseItems.id,
        purchaseId: stockPurchaseItems.purchaseId,
        productId: stockPurchaseItems.productId,
        productName: stockPurchaseItems.productName,
        unit: stockPurchaseItems.unit,
        quantity: stockPurchaseItems.quantity,
        total: stockPurchaseItems.total,
      })
      .from(stockPurchaseItems)
      .where(inArray(stockPurchaseItems.purchaseId, ids))
      .orderBy(asc(stockPurchaseItems.id))
      .all();
  
    const paid = db
      .select({
        purchaseId: stockPurchasePayments.purchaseId,
        paid: sql<number>`sum(${stockPurchasePayments.amount})`,
      })
      .from(stockPurchasePayments)
      .where(inArray(stockPurchasePayments.purchaseId, ids))
      .groupBy(stockPurchasePayments.purchaseId)
      .all();
  
    const paidMap = new Map(paid.map((row) => [row.purchaseId, row.paid]));
  
    return purchases.map((purchase) => ({
      ...purchase,
      paidAmount: paidMap.get(purchase.id) ?? 0,
      items: items
        .filter((item) => item.purchaseId === purchase.id)
        .map(({ purchaseId: _purchaseId, ...item }) => item),
    }));
  }