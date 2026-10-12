"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Printer, Trash2 } from "lucide-react";

import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PAYMENT_METHOD, PAYMENT_METHOD_OPTIONS } from "@/common";

import {
    addStockPurchasePayment,
    deleteStockPurchase,
    deleteStockPurchasePayment,
    getStockPurchaseDetail,
    updateStockPurchase,
    updateStockPurchasePayment,
} from "../actions";
import type { ProductOption, StockPurchaseDetail, SupplierOption } from "@/lib/types/stock-purchase";
import { STATUS_STYLES, formatDay, formatMoney } from "./stock-purchase-shared";
import { StockPurchaseForm } from "./stock-purchase-form";
import { StockPurchaseInvoicePreview } from "./stock-purchase-invoice-preview";

type PaymentDraft = {
    id: number | null;
    amount: string; // rupees as typed
    method: PAYMENT_METHOD;
    date: string;
    reference: string;
    notes: string;
};

const todayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const methodLabel = (method: string) =>
    PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;

interface Props {
    purchaseId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currency: string;
    suppliers: SupplierOption[];
    products: ProductOption[];
}

export function ViewStockPurchaseDialog({
    purchaseId, open, onOpenChange, currency, suppliers, products,
}: Props) {
    const router = useRouter();

    const [detail, setDetail] = useState<StockPurchaseDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [payment, setPayment] = useState<PaymentDraft | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deletePurchaseOpen, setDeletePurchaseOpen] = useState(false);
    const [deletingPurchase, setDeletingPurchase] = useState(false);
    const [deletePurchaseError, setDeletePurchaseError] = useState<string | null>(
        null,
    );
    const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);

    const load = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getStockPurchaseDetail(id);
            if (!result) setError("This purchase no longer exists.");
            setDetail(result);
        } catch {
            setError("Failed to load this purchase.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open || purchaseId === null) return;
        setEditing(false);
        setPayment(null);
        setPaymentError(null);
        setDetail(null);
        void load(purchaseId);
    }, [open, purchaseId, load]);

    async function refresh() {
        if (purchaseId !== null) await load(purchaseId);
        router.refresh();
    }

    const balance = detail ? detail.total - detail.paidAmount : 0;
    const status = detail ? (STATUS_STYLES[detail.paymentStatus] ?? STATUS_STYLES.UNPAID) : null;

    function startAddPayment() {
        setPaymentError(null);
        setPayment({
            id: null,
            amount: balance > 0 ? (balance / 100).toFixed(2) : "",
            method: "CASH",
            date: todayKey(),
            reference: "",
            notes: "",
        });
    }

    function startEditPayment(p: StockPurchaseDetail["payments"][number]) {
        setPaymentError(null);
        setPayment({
            id: p.id,
            amount: (p.amount / 100).toFixed(2),
            method: p.paymentMethod as PAYMENT_METHOD,
            date: p.paymentDate,
            reference: p.reference ?? "",
            notes: p.notes ?? "",
        });
    }

    async function savePayment() {
        if (!detail || !payment) return;

        setSaving(true);
        setPaymentError(null);

        const payload = {
            amount: Math.round((Number(payment.amount) || 0) * 100),
            method: payment.method,
            date: payment.date,
            reference: payment.reference,
            notes: payment.notes,
        };

        const result = payment.id
            ? await updateStockPurchasePayment(payment.id, payload)
            : await addStockPurchasePayment(detail.id, payload);

        setSaving(false);

        if (!result.success) {
            setPaymentError(result.error);
            return;
        }

        setPayment(null);
        await refresh();
    }

    async function confirmDelete() {
        if (deleteId === null) return;
        const id = deleteId;
        setDeleteId(null);

        const result = await deleteStockPurchasePayment(id);
        if (!result.success) {
            setPaymentError(result.error);
            return;
        }
        await refresh();
    }

    async function confirmDeletePurchase() {
        if (!detail || deletingPurchase) return;

        setDeletingPurchase(true);
        setDeletePurchaseError(null);

        try {
            const result = await deleteStockPurchase(detail.id);

            if (!result.success) {
                setDeletePurchaseError(result.error);
                return;
            }

            setDeletePurchaseOpen(false);
            onOpenChange(false);
            router.refresh();
        } finally {
            setDeletingPurchase(false);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className={cn(
                        "flex max-h-[90dvh] flex-col gap-0 p-0",
                        editing ? "sm:max-w-5xl" : "sm:max-w-3xl",
                    )}
                >
                    <DialogHeader className="shrink-0 border-b px-6 py-4">
                        <DialogTitle>
                            {detail
                                ? `Purchase ${detail.purchaseNumber || `PUR-${String(detail.id).padStart(5, "0")}`}`
                                : "Purchase"}
                        </DialogTitle>
                        <DialogDescription>
                            {editing ? "Edit the supplier, date and products." : "Details and payment history."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
                        {loading && !detail && (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

                        {detail && editing && (
                            <StockPurchaseForm
                                mode="edit"
                                suppliers={suppliers}
                                products={products}
                                initial={{
                                    supplierId: detail.supplierId,
                                    purchaseDate: detail.purchaseDate,
                                    purchaseNumber: detail.purchaseNumber ?? "",
                                    notes: detail.notes ?? "",
                                    items: detail.items.map((item) => ({
                                        productId: item.productId,
                                        quantity: item.quantity,
                                        unitPrice: item.unitPrice,
                                        taxRate: item.taxRate ?? 0,
                                    })),
                                }}
                                onCancel={() => setEditing(false)}
                                onSubmit={async (data) => {
                                    const result = await updateStockPurchase(detail.id, {
                                        supplierId: data.supplierId,
                                        purchaseDate: data.purchaseDate,
                                        purchaseNumber: data.purchaseNumber,
                                        notes: data.notes,
                                        items: data.items,
                                    });
                                    if (!result.success) throw new Error(result.error);
                                    setEditing(false);
                                    await refresh();
                                }}
                            />
                        )}

                        {detail && !editing && status && (
                            <>
                                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Supplier</dt>
                                        <dd className="font-medium">{detail.supplierName || "No supplier"}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Date</dt>
                                        <dd className="font-medium">{formatDay(detail.purchaseDate)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Status</dt>
                                        <dd>
                                            <Badge variant="outline" className={status.className}>{status.label}</Badge>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Total</dt>
                                        <dd className="font-semibold tabular-nums">{formatMoney(detail.total, currency)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Paid</dt>
                                        <dd className="font-medium tabular-nums">{formatMoney(detail.paidAmount, currency)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Balance</dt>
                                        <dd className={cn("font-medium tabular-nums", balance > 0 && "text-red-600")}>
                                            {formatMoney(balance, currency)}
                                        </dd>
                                    </div>
                                    {detail.notes && (
                                        <div className="col-span-2">
                                            <dt className="text-xs text-muted-foreground">Notes</dt>
                                            <dd>{detail.notes}</dd>
                                        </div>
                                    )}
                                </dl>

                                {/* Items */}
                                <div className="overflow-hidden rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="px-4">Product</TableHead>
                                                <TableHead className="px-4 text-right">Qty</TableHead>
                                                <TableHead className="px-4 text-right">Unit price</TableHead>
                                                <TableHead className="px-4 text-right">Tax</TableHead>
                                                <TableHead className="px-4 text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {detail.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="px-4 font-medium">{item.productName}</TableCell>
                                                    <TableCell className="px-4 text-right tabular-nums">
                                                        {item.quantity} {item.unit}
                                                    </TableCell>
                                                    <TableCell className="px-4 text-right tabular-nums">
                                                        {formatMoney(item.unitPrice, currency)}
                                                    </TableCell>
                                                    <TableCell className="px-4 text-right tabular-nums">{item.taxRate ?? 0}%</TableCell>
                                                    <TableCell className="px-4 text-right font-medium tabular-nums">
                                                        {formatMoney(item.total, currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Payments */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Payments ({detail.payments.length})</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={balance <= 0 || payment !== null}
                                            onClick={startAddPayment}
                                        >
                                            <Plus />
                                            Add payment
                                        </Button>
                                    </div>

                                    {payment && (
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <p className="text-sm font-medium">{payment.id ? "Edit payment" : "Add payment"}</p>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="pay-amount">Amount (₹)</Label>
                                                    <Input
                                                        id="pay-amount"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="tabular-nums"
                                                        value={payment.amount}
                                                        onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Method</Label>
                                                    <Select
                                                        value={payment.method}
                                                        onValueChange={(value) =>
                                                            setPayment({ ...payment, method: (value ?? "OTHER") as PAYMENT_METHOD })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select method">
                                                                {methodLabel(payment.method)}
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
                                                    <Label htmlFor="pay-date">Date</Label>
                                                    <Input
                                                        id="pay-date"
                                                        type="date"
                                                        max={todayKey()}
                                                        value={payment.date}
                                                        onChange={(e) => setPayment({ ...payment, date: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="pay-ref">Reference</Label>
                                                    <Input
                                                        id="pay-ref"
                                                        value={payment.reference}
                                                        onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
                                                        placeholder="Transaction ID or reference"
                                                    />
                                                </div>
                                            </div>

                                            {paymentError && <p role="alert" className="text-sm text-destructive">{paymentError}</p>}

                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={saving}
                                                    onClick={() => {
                                                        setPayment(null);
                                                        setPaymentError(null);
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button type="button" disabled={saving} onClick={() => void savePayment()}>
                                                    {saving && <Loader2 className="animate-spin" />}
                                                    Save payment
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {!payment && paymentError && (
                                        <p role="alert" className="text-sm text-destructive">{paymentError}</p>
                                    )}

                                    {detail.payments.length === 0 ? (
                                        <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed">
                                            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden rounded-lg border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="px-4">Date</TableHead>
                                                        <TableHead className="px-4">Method</TableHead>
                                                        <TableHead className="px-4">Reference</TableHead>
                                                        <TableHead className="px-4 text-right">Amount</TableHead>
                                                        <TableHead className="w-24 px-4" />
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {detail.payments.map((p) => (
                                                        <TableRow key={p.id}>
                                                            <TableCell className="px-4">{formatDay(p.paymentDate)}</TableCell>
                                                            <TableCell className="px-4">{methodLabel(p.paymentMethod)}</TableCell>
                                                            <TableCell className="px-4 text-muted-foreground">{p.reference || "-"}</TableCell>
                                                            <TableCell className="px-4 text-right font-medium tabular-nums">
                                                                {formatMoney(p.amount, currency)}
                                                            </TableCell>
                                                            <TableCell className="px-4">
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        aria-label="Edit payment"
                                                                        disabled={payment !== null}
                                                                        onClick={() => startEditPayment(p)}
                                                                    >
                                                                        <Pencil />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-destructive hover:text-destructive"
                                                                        aria-label="Delete payment"
                                                                        onClick={() => setDeleteId(p.id)}
                                                                    >
                                                                        <Trash2 />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    

             
{detail && (
  <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
    {/* Left: Delete button in edit mode */}
    <div>
      {editing && (
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setDeletePurchaseError(null);
            setDeletePurchaseOpen(true);
          }}
          disabled={deletingPurchase}
        >
          <Trash2 className="mr-2 size-4" />
          Delete purchase
        </Button>
      )}
    </div>

    {/* Right: Actions depend on the current mode */}
    <div className="flex shrink-0 justify-end gap-2">
      {editing ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setEditing(false)}
          disabled={deletingPurchase}
        >
          Cancel
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setInvoicePreviewOpen(true)}
          >
            <Printer className="mr-2 size-4" />
            Print Invoice
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            onClick={() => setEditing(true)}
          >
            <Pencil className="mr-2 size-4" />
            Edit purchase
          </Button>
        </>
      )}
    </div>
  </div>
)}

                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteId !== null} onOpenChange={(value) => !value && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The purchase balance and payment status will be recalculated. This can't be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep payment</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
                            Delete payment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={deletePurchaseOpen}
                onOpenChange={(value) => {
                    if (!deletingPurchase) {
                        setDeletePurchaseOpen(value);
                        if (!value) setDeletePurchaseError(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this purchase permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the purchase, its items, and its payment
                            history. Product stock will be reduced by the quantities in this
                            purchase. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deletePurchaseError && (
                        <p role="alert" className="text-sm text-destructive">
                            {deletePurchaseError}
                        </p>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingPurchase}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deletingPurchase}
                            onClick={(event) => {
                                event.preventDefault();
                                void confirmDeletePurchase();
                            }}
                        >
                            {deletingPurchase && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Delete purchase
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <StockPurchaseInvoicePreview
  purchaseId={purchaseId}
  open={invoicePreviewOpen}
  onOpenChange={setInvoicePreviewOpen}
/>
        </>
    );
}