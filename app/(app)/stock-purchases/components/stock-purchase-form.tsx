"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { ProductOption, SupplierOption } from "@/lib/types/stock-purchase";
import { CreatableCombobox } from "./creatable-combobox";
import { QuickSupplierDialog } from "./quick-supplier-dialog";
import { QuickProductDialog } from "./quick-product-dialog";
import {
    PAYMENT_METHOD,
    PAYMENT_METHOD_OPTIONS,
    PAYMENT_OPTIONS,
    PAYMENT_STATUS,
} from "@/common";

type PaymentStatus = PAYMENT_STATUS;
type PaymentMethod = PAYMENT_METHOD;

const DEFAULT_PAYMENT_STATUS: PaymentStatus = "UNPAID";
const DEFAULT_PAYMENT_METHOD: PaymentMethod = "CASH";

type PurchaseItem = {
    rowId: string;
    productId: string;
    quantity: string;
    unitPrice: string;
    taxRate: string;
};

export type StockPurchaseFormData = {
    supplierId: number | null;
    purchaseDate: string;
    purchaseNumber: string;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    paymentReference: string;
    /** Paise. Amount paid now (0 when unpaid). */
    paymentAmount: number;
    notes: string;
    items: {
        productId: number;
        quantity: number;
        unitPrice: number; // paise
        taxRate: number;
    }[];
};

export type StockPurchaseFormInitial = {
    supplierId: number | null;
    purchaseDate: string;
    purchaseNumber: string;
    notes: string;
    items: {
        productId: number;
        quantity: number;
        unitPrice: number; // paise
        taxRate: number;
    }[];
};

type StockPurchaseFormProps = {
    mode?: "create" | "edit";
    initial?: StockPurchaseFormInitial;
    suppliers: SupplierOption[];
    products: ProductOption[];
    onCancel: () => void;
    onSubmit: (data: StockPurchaseFormData) => Promise<void>;
};

const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const newItem = (): PurchaseItem => ({
    rowId: `${Date.now()}-${Math.random()}`,
    productId: "",
    quantity: "1",
    unitPrice: "",
    taxRate: "0",
});

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount / 100);

const byName = <T extends { name: string }>(a: T, b: T) =>
    a.name.localeCompare(b.name);

/** Fill price + tax from a product, keeping what the user already typed if the product has none. */
function withProduct(item: PurchaseItem, product: ProductOption): PurchaseItem {
    return {
        ...item,
        productId: String(product.id),
        unitPrice:
            product.purchasePrice != null
                ? (product.purchasePrice / 100).toFixed(2)
                : item.unitPrice,
        taxRate: product.taxRate != null ? String(product.taxRate) : item.taxRate,
    };
}

const ITEM_GRID =
    "lg:grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_2.25rem]";

const paymentLabel = (status: PaymentStatus) =>
    PAYMENT_OPTIONS.find((option) => option.value === status)?.label ?? status;

const methodLabel = (method: PaymentMethod) =>
    PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
    method;

