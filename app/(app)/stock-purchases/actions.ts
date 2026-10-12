"use server";

import { and, asc, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import {
    products,
    stockPurchaseItems,
    stockPurchasePayments,
    stockPurchases,
    suppliers,
} from "@/lib/db/schema";
import { getSetupStatus } from "@/lib/db/business";

import type { ProductOption, StockPurchaseDetail, SupplierOption } from "@/lib/types/stock-purchase";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function requireBusinessId(): Promise<number> {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
        throw new Error("Complete your business setup first.");
    }

    return setup.businessId;
}

const cleanName = (value: string) => value.trim().replace(/\s+/g, " ");

/* -------------------------------------------------------------------------- */
/* Quick create: supplier                                                     */
/* -------------------------------------------------------------------------- */

export type CreateQuickSupplierInput = {
    name: string;
    phone: string;
};

export async function createQuickSupplier(
    input: CreateQuickSupplierInput,
): Promise<SupplierOption> {
    const businessId = await requireBusinessId();

    const name = cleanName(input.name ?? "");
    const phone = (input.phone ?? "").trim();

    if (!name) throw new Error("Supplier name is required.");
    if (name.length > 120) throw new Error("Supplier name is too long.");

    if (phone && !/^[0-9+()\-\s]{6,20}$/.test(phone)) {
        throw new Error("Enter a valid phone number.");
    }

    const duplicate = db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(
            and(
                eq(suppliers.businessId, businessId),
                sql`lower(${suppliers.name}) = ${name.toLowerCase()}`,
            ),
        )
        .get();

    if (duplicate) {
        throw new Error("A supplier with this name already exists.");
    }

    const now = new Date().toISOString();

    const created = db
        .insert(suppliers)
        .values({
            businessId,
            name,
            phone: phone || null,
            active: true,
            createdAt: now,
            updatedAt: now,
        })
        .returning({
            id: suppliers.id,
            name: suppliers.name,
            phone: suppliers.phone,
        })
        .get();

    revalidatePath("/suppliers");

    return created;
}

/* -------------------------------------------------------------------------- */
/* Quick create: product                                                      */
/* -------------------------------------------------------------------------- */

export type CreateQuickProductInput = {
    name: string;
    unit: string;
    /** Minor currency units (paise) */
    sellingPrice: number;
    /** Minor currency units (paise) */
    purchasePrice: number | null;
    /** Percentage, e.g. 18 */
    taxRate: number;
};

export async function createQuickProduct(
    input: CreateQuickProductInput,
): Promise<ProductOption> {
    const businessId = await requireBusinessId();

    const name = cleanName(input.name ?? "");
    const unit = (input.unit ?? "").trim();

    if (!name) throw new Error("Product name is required.");
    if (name.length > 120) throw new Error("Product name is too long.");
    if (!unit) throw new Error("Select a unit.");

    if (!Number.isSafeInteger(input.sellingPrice) || input.sellingPrice < 0) {
        throw new Error("Enter a valid selling price.");
    }

    if (
        input.purchasePrice !== null &&
        (!Number.isSafeInteger(input.purchasePrice) || input.purchasePrice < 0)
    ) {
        throw new Error("Enter a valid purchase price.");
    }

    if (
        !Number.isFinite(input.taxRate) ||
        input.taxRate < 0 ||
        input.taxRate > 100
    ) {
        throw new Error("Tax must be between 0 and 100.");
    }

    const duplicate = db
        .select({ id: products.id })
        .from(products)
        .where(
            and(
                eq(products.businessId, businessId),
                sql`lower(${products.name}) = ${name.toLowerCase()}`,
            ),
        )
        .get();

    if (duplicate) {
        throw new Error("A product with this name already exists.");
    }

    const now = new Date().toISOString();

    const created = db
        .insert(products)
        .values({
            businessId,
            name,
            unit,
            sellingPrice: input.sellingPrice,
            purchasePrice: input.purchasePrice,
            taxRate: input.taxRate,
            currentStock: 0,
            active: true,
            isSystem: false,
            createdAt: now,
            updatedAt: now,
        })
        .returning({
            id: products.id,
            name: products.name,
            unit: products.unit,
            purchasePrice: products.purchasePrice,
            taxRate: products.taxRate,
            currentStock: products.currentStock,
        })
        .get();

    revalidatePath("/products");

    return created;
}

/* -------------------------------------------------------------------------- */
/* Create stock purchase                                                      */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ActionResult = { success: true } | { success: false; error: string };

