// components/daily-entries/view-daily-entry-dialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Trash2,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import type { DailyEntryDetail } from "@/lib/types/daily-entry";
import {
  addDailyEntryPaymentAction,
  deleteDailyEntryAction,
  updateDailyEntryAction,
  updateQuickSaleAction,
} from "../actions";
import {
  DATE_KEY_PATTERN,
  PAYMENT_METHOD_OPTIONS,
  formatPaise,
  isPaymentMethod,
  methodLabel,
  todayKey,
  type PaymentMethod,
} from "./payment-options";
import { SearchSelect } from "./search-select";
import { DailyEntryBillPreview } from "@/app/(app)/daily-entries/components/daily-entry-bill-preview";

/* -------------------------------------------------------------------------- */
/* Types + helpers                                                            */
/* -------------------------------------------------------------------------- */

interface ViewDailyEntryDialogProps {
  entryId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Same lists you pass to AddDailyEntryDialog (needed for edit mode) */
  customers: { id: number; name: string }[];
  products: {
    id: number;
    name: string;
    unit: string;
    sellingPrice: number; // paise
    taxRate: number | null;
  }[];
}

type Mode = "view" | "edit" | "pay";
type LoadStatus = "idle" | "loading" | "success" | "error";
type PaymentType = DailyEntryDetail["paymentType"];
type PaymentStatus = DailyEntryDetail["paymentStatus"];
type PayKind = "FULL" | "PARTIAL";

interface EditItem {
  id: string;
  productId: number | null;
  quantity: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(date: string) {
  if (!date) return "-";

  const parsedDate = date.includes("T")
    ? new Date(date)
    : new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function getCustomerTypeLabel(type: DailyEntryDetail["customerType"]) {
  return type === "BUSINESS" ? "Business" : "Person";
}

/** "BANK_TRANSFER" -> "Bank transfer" */
function toLabel(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  IMMEDIATE: "Immediate",
  MONTHLY: "Monthly",
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  PAID: {
    label: "Paid",
    className: "border-transparent bg-emerald-100 text-emerald-700 ",
  },
  PARTIAL: {
    label: "Partial",
    className: "border-transparent bg-amber-100 text-amber-700 ",
  },
  UNPAID: {
    label: "Unpaid",
    className: "border-transparent bg-red-100 text-red-700 ",
  },
};

const MONTHLY_BADGE = "border-transparent bg-sky-100 text-sky-700 ";

const QUICK_SALE_BADGE =
  "border-emerald-200 bg-emerald-100 text-emerald-700";

function derivePaymentStatus(
  paymentType: PaymentType,
  paid: number,
  total: number,
): PaymentStatus {
  if (paymentType === "MONTHLY" || paid <= 0) return "UNPAID";
  return paid >= total ? "PAID" : "PARTIAL";
}

/* -------------------------------------------------------------------------- */
/* Small shared pieces                                                        */
/* -------------------------------------------------------------------------- */

function EntrySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading entry">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function Figures({
  total,
  paid,
  outstanding,
  highlightOutstanding,
}: {
  total: number;
  paid: number;
  outstanding: number;
  highlightOutstanding: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="mt-1 text-sm font-semibold tabular-nums sm:text-base">
          {formatCurrency(total)}
        </p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">Paid</p>
        <p className="mt-1 text-sm font-semibold tabular-nums sm:text-base">
          {formatCurrency(paid)}
        </p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">Outstanding</p>
        <p
          className={cn(
            "mt-1 text-sm font-semibold tabular-nums sm:text-base",
            highlightOutstanding && outstanding > 0 && "text-red-600 ",
          )}
        >
          {formatCurrency(outstanding)}
        </p>
      </div>
    </div>
  );
}