export function StockPurchaseForm({
    mode = "create",
    initial,
    suppliers,
    products,
    onCancel,
    onSubmit,
}: StockPurchaseFormProps) {
    const isEdit = mode === "edit";

    // Local copies so newly created suppliers/products show up instantly.
    const [supplierList, setSupplierList] = useState(suppliers);
    const [productList, setProductList] = useState(products);

    const [supplierId, setSupplierId] = useState(
        initial?.supplierId ? String(initial.supplierId) : "none",
    );
    const [purchaseDate, setPurchaseDate] = useState(
        initial?.purchaseDate?.slice(0, 10) ?? today(),
    );
    const [purchaseNumber, setPurchaseNumber] = useState(
        initial?.purchaseNumber ?? "",
    );
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
        DEFAULT_PAYMENT_STATUS,
    );
    const [paymentAmount, setPaymentAmount] = useState(""); // rupees, as typed
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
        DEFAULT_PAYMENT_METHOD,
    );
    const [paymentReference, setPaymentReference] = useState("");
    const [notes, setNotes] = useState(initial?.notes ?? "");
    const [items, setItems] = useState<PurchaseItem[]>(() =>
        initial && initial.items.length > 0
            ? initial.items.map((item) => ({
                  rowId: `${Date.now()}-${Math.random()}`,
                  productId: String(item.productId),
                  quantity: String(item.quantity),
                  unitPrice: (item.unitPrice / 100).toFixed(2),
                  taxRate: String(item.taxRate),
              }))
            : [newItem()],
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [supplierDialog, setSupplierDialog] = useState({
        open: false,
        name: "",
    });
    const [productDialog, setProductDialog] = useState<{
        open: boolean;
        name: string;
        rowId: string | null;
    }>({ open: false, name: "", rowId: null });

    const paymentLocked = paymentStatus === "UNPAID";

    const calculated = useMemo(() => {
        return items.map((item) => {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Math.round((Number(item.unitPrice) || 0) * 100);
            const taxRate = Number(item.taxRate) || 0;

            const subtotal = Math.round(quantity * unitPrice);
            const tax = Math.round((subtotal * taxRate) / 100);

            return { subtotal, tax, total: subtotal + tax };
        });
    }, [items]);

    const subtotal = calculated.reduce((sum, line) => sum + line.subtotal, 0);
    const taxTotal = calculated.reduce((sum, line) => sum + line.tax, 0);
    const grandTotal = subtotal + taxTotal;
    const filledLines = items.filter((item) => item.productId).length;

    /* ---- Payment (paise). PAID is derived from the total so it never goes stale. ---- */
    const enteredPaise = Math.round((Number(paymentAmount) || 0) * 100);

    const paidPaise =
        paymentStatus === "PAID"
            ? grandTotal
            : paymentStatus === "PARTIAL"
              ? enteredPaise
              : 0;

    const balancePaise = Math.max(grandTotal - paidPaise, 0);

    let partialError: string | null = null;
    if (paymentStatus === "PARTIAL" && paymentAmount !== "" && grandTotal > 0) {
        if (enteredPaise <= 0) {
            partialError = "Enter an amount greater than zero.";
        } else if (enteredPaise >= grandTotal) {
            partialError =
                "Must be less than the total. Choose Paid for a full payment.";
        }
    }

    function updateItem(
        rowId: string,
        field: keyof Omit<PurchaseItem, "rowId">,
        value: string,
    ) {
        setItems((current) =>
            current.map((item) => {
                if (item.rowId !== rowId) return item;

                if (field === "productId") {
                    const product = productList.find(
                        (candidate) => String(candidate.id) === value,
                    );
                    return product
                        ? withProduct(item, product)
                        : { ...item, productId: value };
                }

                return { ...item, [field]: value };
            }),
        );
    }

    function handleSupplierCreated(supplier: SupplierOption) {
        setSupplierList((current) => [...current, supplier].sort(byName));
        setSupplierId(String(supplier.id));
    }

    function handleProductCreated(product: ProductOption) {
        setProductList((current) => [...current, product].sort(byName));

        const rowId = productDialog.rowId;
        if (rowId) {
            setItems((current) =>
                current.map((item) =>
                    item.rowId === rowId ? withProduct(item, product) : item,
                ),
            );
        }
    }

    function handlePaymentStatusChange(status: PaymentStatus) {
        setPaymentStatus(status);
        if (status !== "PARTIAL") setPaymentAmount("");
        if (status === "UNPAID") {
            setPaymentMethod("OTHER");
            setPaymentReference("");
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const selectedItems = items.filter((item) => item.productId);

        if (!selectedItems.length) {
            setError("Add at least one product to the purchase.");
            return;
        }

        const invalid = selectedItems.some(
            (item) =>
                item.quantity.trim() === "" ||
                item.unitPrice.trim() === "" ||
                !Number.isFinite(Number(item.quantity)) ||
                Number(item.quantity) <= 0 ||
                !Number.isFinite(Number(item.unitPrice)) ||
                Number(item.unitPrice) < 0 ||
                !Number.isFinite(Number(item.taxRate)) ||
                Number(item.taxRate) < 0,
        );

        if (invalid) {
            setError("Check the quantity, price and tax on each product.");
            return;
        }

        if (
            !isEdit &&
            paymentStatus === "PARTIAL" &&
            (enteredPaise <= 0 || enteredPaise >= grandTotal)
        ) {
            setError("Enter a partial amount that is less than the total.");
            return;
        }

        setSaving(true);

        try {
            await onSubmit({
                supplierId: supplierId === "none" ? null : Number(supplierId),
                purchaseDate,
                purchaseNumber: purchaseNumber.trim(),
                // In edit mode payments are managed from the view dialog
                paymentStatus: isEdit ? "UNPAID" : paymentStatus,
                paymentMethod:
                    isEdit || paymentMethod === "OTHER" ? "" : paymentMethod,
                paymentReference: isEdit ? "" : paymentReference.trim(),
                paymentAmount: isEdit ? 0 : paidPaise,
                notes: notes.trim(),
                items: selectedItems.map((item) => ({
                    productId: Number(item.productId),
                    quantity: Number(item.quantity),
                    unitPrice: Math.round(Number(item.unitPrice) * 100),
                    taxRate: Number(item.taxRate),
                })),
            });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save purchase.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start"
            >
                {/* ------------------------------ Main column ------------------------------ */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier & invoice</CardTitle>
                            <CardDescription>
                                Who you bought from and when.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                    <Label htmlFor="supplier">Supplier</Label>
                                    <CreatableCombobox
                                        id="supplier"
                                        value={supplierId}
                                        onValueChange={setSupplierId}
                                        noneOption={{ value: "none", label: "No supplier" }}
                                        options={supplierList.map((supplier) => ({
                                            value: String(supplier.id),
                                            label: supplier.name,
                                            hint: supplier.phone ?? undefined,
                                        }))}
                                        placeholder="Select supplier"
                                        searchPlaceholder="Search suppliers..."
                                        emptyText="No supplier found."
                                        createLabel="Create new supplier"
                                        onCreate={(name) =>
                                            setSupplierDialog({ open: true, name })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purchaseDate">Purchase date</Label>
                                    <Input
                                        id="purchaseDate"
                                        type="date"
                                        required
                                        value={purchaseDate}
                                        onChange={(event) => setPurchaseDate(event.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purchaseNumber">Supplier invoice no.</Label>
                                    <Input
                                        id="purchaseNumber"
                                        value={purchaseNumber}
                                        onChange={(event) => setPurchaseNumber(event.target.value)}
                                        placeholder="e.g. INV-1001"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5">
                                    <CardTitle>Products</CardTitle>
                                    <CardDescription>
                                        Pick an existing product or create a new one from the list.
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setItems((current) => [...current, newItem()])}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Add row
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {/* Column headings (desktop only) */}
                            <div
                                className={`hidden gap-3 px-1 text-xs font-medium text-muted-foreground lg:grid ${ITEM_GRID}`}
                            >
                                <span>Product</span>
                                <span>Quantity</span>
                                <span>Unit price (₹)</span>
                                <span>Tax (%)</span>
                                <span className="text-right">Line total</span>
                                <span />
                            </div>

                            {items.map((item, index) => {
                                const product = productList.find(
                                    (candidate) => String(candidate.id) === item.productId,
                                );
                                const line = calculated[index];

                                // Don't offer products already used on another row.
                                const usedElsewhere = new Set(
                                    items
                                        .filter((other) => other.rowId !== item.rowId)
                                        .map((other) => other.productId),
                                );

                                return (
                                    <div
                                        key={item.rowId}
                                        className={`grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:items-start ${ITEM_GRID}`}
                                    >
                                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                                            <Label className="lg:sr-only">Product</Label>
                                            <CreatableCombobox
                                                value={item.productId}
                                                onValueChange={(value) =>
                                                    updateItem(item.rowId, "productId", value)
                                                }
                                                options={productList
                                                    .filter(
                                                        (option) => !usedElsewhere.has(String(option.id)),
                                                    )
                                                    .map((option) => ({
                                                        value: String(option.id),
                                                        label: option.name,
                                                        hint: `${option.unit} · stock ${option.currentStock}`,
                                                    }))}
                                                placeholder="Select product"
                                                searchPlaceholder="Search products..."
                                                emptyText="No product found."
                                                createLabel="Create new product"
                                                onCreate={(name) =>
                                                    setProductDialog({
                                                        open: true,
                                                        name,
                                                        rowId: item.rowId,
                                                    })
                                                }
                                            />
                                            {product && (
                                                <p className="text-xs text-muted-foreground">
                                                    In stock: {product.currentStock} {product.unit}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="lg:sr-only">
                                                Quantity{product ? ` (${product.unit})` : ""}
                                            </Label>
                                            <Input
                                                type="number"
                                                min="0.001"
                                                step="any"
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    updateItem(item.rowId, "quantity", event.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="lg:sr-only">Unit price (₹)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(event) =>
                                                    updateItem(item.rowId, "unitPrice", event.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="lg:sr-only">Tax (%)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={item.taxRate}
                                                onChange={(event) =>
                                                    updateItem(item.rowId, "taxRate", event.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end lg:pt-2">
                                            <span className="text-sm text-muted-foreground lg:hidden">
                                                Line total
                                            </span>
                                            <span className="text-sm font-semibold tabular-nums">
                                                {formatCurrency(line.total)}
                                            </span>
                                        </div>

                                        <div className="flex justify-end sm:col-span-2 lg:col-span-1">
                                            {items.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Remove row ${index + 1}`}
                                                    onClick={() =>
                                                        setItems((current) =>
                                                            current.filter((row) => row.rowId !== item.rowId),
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder="Anything worth remembering about this purchase..."
                                rows={3}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* ------------------------------ Side column ------------------------------ */}
                <aside className="space-y-6 lg:sticky lg:top-6">
                    {/* Payments in edit mode are managed in the view dialog */}
                    {!isEdit && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment</CardTitle>
                                <CardDescription>
                                    {paymentLocked
                                        ? "Amount, method and reference are available once something is paid."
                                        : "How this purchase was paid."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={paymentStatus}
                                        onValueChange={(value) =>
                                            handlePaymentStatusChange(
                                                (value ?? "UNPAID") as PaymentStatus,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select payment status">
                                                {paymentLabel(paymentStatus)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {paymentStatus !== "UNPAID" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentAmount">Amount paid (₹)</Label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                                                ₹
                                            </span>
                                            <Input
                                                id="paymentAmount"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="pl-7 tabular-nums"
                                                placeholder="0.00"
                                                disabled={paymentStatus === "PAID"}
                                                aria-invalid={partialError !== null}
                                                value={
                                                    paymentStatus === "PAID"
                                                        ? (grandTotal / 100).toFixed(2)
                                                        : paymentAmount
                                                }
                                                onChange={(event) =>
                                                    setPaymentAmount(event.target.value)
                                                }
                                            />
                                        </div>

                                        {partialError ? (
                                            <p className="text-xs text-destructive">
                                                {partialError}
                                            </p>
                                        ) : paymentStatus === "PAID" ? (
                                            <p className="text-xs text-muted-foreground">
                                                Paid purchases use the full total.
                                            </p>
                                        ) : (
                                            grandTotal > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    Total {formatCurrency(grandTotal)}
                                                    {enteredPaise > 0 &&
                                                        enteredPaise < grandTotal &&
                                                        ` · Balance ${formatCurrency(balancePaise)}`}
                                                </p>
                                            )
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Method</Label>
                                    <Select
                                        value={paymentMethod}
                                        disabled={paymentLocked}
                                        onValueChange={(value) =>
                                            setPaymentMethod((value ?? "OTHER") as PaymentMethod)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select method">
                                                {methodLabel(paymentMethod)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paymentReference">Reference</Label>
                                    <Input
                                        id="paymentReference"
                                        disabled={paymentLocked}
                                        value={paymentReference}
                                        onChange={(event) => setPaymentReference(event.target.value)}
                                        placeholder="Transaction ID or reference"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Products</span>
                                <span>{filledLines}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="tabular-nums">{formatCurrency(taxTotal)}</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between text-lg font-semibold">
                                <span>Total</span>
                                <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
                            </div>

                            {!isEdit && paymentStatus !== "UNPAID" && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Paid</span>
                                        <span className="tabular-nums">
                                            {formatCurrency(paidPaise)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Balance</span>
                                        <span
                                            className={cn(
                                                "tabular-nums",
                                                balancePaise > 0 && "text-red-600",
                                            )}
                                        >
                                            {formatCurrency(balancePaise)}
                                        </span>
                                    </div>
                                </>
                            )}

                            {error && (
                                <p role="alert" className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}

                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={saving || productList.length === 0}
                                >
                                    {saving
                                        ? "Saving..."
                                        : isEdit
                                          ? "Save changes"
                                          : "Save purchase"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </form>

            <QuickSupplierDialog
                open={supplierDialog.open}
                initialName={supplierDialog.name}
                onOpenChange={(open) =>
                    setSupplierDialog((current) => ({ ...current, open }))
                }
                onCreated={handleSupplierCreated}
            />

            <QuickProductDialog
                open={productDialog.open}
                initialName={productDialog.name}
                onOpenChange={(open) =>
                    setProductDialog((current) => ({ ...current, open }))
                }
                onCreated={handleProductCreated}
            />
        </>
    );
}