// Errors thrown from server actions can lose their message in production,
// so these actions return the message as data instead.
async function run(fn: () => void | Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

const isDateKey = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00`));

type ItemInput = {
  productId: number;
  quantity: number;
  unitPrice: number; // paise
  taxRate: number;
};

function normalizeItems(items: ItemInput[]) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Add at least one product to the purchase.");
  }

  const lines = items.map((item) => {
    if (
      !Number.isSafeInteger(item.productId) ||
      item.productId <= 0 ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      !Number.isSafeInteger(item.unitPrice) ||
      item.unitPrice < 0 ||
      !Number.isFinite(item.taxRate) ||
      item.taxRate < 0
    ) {
      throw new Error("One or more purchase items have invalid values.");
    }

    const subtotal = Math.round(item.quantity * item.unitPrice);
    const tax = Math.round((subtotal * item.taxRate) / 100);

    if (!Number.isSafeInteger(subtotal + tax)) {
      throw new Error("A purchase item total is too large.");
    }

    return { ...item, subtotal, tax, total: subtotal + tax };
  });

  const ids = lines.map((line) => line.productId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Each product can only be added once per purchase.");
  }

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const tax = lines.reduce((sum, line) => sum + line.tax, 0);
  const total = subtotal + tax;

  if (!Number.isSafeInteger(total)) {
    throw new Error("The purchase total is too large.");
  }

  return { lines, subtotal, tax, total };
}

function assertSupplier(businessId: number, supplierId: number | null) {
  if (supplierId === null) return;

  if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
    throw new Error("Invalid supplier.");
  }

  const supplier = db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(
      and(
        eq(suppliers.id, supplierId),
        eq(suppliers.businessId, businessId),
        eq(suppliers.active, true),
      ),
    )
    .get();

  if (!supplier) throw new Error("The selected supplier is unavailable.");
}

function statusFor(total: number, paid: number): "UNPAID" | "PARTIAL" | "PAID" {
  if (paid <= 0) return "UNPAID";
  return paid >= total ? "PAID" : "PARTIAL";
}

function paidSoFar(tx: Tx, purchaseId: number, excludePaymentId?: number) {
  const row = tx
    .select({ paid: sql<number>`coalesce(sum(${stockPurchasePayments.amount}), 0)` })
    .from(stockPurchasePayments)
    .where(
      and(
        eq(stockPurchasePayments.purchaseId, purchaseId),
        excludePaymentId ? ne(stockPurchasePayments.id, excludePaymentId) : undefined,
      ),
    )
    .get();

  return row?.paid ?? 0;
}

/** Recompute UNPAID / PARTIAL / PAID from the payment rows. */
function syncStatus(tx: Tx, purchaseId: number) {
  const purchase = tx
    .select({ total: stockPurchases.total })
    .from(stockPurchases)
    .where(eq(stockPurchases.id, purchaseId))
    .get();

  if (!purchase) return;

  tx.update(stockPurchases)
    .set({
      paymentStatus: statusFor(purchase.total, paidSoFar(tx, purchaseId)),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(stockPurchases.id, purchaseId))
    .run();
}

function revalidateAll() {
  revalidatePath("/stock-purchases");
  revalidatePath("/products");
}

/* -------------------------------------------------------------------------- */
/* Create stock purchase (first payment is recorded as a payment row)         */
/* -------------------------------------------------------------------------- */

export type CreateStockPurchaseInput = {
  supplierId: number | null;
  purchaseDate: string;
  purchaseNumber: string;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  paymentMethod: string;
  paymentReference: string;
  paymentAmount: number; // paise, used for PARTIAL
  notes: string;
  items: ItemInput[];
};

export async function createStockPurchase(
    input: CreateStockPurchaseInput,
  ): Promise<ActionResult>{
    return run(async () => {
  const businessId = await requireBusinessId();

  if (!isDateKey(input.purchaseDate)) {
    throw new Error("Please provide a valid purchase date.");
  }
  if (!["UNPAID", "PARTIAL", "PAID"].includes(input.paymentStatus)) {
    throw new Error("Invalid payment status.");
  }

  assertSupplier(businessId, input.supplierId);

  const { lines, subtotal, tax, total } = normalizeItems(input.items);

  let paid = 0;
  if (input.paymentStatus === "PAID") {
    paid = total;
  } else if (input.paymentStatus === "PARTIAL") {
    if (
      !Number.isSafeInteger(input.paymentAmount) ||
      input.paymentAmount <= 0 ||
      input.paymentAmount >= total
    ) {
      throw new Error("A partial payment must be more than zero and less than the total.");
    }
    paid = input.paymentAmount;
  }

  db.transaction((tx) => {
    const resolved = lines.map((line) => {
      const product = tx
        .select({ id: products.id, name: products.name, unit: products.unit })
        .from(products)
        .where(
          and(
            eq(products.id, line.productId),
            eq(products.businessId, businessId),
            eq(products.active, true),
            eq(products.isSystem, false),
          ),
        )
        .get();

      if (!product) {
        throw new Error("A selected product is unavailable. Refresh the page and try again.");
      }

      return { ...line, productName: product.name, unit: product.unit };
    });

    const now = new Date().toISOString();

    const purchase = tx
      .insert(stockPurchases)
      .values({
        businessId,
        supplierId: input.supplierId,
        purchaseDate: input.purchaseDate,
        purchaseNumber: input.purchaseNumber.trim() || null,
        subtotal,
        tax,
        total,
        paymentStatus: statusFor(total, paid),
        notes: input.notes.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: stockPurchases.id })
      .get();

    if (paid > 0) {
      tx.insert(stockPurchasePayments)
        .values({
          businessId,
          purchaseId: purchase.id,
          amount: paid,
          paymentMethod: input.paymentMethod.trim() || "OTHER",
          paymentDate: input.purchaseDate,
          reference: input.paymentReference.trim() || null,
          notes: null,
          createdAt: now,
        })
        .run();
    }

    for (const item of resolved) {
      tx.insert(stockPurchaseItems)
        .values({
          purchaseId: purchase.id,
          productId: item.productId,
          productName: item.productName,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          total: item.total,
          createdAt: now,
        })
        .run();

      tx.update(products)
        .set({
          currentStock: sql`${products.currentStock} + ${item.quantity}`,
          purchasePrice: item.unitPrice,
          updatedAt: now,
        })
        .where(and(eq(products.id, item.productId), eq(products.businessId, businessId)))
        .run();
    }
  });

  revalidateAll();
});
}

/* -------------------------------------------------------------------------- */
/* Read one purchase (for the view / edit dialog)                             */
/* -------------------------------------------------------------------------- */

export async function getStockPurchaseDetail(
  purchaseId: number,
): Promise<StockPurchaseDetail | null> {
  const businessId = await requireBusinessId();

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
      notes: stockPurchases.notes,
    })
    .from(stockPurchases)
    .leftJoin(suppliers, eq(suppliers.id, stockPurchases.supplierId))
    .where(and(eq(stockPurchases.id, purchaseId), eq(stockPurchases.businessId, businessId)))
    .get();

  if (!purchase) return null;

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
    .orderBy(asc(stockPurchaseItems.id))
    .all();

  const payments = db
    .select({
      id: stockPurchasePayments.id,
      amount: stockPurchasePayments.amount,
      paymentMethod: stockPurchasePayments.paymentMethod,
      paymentDate: stockPurchasePayments.paymentDate,
      reference: stockPurchasePayments.reference,
      notes: stockPurchasePayments.notes,
    })
    .from(stockPurchasePayments)
    .where(eq(stockPurchasePayments.purchaseId, purchaseId))
    .orderBy(asc(stockPurchasePayments.paymentDate), asc(stockPurchasePayments.id))
    .all();

  return {
    ...purchase,
    paidAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
    items,
    payments,
  };
}

/* -------------------------------------------------------------------------- */
/* Edit purchase (supplier, date, number, notes, items)                       */
/* -------------------------------------------------------------------------- */

export type UpdateStockPurchaseInput = {
  supplierId: number | null;
  purchaseDate: string;
  purchaseNumber: string;
  notes: string;
  items: ItemInput[];
};

export async function updateStockPurchase(
  purchaseId: number,
  input: UpdateStockPurchaseInput,
): Promise<ActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();

    if (!Number.isSafeInteger(purchaseId) || purchaseId <= 0) {
      throw new Error("Invalid purchase.");
    }
    if (!isDateKey(input.purchaseDate)) {
      throw new Error("Please provide a valid purchase date.");
    }

    assertSupplier(businessId, input.supplierId);
    const { lines, subtotal, tax, total } = normalizeItems(input.items);

    db.transaction((tx) => {
      const existing = tx
        .select({ id: stockPurchases.id })
        .from(stockPurchases)
        .where(and(eq(stockPurchases.id, purchaseId), eq(stockPurchases.businessId, businessId)))
        .get();

      if (!existing) throw new Error("Purchase not found.");

      const paid = paidSoFar(tx, purchaseId);
      if (total < paid) {
        throw new Error(
          `The new total is less than the ₹${(paid / 100).toFixed(2)} already paid. Edit or remove a payment first.`,
        );
      }

      const oldItems = tx
        .select({ productId: stockPurchaseItems.productId, quantity: stockPurchaseItems.quantity })
        .from(stockPurchaseItems)
        .where(eq(stockPurchaseItems.purchaseId, purchaseId))
        .all();

      const oldQty = new Map(oldItems.map((item) => [item.productId, item.quantity]));
      const newQty = new Map(lines.map((line) => [line.productId, line.quantity]));
      const now = new Date().toISOString();

      const resolved = lines.map((line) => {
        const product = tx
          .select({
            id: products.id,
            name: products.name,
            unit: products.unit,
            active: products.active,
          })
          .from(products)
          .where(
            and(
              eq(products.id, line.productId),
              eq(products.businessId, businessId),
              eq(products.isSystem, false),
            ),
          )
          .get();

        // A product already on this purchase stays editable even if deactivated later
        if (!product || (!product.active && !oldQty.has(line.productId))) {
          throw new Error("A selected product is unavailable. Refresh the page and try again.");
        }

        return { ...line, productName: product.name, unit: product.unit };
      });

      tx.delete(stockPurchaseItems).where(eq(stockPurchaseItems.purchaseId, purchaseId)).run();

      for (const item of resolved) {
        tx.insert(stockPurchaseItems)
          .values({
            purchaseId,
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: item.total,
            createdAt: now,
          })
          .run();
      }

      // Apply only the stock difference for each product
      for (const productId of new Set([...oldQty.keys(), ...newQty.keys()])) {
        const delta = (newQty.get(productId) ?? 0) - (oldQty.get(productId) ?? 0);
        if (delta === 0) continue;

        tx.update(products)
          .set({ currentStock: sql`${products.currentStock} + ${delta}`, updatedAt: now })
          .where(and(eq(products.id, productId), eq(products.businessId, businessId)))
          .run();

        const row = tx
          .select({ stock: products.currentStock })
          .from(products)
          .where(eq(products.id, productId))
          .get();

        if (row && row.stock < -1e-9) {
          throw new Error(
            "This change would make a product's stock negative (some of it may already be sold).",
          );
        }
      }

      tx.update(stockPurchases)
        .set({
          supplierId: input.supplierId,
          purchaseDate: input.purchaseDate,
          purchaseNumber: input.purchaseNumber.trim() || null,
          subtotal,
          tax,
          total,
          paymentStatus: statusFor(total, paid),
          notes: input.notes.trim() || null,
          updatedAt: now,
        })
        .where(eq(stockPurchases.id, purchaseId))
        .run();
    });

    revalidateAll();
  });
}

/* -------------------------------------------------------------------------- */
/* Payments: add / edit / delete                                              */
/* -------------------------------------------------------------------------- */

export type StockPurchasePaymentInput = {
  amount: number; // paise
  method: string;
  date: string; // yyyy-MM-dd
  reference: string;
  notes: string;
};

function cleanPayment(input: StockPurchasePaymentInput) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error("Enter a payment amount greater than zero.");
  }
  if (!isDateKey(input.date)) {
    throw new Error("Please provide a valid payment date.");
  }

  return {
    amount: input.amount,
    paymentMethod: input.method.trim() || "OTHER",
    paymentDate: input.date,
    reference: input.reference.trim() || null,
    notes: input.notes.trim() || null,
  };
}

export async function addStockPurchasePayment(
  purchaseId: number,
  input: StockPurchasePaymentInput,
): Promise<ActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();
    const payment = cleanPayment(input);

    db.transaction((tx) => {
      const purchase = tx
        .select({ id: stockPurchases.id, total: stockPurchases.total })
        .from(stockPurchases)
        .where(and(eq(stockPurchases.id, purchaseId), eq(stockPurchases.businessId, businessId)))
        .get();

      if (!purchase) throw new Error("Purchase not found.");

      const balance = purchase.total - paidSoFar(tx, purchaseId);
      if (payment.amount > balance) {
        throw new Error(`Payment is more than the balance of ₹${(balance / 100).toFixed(2)}.`);
      }

      tx.insert(stockPurchasePayments)
        .values({
          businessId,
          purchaseId,
          ...payment,
          createdAt: new Date().toISOString(),
        })
        .run();

      syncStatus(tx, purchaseId);
    });

    revalidateAll();
  });
}

export async function updateStockPurchasePayment(
  paymentId: number,
  input: StockPurchasePaymentInput,
): Promise<ActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();
    const payment = cleanPayment(input);

    db.transaction((tx) => {
      const existing = tx
        .select({ id: stockPurchasePayments.id, purchaseId: stockPurchasePayments.purchaseId })
        .from(stockPurchasePayments)
        .where(
          and(
            eq(stockPurchasePayments.id, paymentId),
            eq(stockPurchasePayments.businessId, businessId),
          ),
        )
        .get();

      if (!existing) throw new Error("Payment not found.");

      const purchase = tx
        .select({ total: stockPurchases.total })
        .from(stockPurchases)
        .where(eq(stockPurchases.id, existing.purchaseId))
        .get();

      if (!purchase) throw new Error("Purchase not found.");

      const others = paidSoFar(tx, existing.purchaseId, paymentId);
      const allowed = purchase.total - others;
      if (payment.amount > allowed) {
        throw new Error(`Payment is more than the balance of ₹${(allowed / 100).toFixed(2)}.`);
      }

      tx.update(stockPurchasePayments).set(payment).where(eq(stockPurchasePayments.id, paymentId)).run();
      syncStatus(tx, existing.purchaseId);
    });

    revalidateAll();
  });
}

export async function deleteStockPurchasePayment(paymentId: number): Promise<ActionResult> {
  return run(async () => {
    const businessId = await requireBusinessId();

    db.transaction((tx) => {
      const existing = tx
        .select({ purchaseId: stockPurchasePayments.purchaseId })
        .from(stockPurchasePayments)
        .where(
          and(
            eq(stockPurchasePayments.id, paymentId),
            eq(stockPurchasePayments.businessId, businessId),
          ),
        )
        .get();

      if (!existing) throw new Error("Payment not found.");

      tx.delete(stockPurchasePayments).where(eq(stockPurchasePayments.id, paymentId)).run();
      syncStatus(tx, existing.purchaseId);
    });

    revalidateAll();
  });
}



export async function deleteStockPurchase(
    purchaseId: number,
  ): Promise<ActionResult> {
    return run(async () => {
      const businessId = await requireBusinessId();
  
      if (!Number.isSafeInteger(purchaseId) || purchaseId <= 0) {
        throw new Error("Invalid purchase.");
      }
  
      db.transaction((tx) => {
        const purchase = tx
          .select({ id: stockPurchases.id })
          .from(stockPurchases)
          .where(
            and(
              eq(stockPurchases.id, purchaseId),
              eq(stockPurchases.businessId, businessId),
            ),
          )
          .get();
  
        if (!purchase) {
          throw new Error("Purchase not found.");
        }
  
        const items = tx
          .select({
            productId: stockPurchaseItems.productId,
            quantity: stockPurchaseItems.quantity,
          })
          .from(stockPurchaseItems)
          .where(eq(stockPurchaseItems.purchaseId, purchaseId))
          .all();
  
        // Combine duplicate product lines before validating stock.
        const quantities = new Map<number, number>();
  
        for (const item of items) {
          quantities.set(
            item.productId,
            (quantities.get(item.productId) ?? 0) + item.quantity,
          );
        }
  
        // Validate every product before changing any stock.
        for (const [productId, quantity] of quantities) {
          const product = tx
            .select({ currentStock: products.currentStock })
            .from(products)
            .where(
              and(
                eq(products.id, productId),
                eq(products.businessId, businessId),
              ),
            )
            .get();
  
          if (!product) {
            throw new Error(
              "A product associated with this purchase could not be found.",
            );
          }
  
          if (product.currentStock - quantity < -1e-9) {
            throw new Error(
              "This purchase cannot be deleted because some purchased stock may already have been sold or used.",
            );
          }
        }
  
        const now = new Date().toISOString();
  
        for (const [productId, quantity] of quantities) {
          tx.update(products)
            .set({
              currentStock: sql`${products.currentStock} - ${quantity}`,
              updatedAt: now,
            })
            .where(
              and(
                eq(products.id, productId),
                eq(products.businessId, businessId),
              ),
            )
            .run();
        }
  
        // Requires SQLite foreign-key cascades to be enabled.
        tx.delete(stockPurchases)
          .where(
            and(
              eq(stockPurchases.id, purchaseId),
              eq(stockPurchases.businessId, businessId),
            ),
          )
          .run();
      });
  
      revalidateAll();
    });
  }
  
  