function RadioCards<T extends string>({
  idPrefix,
  label,
  value,
  onChange,
  options,
}: {
  idPrefix: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: {
    value: T;
    label: string;
    description: string;
    disabled?: boolean;
  }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label id={`${idPrefix}-label`}>{label}</Label>

      <RadioGroup
        aria-labelledby={`${idPrefix}-label`}
        value={value}
        onValueChange={(next) => {
          const match = options.find((option) => option.value === next);
          if (match && !match.disabled) onChange(match.value);
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {options.map((option) => (
          <Label
            key={option.value}
            htmlFor={`${idPrefix}-${option.value}`}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 font-normal transition-colors",
              option.disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-muted/40",
              "has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/5",
            )}
          >
            <RadioGroupItem
              id={`${idPrefix}-${option.value}`}
              value={option.value}
              disabled={option.disabled}
              className="mt-0.5"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </span>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick Sale edit form                                                       */
/* -------------------------------------------------------------------------- */

interface QuickSaleEditFormProps {
  amount: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  reference: string;
  notes: string;
  onAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onReferenceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

/**
 * A Quick Sale is always: Walk-in Customer, Quick Sale product, quantity 1,
 * Immediate, Paid. So the only editable things are the amount, how it was
 * paid, the payment reference and the notes.
 */
function QuickSaleEditForm({
  amount,
  amountPaise,
  paymentMethod,
  reference,
  notes,
  onAmountChange,
  onPaymentMethodChange,
  onReferenceChange,
  onNotesChange,
}: QuickSaleEditFormProps) {
  const selectedMethod = PAYMENT_METHOD_OPTIONS.find(
    (option) => option.value === paymentMethod,
  );

  const amountError =
    amount !== "" && amountPaise <= 0
      ? "Enter an amount greater than zero."
      : null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={QUICK_SALE_BADGE}>
            Quick Sale
          </Badge>
          <span className="text-sm text-muted-foreground">Walk-in sale</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Quick Sales are always immediate and fully paid.
        </p>
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="quick-sale-amount">Sale Amount</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            ₹
          </span>
          <Input
            id="quick-sale-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            className="pl-7 tabular-nums"
            placeholder="0.00"
            value={amount}
            aria-invalid={amountError !== null}
            onChange={(event) => onAmountChange(event.target.value)}
          />
        </div>
        {amountError && (
          <p className="text-xs text-destructive">{amountError}</p>
        )}
      </div>

      {/* Payment method */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="quick-sale-method">Payment Method</Label>
        <Select
          value={paymentMethod}
          onValueChange={(value) => {
            if (isPaymentMethod(value)) onPaymentMethodChange(value);
          }}
        >
          <SelectTrigger id="quick-sale-method" className="w-full">
            <SelectValue placeholder="Select payment method">
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

      {/* Reference */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="quick-sale-reference">
          Payment Reference{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="quick-sale-reference"
          value={reference}
          maxLength={100}
          onChange={(event) => onReferenceChange(event.target.value)}
          placeholder={selectedMethod?.referenceHint ?? "Optional"}
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="quick-sale-notes">
          Notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="quick-sale-notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Add any notes for this quick sale..."
          rows={3}
        />
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Sale Total</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatCurrency(amountPaise)}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <span className="text-sm text-muted-foreground">Payment Status</span>
          <Badge variant="outline" className={PAYMENT_STATUS.PAID.className}>
            Paid
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

export function ViewDailyEntryDialog({
  entryId,
  open,
  onOpenChange,
  customers,
  products,
}: ViewDailyEntryDialogProps) {
  const [entry, setEntry] = useState<DailyEntryDetail | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [reloadKey, setReloadKey] = useState(0);

  const [mode, setMode] = useState<Mode>("view");
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit mode (Customer Sale)
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [editPaymentType, setEditPaymentType] =
    useState<PaymentType>("IMMEDIATE");
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [editNotes, setEditNotes] = useState("");

  // Edit mode (Quick Sale)
  const [quickSaleAmount, setQuickSaleAmount] = useState("");
  const [quickSalePaymentMethod, setQuickSalePaymentMethod] =
    useState<PaymentMethod>("CASH");
  const [quickSaleReference, setQuickSaleReference] = useState("");
  const [quickSaleNotes, setQuickSaleNotes] = useState("");

  // Record payment mode
  const [payKind, setPayKind] = useState<PayKind>("FULL");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("CASH");
  const [payDate, setPayDate] = useState(todayKey);
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [billPreviewOpen, setBillPreviewOpen] = useState(false);

  /* ---- Always start in view mode for a new entry / re-open ---- */
  useEffect(() => {
    setMode("view");
    setActionError(null);
    setConfirmDelete(false);
  }, [open, entryId]);

  /* ---- Load the entry (aborts if the dialog closes or the id changes) ---- */
  useEffect(() => {
    if (!open || entryId === null) return;

    const controller = new AbortController();

    async function loadEntry() {
      setStatus("loading");

      try {
        const response = await fetch(`/api/daily-entries/${entryId}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Failed to load daily entry.");

        const data = (await response.json()) as DailyEntryDetail;

        setEntry(data);
        setStatus("success");
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Failed to load daily entry:", error);
        setStatus("error");
      }
    }

    loadEntry();

    return () => controller.abort();
  }, [open, entryId, reloadKey]);

  // Never show a previously loaded entry for a different id. After a save the
  // old entry stays on screen while the fresh one loads (no skeleton flash).
  const current = entry && entry.id === entryId ? entry : null;
  const showError = status === "error" && !current;
  const showLoading = !current && !showError;

  const isQuickSale = current?.isQuickSaleEntry === true;
  const isMonthly = current?.paymentType === "MONTHLY";
  const statusBadge = current ? PAYMENT_STATUS[current.paymentStatus] : null;
  const canRecordPayment =
    current !== null &&
    !isQuickSale &&
    current.paymentType === "IMMEDIATE" &&
    current.paymentStatus !== "PAID" &&
    current.outstandingAmount > 0;

  /* ---- Edit: product options (catalog + any product already on the entry) ---- */
  const productOptions = useMemo(() => {
    const map = new Map<number, { value: number; label: string; hint: string }>();

    for (const product of products) {
      map.set(product.id, {
        value: product.id,
        label: product.name,
        hint: product.unit,
      });
    }

    for (const item of current?.items ?? []) {
      if (!map.has(item.productId)) {
        map.set(item.productId, {
          value: item.productId,
          label: item.productName,
          hint: item.unit,
        });
      }
    }

    return [...map.values()];
  }, [products, current]);

  const customerOptions = useMemo(() => {
    const options = customers.map((c) => ({ value: c.id, label: c.name }));

    if (current && !options.some((o) => o.value === current.customerId)) {
      options.push({ value: current.customerId, label: current.customerName });
    }

    return options;
  }, [customers, current]);

  /* ---- Edit: calculations. Products already on the entry keep their stored
         price and tax; only newly added products use today's catalog price ---- */
  const editLines = useMemo(() => {
    if (!current) return [];

    return editItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const original = current.items.find((i) => i.productId === item.productId);

      const unitPrice = original?.unitPrice ?? product?.sellingPrice ?? 0;
      const taxRate = original?.taxRate ?? product?.taxRate ?? 0;
      const quantity = Number(item.quantity) || 0;

      const subtotal =
        item.productId === null ? 0 : Math.round(quantity * unitPrice);
      const tax = Math.round((subtotal * taxRate) / 100);

      return {
        itemId: item.id,
        unitPrice,
        taxRate,
        unit: original?.unit ?? product?.unit ?? "",
        subtotal,
        tax,
        total: subtotal + tax,
      };
    });
  }, [current, editItems, products]);

  const editSummary = useMemo(() => {
    const subtotal = editLines.reduce((sum, line) => sum + line.subtotal, 0);
    const tax = editLines.reduce((sum, line) => sum + line.tax, 0);
    const discount = current?.discount ?? 0;
    const total = subtotal - discount + tax;
    const paid = current?.paidAmount ?? 0;

    return {
      subtotal,
      tax,
      discount,
      total,
      paid,
      outstanding: Math.max(total - paid, 0),
      status: derivePaymentStatus(editPaymentType, paid, total),
    };
  }, [editLines, current, editPaymentType]);

  const editTotalTooLow =
    current !== null && editSummary.total < editSummary.paid;

  const editUsedIds = editItems
    .map((item) => item.productId)
    .filter((id): id is number => id !== null);

  const allProductsUsed = editUsedIds.length >= productOptions.length;

  const editValid =
    editCustomerId !== null &&
    editItems.length > 0 &&
    editItems.every(
      (item) => item.productId !== null && Number(item.quantity) > 0,
    ) &&
    !editTotalTooLow;

  /* ---- Quick Sale edit: validation ---- */
  const quickSaleAmountPaise = Math.round(
    (Number(quickSaleAmount) || 0) * 100,
  );

  const quickSaleEditValid =
    isQuickSale &&
    quickSaleAmountPaise > 0 &&
    isPaymentMethod(quickSalePaymentMethod);

  /* ---- Pay: calculations ---- */
  const outstanding = current?.outstandingAmount ?? 0;
  const payEnteredPaise = Math.round((Number(payAmount) || 0) * 100);
  const payPaise = payKind === "FULL" ? outstanding : payEnteredPaise;
  const payDateValid = DATE_KEY_PATTERN.test(payDate) && payDate <= todayKey();

  let payAmountError: string | null = null;
  if (payKind === "PARTIAL" && payAmount !== "") {
    if (payEnteredPaise <= 0) {
      payAmountError = "Enter an amount greater than zero.";
    } else if (payEnteredPaise >= outstanding) {
      payAmountError =
        "A partial payment must be less than the outstanding balance. Choose Fully paid to settle it.";
    }
  }

  const payValid =
    outstanding > 0 &&
    payDateValid &&
    (payKind === "FULL" ||
      (payEnteredPaise > 0 && payEnteredPaise < outstanding));

  const selectedPayMethod = PAYMENT_METHOD_OPTIONS.find(
    (option) => option.value === payMethod,
  );

  /* ---- Mode switches ---- */
  function startEdit() {
    if (!current || current.isQuickSaleEntry) return;

    setEditCustomerId(current.customerId);
    setEditPaymentType(current.paymentType);
    setEditNotes(current.notes ?? "");
    setEditItems(
      current.items.map((item) => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        quantity: String(item.quantity),
      })),
    );
    setActionError(null);
    setMode("edit");
  }

  function startQuickSaleEdit() {
    if (!current || !current.isQuickSaleEntry) return;

    const payment = current.payments[0];
    const method = payment?.paymentMethod;

    setQuickSaleAmount((current.total / 100).toFixed(2));
    setQuickSalePaymentMethod(method && isPaymentMethod(method) ? method : "CASH");
    setQuickSaleReference(payment?.reference ?? "");
    setQuickSaleNotes(current.notes ?? "");

    setActionError(null);
    setMode("edit");
  }

  function startPay() {
    setPayKind("FULL");
    setPayAmount("");
    setPayMethod("CASH");
    setPayDate(todayKey());
    setPayReference("");
    setPayNotes("");
    setActionError(null);
    setMode("pay");
  }

  function backToView() {
    setActionError(null);
    setMode("view");
  }

  function updateEditItem(itemId: string, patch: Partial<EditItem>) {
    setEditItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    );
  }

  /* ---- Actions ---- */
  async function handleSaveEdit() {
    if (!current || current.isQuickSaleEntry || !editValid) return;

    setIsBusy(true);
    setActionError(null);

    try {
      const result = await updateDailyEntryAction({
        entryId: current.id,
        customerId: editCustomerId,
        paymentType: editPaymentType,
        notes: editNotes.trim() || null,
        items: editItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      });

      if (!result.success) throw new Error(result.error);

      setMode("view");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to save changes.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveQuickSale() {
    if (!current || !current.isQuickSaleEntry || !quickSaleEditValid) return;

    setIsBusy(true);
    setActionError(null);

    try {
      const result = await updateQuickSaleAction({
        entryId: current.id,
        amount: quickSaleAmountPaise,
        paymentMethod: quickSalePaymentMethod,
        reference: quickSaleReference.trim() || null,
        notes: quickSaleNotes.trim() || null,
      });

      if (!result.success) throw new Error(result.error);

      setMode("view");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to save quick sale.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRecordPayment() {
    if (!current || !payValid) return;

    setIsBusy(true);
    setActionError(null);

    try {
      const result = await addDailyEntryPaymentAction({
        entryId: current.id,
        amount: payPaise,
        paymentMethod: payMethod,
        paymentDate: payDate,
        reference: payReference.trim() || null,
        notes: payNotes.trim() || null,
      });

      if (!result.success) throw new Error(result.error);

      setMode("view");
      setReloadKey((key) => key + 1); // payment history updates immediately
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to record payment.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!current) return;

    setConfirmDelete(false);
    setIsBusy(true);
    setActionError(null);

    try {
      const result = await deleteDailyEntryAction(current.id);

      if (!result.success) throw new Error(result.error);

      onOpenChange(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete the entry.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  const title =
    mode === "edit"
      ? isQuickSale
        ? "Edit Quick Sale"
        : "Edit Daily Entry"
      : mode === "pay"
        ? "Record Payment"
        : "View Daily Entry";

  // Edit mode shows "Quick Sale" instead of the Walk-in Customer name
  const descriptionName =
    current && isQuickSale && mode === "edit"
      ? "Quick Sale"
      : current?.customerName;

  const deleteNoun = isQuickSale ? "Quick Sale" : "Entry";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* Header + footer are fixed, only the body scrolls */}
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="size-5" />
              {title}
            </DialogTitle>
            <DialogDescription>
              {entryId !== null
                ? `${descriptionName ? ` ${descriptionName} |` : ""} en-${entryId}`
                : "Review the details of this entry."}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {showLoading && <EntrySkeleton />}

            {showError && (
              <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Unable to load this entry.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  <RefreshCw />
                  Try again
                </Button>
              </div>
            )}

            {/* ------------------------------ VIEW ------------------------------ */}
            {current && statusBadge && mode === "view" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {current.customerName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {isQuickSale && (
                        <Badge variant="outline" className={QUICK_SALE_BADGE}>
                          Quick Sale
                        </Badge>
                      )}

                      {/* Quick Sales are always the walk-in customer */}
                      {!isQuickSale && (
                        <Badge variant="outline">
                          {getCustomerTypeLabel(current.customerType)}
                        </Badge>
                      )}

                      <Badge
                        variant="outline"
                        className={isMonthly ? MONTHLY_BADGE : undefined}
                      >
                        {PAYMENT_TYPE_LABEL[current.paymentType]}
                      </Badge>

                      {!isMonthly && (
                        <Badge variant="outline" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4" />
                    {formatDate(current.entryDate)}
                  </div>
                </div>

                {isMonthly && (
                  <div className="flex items-start gap-3 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 ">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-sky-700 " />
                    <div>
                      <p className="text-sm font-medium">
                        Part of {current.customerName}&apos;s monthly account
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        This entry is billed with the customer&apos;s monthly
                        statement. Payments are collected against the monthly
                        account, not against this entry.
                      </p>
                    </div>
                  </div>
                )}

                <Figures
                  total={current.total}
                  paid={current.paidAmount}
                  outstanding={current.outstandingAmount}
                  highlightOutstanding={!isMonthly}
                />

                {/* Products + totals */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">
                    Products{" "}
                    <span className="font-normal text-muted-foreground">
                      ({current.items.length})
                    </span>
                  </h3>

                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="px-4">Product</TableHead>
                          <TableHead className="px-4 text-right">
                            Quantity
                          </TableHead>
                          <TableHead className="px-4 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {current.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="px-4 whitespace-normal">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.unitPrice)} / {item.unit}
                              </p>
                            </TableCell>
                            <TableCell className="px-4 text-right tabular-nums">
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell className="px-4 text-right font-medium tabular-nums">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>

                      <TableFooter>
                        {/* A Quick Sale is a single amount: no subtotal/tax breakdown */}
                        {!isQuickSale && (
                          <>
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={2} className="px-4 text-muted-foreground">
                                Subtotal
                              </TableCell>
                              <TableCell className="px-4 text-right tabular-nums">
                                {formatCurrency(current.subtotal)}
                              </TableCell>
                            </TableRow>

                            {current.discount > 0 && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={2} className="px-4 text-muted-foreground">
                                  Discount
                                </TableCell>
                                <TableCell className="px-4 text-right tabular-nums">
                                  -{formatCurrency(current.discount)}
                                </TableCell>
                              </TableRow>
                            )}

                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={2} className="px-4 text-muted-foreground">
                                Tax
                              </TableCell>
                              <TableCell className="px-4 text-right tabular-nums">
                                {formatCurrency(current.tax)}
                              </TableCell>
                            </TableRow>
                          </>
                        )}

                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={2} className="px-4 font-semibold">
                            Total
                          </TableCell>
                          <TableCell className="px-4 text-right text-base font-semibold tabular-nums">
                            {formatCurrency(current.total)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </section>

                {/* Payment history (Immediate entries only) */}
                {!isMonthly && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Payment History{" "}
                      <span className="font-normal text-muted-foreground">
                        ({current.payments.length})
                      </span>
                    </h3>

                    {current.payments.length === 0 ? (
                      <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                        No payments recorded yet.
                      </div>
                    ) : (
                      <div className="divide-y rounded-lg border">
                        {current.payments.map((payment) => (
                          <div key={payment.id} className="space-y-1 px-4 py-3 text-sm">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-2">
                                <Badge variant="outline">
                                  {toLabel(payment.paymentMethod)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(payment.paymentDate)}
                                </span>
                              </div>
                              <span className="font-medium tabular-nums">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>

                            {payment.reference && (
                              <p className="text-xs break-words text-muted-foreground">
                                Reference: {payment.reference}
                              </p>
                            )}

                            {payment.notes && (
                              <p className="text-xs break-words whitespace-pre-wrap text-muted-foreground">
                                {payment.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {current.notes && (
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Notes</h3>
                    <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm break-words whitespace-pre-wrap text-muted-foreground">
                      {current.notes}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ------------------------------ EDIT ------------------------------ */}
            {current && mode === "edit" && isQuickSale && (
              <QuickSaleEditForm
                amount={quickSaleAmount}
                amountPaise={quickSaleAmountPaise}
                paymentMethod={quickSalePaymentMethod}
                reference={quickSaleReference}
                notes={quickSaleNotes}
                onAmountChange={setQuickSaleAmount}
                onPaymentMethodChange={setQuickSalePaymentMethod}
                onReferenceChange={setQuickSaleReference}
                onNotesChange={setQuickSaleNotes}
              />
            )}

            {current && mode === "edit" && !isQuickSale && (
              <div className="space-y-6">
                {/* Customer */}
                <div className="flex flex-col gap-2">
                  <Label>Customer</Label>
                  <SearchSelect
                    options={customerOptions}
                    value={editCustomerId}
                    onChange={setEditCustomerId}
                    placeholder="Select customer"
                    searchPlaceholder="Search customer..."
                    emptyText="No customer found."
                  />
                </div>

                {/* Products */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>
                      Products{" "}
                      <span className="font-normal text-muted-foreground">
                        ({editItems.length})
                      </span>
                    </Label>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={allProductsUsed}
                      title={
                        allProductsUsed
                          ? "All available products are already added"
                          : undefined
                      }
                      onClick={() =>
                        setEditItems((items) => [
                          ...items,
                          { id: crypto.randomUUID(), productId: null, quantity: "" },
                        ])
                      }
                    >
                      <Plus />
                      Add Product
                    </Button>
                  </div>

                  {editItems.length === 0 ? (
                    <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed">
                      <p className="text-sm text-muted-foreground">
                        Add at least one product.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {editItems.map((item) => {
                        const line = editLines.find((l) => l.itemId === item.id);
                        const options = productOptions.filter(
                          (option) =>
                            option.value === item.productId ||
                            !editUsedIds.includes(option.value),
                        );

                        return (
                          <div
                            key={item.id}
                            className="grid grid-cols-2 items-start gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]"
                          >
                            <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
                              <SearchSelect
                                options={options}
                                value={item.productId}
                                onChange={(productId) =>
                                  updateEditItem(item.id, { productId })
                                }
                                placeholder="Select product"
                                searchPlaceholder="Search product..."
                                emptyText="No product found."
                              />

                              {item.productId !== null && line && (
                                <p className="truncate px-1 text-xs text-muted-foreground">
                                  {formatCurrency(line.unitPrice)} / {line.unit} ·
                                  Tax {line.taxRate}%
                                </p>
                              )}
                            </div>

                            <div className="relative">
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateEditItem(item.id, {
                                    quantity: event.target.value,
                                  })
                                }
                                placeholder="Qty"
                                aria-label="Quantity"
                                className={cn(line?.unit && "pr-12")}
                              />
                              {line?.unit && item.productId !== null && (
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                  {line.unit}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <span className="w-24 text-right text-sm font-medium tabular-nums">
                                ₹{formatPaise(line?.total ?? 0)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                aria-label="Remove product"
                                onClick={() =>
                                  setEditItems((items) =>
                                    items.filter((i) => i.id !== item.id),
                                  )
                                }
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment type */}
                <div className="space-y-2">
                  <RadioCards
                    idPrefix="edit-payment-type"
                    label="Payment Type"
                    value={editPaymentType}
                    onChange={setEditPaymentType}
                    options={[
                      {
                        value: "IMMEDIATE",
                        label: "Immediate",
                        description: "Payments are recorded against this entry.",
                      },
                      {
                        value: "MONTHLY",
                        label: "Monthly",
                        description: "Added to the customer's monthly account.",
                        disabled: current.paidAmount > 0,
                      },
                    ]}
                  />
                  {current.paidAmount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Payments are already recorded, so this entry can&apos;t be
                      moved to a monthly account.
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <Label>
                    Notes{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    value={editNotes}
                    onChange={(event) => setEditNotes(event.target.value)}
                    placeholder="Add any notes for this entry..."
                    rows={3}
                  />
                </div>

                {/* Summary after changes */}
                <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">₹{formatPaise(editSummary.subtotal)}</span>
                  </div>
                  {editSummary.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="tabular-nums">
                        -₹{formatPaise(editSummary.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="tabular-nums">₹{formatPaise(editSummary.tax)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">₹{formatPaise(editSummary.total)}</span>
                  </div>

                  {editPaymentType === "IMMEDIATE" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Already paid</span>
                        <span className="tabular-nums">₹{formatPaise(editSummary.paid)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Outstanding after saving
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={PAYMENT_STATUS[editSummary.status].className}
                          >
                            {PAYMENT_STATUS[editSummary.status].label}
                          </Badge>
                          <span className="font-medium tabular-nums">
                            ₹{formatPaise(editSummary.outstanding)}
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {editTotalTooLow && (
                  <p className="text-sm text-destructive">
                    The total can&apos;t be lower than the ₹
                    {formatPaise(editSummary.paid)} already paid. Increase the
                    items, or delete the entry.
                  </p>
                )}
              </div>
            )}

            {/* ------------------------------ PAY ------------------------------ */}
            {current && mode === "pay" && (
              <div className="space-y-6">
                <Figures
                  total={current.total}
                  paid={current.paidAmount}
                  outstanding={current.outstandingAmount}
                  highlightOutstanding
                />

                <RadioCards
                  idPrefix="pay-kind"
                  label="Payment"
                  value={payKind}
                  onChange={setPayKind}
                  options={[
                    {
                      value: "FULL",
                      label: "Fully paid",
                      description: `Settle the remaining ${formatCurrency(outstanding)}.`,
                    },
                    {
                      value: "PARTIAL",
                      label: "Partial payment",
                      description: "Record part of the balance now.",
                    },
                  ]}
                />

                <div className="space-y-4 rounded-lg border p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Amount */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="pay-amount">Amount Paid</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          id="pay-amount"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          className="pl-7 tabular-nums"
                          placeholder="0.00"
                          disabled={payKind === "FULL"}
                          aria-invalid={payAmountError !== null}
                          value={
                            payKind === "FULL"
                              ? (outstanding / 100).toFixed(2)
                              : payAmount
                          }
                          onChange={(event) => setPayAmount(event.target.value)}
                        />
                      </div>

                      {payAmountError ? (
                        <p className="text-xs text-destructive">{payAmountError}</p>
                      ) : payKind === "FULL" ? (
                        <p className="text-xs text-muted-foreground">
                          Uses the full outstanding balance.
                        </p>
                      ) : (
                        payEnteredPaise > 0 &&
                        payEnteredPaise < outstanding && (
                          <p className="text-xs text-muted-foreground">
                            ₹{formatPaise(outstanding - payEnteredPaise)} will
                            remain outstanding.
                          </p>
                        )
                      )}
                    </div>

                    {/* Method */}
                    <div className="flex flex-col gap-2">
                      <Label>Payment Method</Label>
                      <Select
                        value={payMethod}
                        onValueChange={(value) => {
                          if (isPaymentMethod(value)) setPayMethod(value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select method">
                            {methodLabel(payMethod)}
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

                    {/* Date */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="pay-date">Payment Date</Label>
                      <Input
                        id="pay-date"
                        type="date"
                        max={todayKey()}
                        value={payDate}
                        aria-invalid={!payDateValid}
                        onChange={(event) => setPayDate(event.target.value)}
                      />
                      {!payDateValid && (
                        <p className="text-xs text-destructive">
                          Choose a date that is not in the future.
                        </p>
                      )}
                    </div>

                    {/* Reference */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="pay-reference">Reference</Label>
                      <Input
                        id="pay-reference"
                        value={payReference}
                        onChange={(event) => setPayReference(event.target.value)}
                        placeholder={selectedPayMethod?.referenceHint}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pay-notes">
                      Notes{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      id="pay-notes"
                      value={payNotes}
                      onChange={(event) => setPayNotes(event.target.value)}
                      placeholder="Anything worth remembering about this payment..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action error */}
          {actionError && (
            <p
              role="alert"
              className="shrink-0 border-t bg-destructive/10 px-6 py-2 text-sm text-destructive"
            >
              {actionError}
            </p>
          )}

          {/* ------------------------------ Footers ------------------------------ */}
          {mode === "view" && (
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>

              {current && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {!isQuickSale && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBillPreviewOpen(true)}
                    >
                      <Printer />
                      Print Bill
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={isQuickSale ? startQuickSaleEdit : startEdit}
                  >
                    <Pencil />
                    {isQuickSale ? "Edit Quick Sale" : "Edit"}
                  </Button>

                  {/* Never shown for Monthly entries or Quick Sales */}
                  {canRecordPayment && (
                    <Button type="button" onClick={startPay}>
                      <Wallet />
                      Mark as Paid
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === "edit" && (
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={isBusy}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 />
                Delete {deleteNoun}
              </Button>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={backToView}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={
                    isQuickSale
                      ? !quickSaleEditValid || isBusy
                      : !editValid || isBusy
                  }
                  onClick={isQuickSale ? handleSaveQuickSale : handleSaveEdit}
                >
                  {isBusy && <Loader2 className="animate-spin" />}
                  {isQuickSale ? "Save Quick Sale" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {mode === "pay" && (
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={backToView}
              >
                Back
              </Button>

              <Button
                type="button"
                disabled={!payValid || isBusy}
                onClick={handleRecordPayment}
              >
                {isBusy && <Loader2 className="animate-spin" />}
                Record Payment
                {payValid && ` · ₹${formatPaise(payPaise)}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isQuickSale ? "Delete this quick sale?" : "Delete this entry?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {current
                ? isQuickSale
                  ? `This permanently deletes this ${formatCurrency(current.total)} quick sale and its recorded payment. This can't be undone.`
                  : `This permanently deletes the entry for ${current.customerName}, including its ${current.items.length} ${current.items.length === 1 ? "product" : "products"}${
                      current.payments.length > 0
                        ? ` and ${current.payments.length} recorded ${current.payments.length === 1 ? "payment" : "payments"} totalling ${formatCurrency(current.paidAmount)}`
                        : ""
                    }. This can't be undone.`
                : "This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isQuickSale ? "Keep quick sale" : "Keep entry"}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {isQuickSale ? "Delete quick sale" : "Delete entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DailyEntryBillPreview
        entryId={current?.id ?? null}
        open={billPreviewOpen}
        onOpenChange={setBillPreviewOpen}
      />
    </>
  );
}