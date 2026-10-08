// components/daily-entries/add-daily-entry-dialog.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Eraser,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
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
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDailyEntryAction } from "../actions";
import { PAYMENT_METHOD, PAYMENT_STATUS, PAYMENT_TYPE } from "@/common";

/* -------------------------------------------------------------------------- */
/* Types + constants                                                          */
/* -------------------------------------------------------------------------- */

interface AddDailyEntryDialogProps {
  customers: { id: number; name: string }[];
  products: {
    id: number;
    name: string;
    unit: string;
    sellingPrice: number; // paise
    taxRate: number | null;
  }[];
}

interface EntryItem {
  id: string;
  productId: number | null;
  quantity: string;
}

type PaymentType = PAYMENT_TYPE;
type PaymentStatus = PAYMENT_STATUS;
type PaymentMethod = PAYMENT_METHOD;

interface Draft {
  customerId: number | null;
  items: EntryItem[];
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  paymentAmount: string; // rupees, as typed (only used for PARTIAL)
  paymentMethod: PaymentMethod;
  paymentDate: string; // yyyy-MM-dd
  paymentReference: string;
  notes: string;
}

const DRAFT_KEY = "bizora:add-daily-entry";

const DEFAULT_PAYMENT_TYPE: PaymentType = "IMMEDIATE";
const DEFAULT_PAYMENT_STATUS: PaymentStatus = "UNPAID";
const DEFAULT_PAYMENT_METHOD: PaymentMethod = "CASH";

const PAYMENT_TYPE_OPTIONS: {
  value: PaymentType;
  label: string;
  description: string;
}[] = [
  {
    value: "IMMEDIATE",
    label: "Immediate",
    description: "Customer pays now, fully or partly.",
  },
  {
    value: "MONTHLY",
    label: "Monthly",
    description: "Added to the customer's monthly account.",
  },
];

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
];

const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  referenceHint: string;
}[] = [
  { value: "CASH", label: "Cash", referenceHint: "Optional" },
  { value: "UPI", label: "UPI", referenceHint: "(Optional)" },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    referenceHint: "UTR / transaction ID (optional)",
  },
  {
    value: "CARD",
    label: "Card",
    referenceHint: "Last 4 digits or slip no. (optional)",
  },
  { value: "OTHER", label: "Other", referenceHint: "Optional" },
];

const paymentTypeLabel = (type: PaymentType) =>
  PAYMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;

const paymentLabel = (status: PaymentStatus) =>
  PAYMENT_OPTIONS.find((option) => option.value === status)?.label ?? status;

const methodLabel = (method: PaymentMethod) =>
  PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
  method;

const isPaymentType = (value: unknown): value is PaymentType =>
  PAYMENT_TYPE_OPTIONS.some((option) => option.value === value);

const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  PAYMENT_OPTIONS.some((option) => option.value === value);

const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  PAYMENT_METHOD_OPTIONS.some((option) => option.value === value);

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Local-time "yyyy-MM-dd" (toISOString would give the UTC date, which is
 *  yesterday in India before 5:30 AM) */
function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

const createItem = (): EntryItem => ({
  id: crypto.randomUUID(),
  productId: null,
  quantity: "",
});

const formatAmount = (amount: number) =>
  (amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* -------------------------------------------------------------------------- */
/* Draft storage                                                              */
/* -------------------------------------------------------------------------- */

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;

    return {
      customerId:
        typeof parsed.customerId === "number" ? parsed.customerId : null,
      items: parsed.items
        .filter((item: unknown) => item && typeof item === "object")
        .map((item: Partial<EntryItem>) => ({
          id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
          productId: typeof item.productId === "number" ? item.productId : null,
          quantity: typeof item.quantity === "string" ? item.quantity : "",
        })),
      paymentType: isPaymentType(parsed.paymentType)
        ? parsed.paymentType
        : DEFAULT_PAYMENT_TYPE,
      paymentStatus: isPaymentStatus(parsed.paymentStatus)
        ? parsed.paymentStatus
        : DEFAULT_PAYMENT_STATUS,
      paymentAmount:
        typeof parsed.paymentAmount === "string" ? parsed.paymentAmount : "",
      paymentMethod: isPaymentMethod(parsed.paymentMethod)
        ? parsed.paymentMethod
        : DEFAULT_PAYMENT_METHOD,
      paymentDate:
        typeof parsed.paymentDate === "string" &&
        DATE_KEY_PATTERN.test(parsed.paymentDate)
          ? parsed.paymentDate
          : todayKey(),
      paymentReference:
        typeof parsed.paymentReference === "string"
          ? parsed.paymentReference
          : "",
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch {
    return null; // corrupted JSON or storage blocked
  }
}

function writeDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // storage full or unavailable: the draft just won't persist
  }
}

function removeDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/* -------------------------------------------------------------------------- */
/* Reusable searchable select                                                 */
/* -------------------------------------------------------------------------- */

interface SearchSelectProps {
  options: { value: number; label: string; hint?: string }[];
  value: number | null;
  onChange: (value: number) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
}

function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected
            ? `${selected.label}${selected.hint ? ` — ${selected.hint}` : ""}`
            : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.hint ?? ""}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">
                    {option.label}
                    {option.hint && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {option.hint}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

type ConfirmAction = "details" | "products" | "save" | null;

export function AddDailyEntryDialog({
  customers,
  products,
}: AddDailyEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [items, setItems] = useState<EntryItem[]>(() => [createItem()]);
  const [paymentType, setPaymentType] = useState<PaymentType>(
    DEFAULT_PAYMENT_TYPE,
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    DEFAULT_PAYMENT_STATUS,
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    DEFAULT_PAYMENT_METHOD,
  );
  const [paymentDate, setPaymentDate] = useState(todayKey);
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isImmediate = paymentType === "IMMEDIATE";
  const isMonthly = paymentType === "MONTHLY";

  /* ---- Calculations (declared before anything that reads `summary`) ---- */
  const lines = useMemo(
    () =>
      items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return { itemId: item.id, subtotal: 0, tax: 0, total: 0 };

        const quantity = Number(item.quantity) || 0;

        // Rounded per line, exactly like the server, so "Paid" amounts match
        const subtotal = Math.round(quantity * product.sellingPrice);
        const tax = Math.round((subtotal * (product.taxRate ?? 0)) / 100);

        return { itemId: item.id, subtotal, tax, total: subtotal + tax };
      }),
    [items, products],
  );

  const summary = useMemo(
    () =>
      lines.reduce(
        (sum, line) => ({
          subtotal: sum.subtotal + line.subtotal,
          tax: sum.tax + line.tax,
          total: sum.total + line.total,
        }),
        { subtotal: 0, tax: 0, total: 0 },
      ),
    [lines],
  );

  /* ---- Payment (all in paise). PAID is derived from the total, never stored,
         so it can't go stale when products change. Monthly records nothing. ---- */
  const totalPaise = summary.total;
  const enteredPaise = Math.round((Number(paymentAmount) || 0) * 100);

  const paidPaise = !isImmediate
    ? 0
    : paymentStatus === "PAID"
      ? totalPaise
      : paymentStatus === "PARTIAL"
        ? enteredPaise
        : 0;

  const balancePaise = Math.max(totalPaise - paidPaise, 0);

  const showPaymentDetails = isImmediate && paymentStatus !== "UNPAID";

  const hasValidPaymentDate =
    DATE_KEY_PATTERN.test(paymentDate) && paymentDate <= todayKey();

  let paymentAmountError: string | null = null;
  if (
    isImmediate &&
    paymentStatus === "PARTIAL" &&
    paymentAmount !== "" &&
    totalPaise > 0
  ) {
    if (enteredPaise <= 0) {
      paymentAmountError = "Enter an amount greater than zero.";
    } else if (enteredPaise >= totalPaise) {
      paymentAmountError =
        "A partial payment must be less than the total. Choose Paid for a full payment.";
    }
  }

  const paymentValid =
    isMonthly ||
    paymentStatus === "UNPAID" ||
    (hasValidPaymentDate &&
      (paymentStatus === "PAID"
        ? totalPaise > 0
        : enteredPaise > 0 && enteredPaise < totalPaise));

  /* ---- Restore draft once on mount (client only, avoids SSR mismatch) ---- */
  useEffect(() => {
    const draft = readDraft();

    if (draft) {
      // Drop references to customers/products that no longer exist
      const validCustomer = customers.some((c) => c.id === draft.customerId);
      const validItems = draft.items.map((item) =>
        item.productId !== null && !products.some((p) => p.id === item.productId)
          ? { ...item, productId: null }
          : item,
      );

      setCustomerId(validCustomer ? draft.customerId : null);
      setItems(validItems.length > 0 ? validItems : [createItem()]);
      setPaymentType(draft.paymentType);
      setPaymentStatus(draft.paymentStatus);
      setPaymentAmount(draft.paymentAmount);
      setPaymentMethod(draft.paymentMethod);
      setPaymentDate(draft.paymentDate);
      setPaymentReference(draft.paymentReference);
      setNotes(draft.notes);
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Persist draft on every change (after hydration) ---- */
  const hasProductData = items.some(
    (item) => item.productId !== null || item.quantity !== "",
  );
  const hasDraft =
    customerId !== null ||
    hasProductData ||
    paymentType !== DEFAULT_PAYMENT_TYPE ||
    paymentStatus !== DEFAULT_PAYMENT_STATUS ||
    notes.trim() !== "";

  useEffect(() => {
    if (!hydrated) return; // don't overwrite the stored draft with empty state

    if (hasDraft) {
      writeDraft({
        customerId,
        items,
        paymentType,
        paymentStatus,
        paymentAmount,
        paymentMethod,
        paymentDate,
        paymentReference,
        notes,
      });
    } else {
      removeDraft();
    }
  }, [
    hydrated,
    hasDraft,
    customerId,
    items,
    paymentType,
    paymentStatus,
    paymentAmount,
    paymentMethod,
    paymentDate,
    paymentReference,
    notes,
  ]);

  /* ---- Scroll to the newest row ---- */
  const endRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(items.length);

  useEffect(() => {
    if (items.length > previousCount.current) {
      endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    previousCount.current = items.length;
  }, [items.length]);

  /* ---- Item helpers ---- */
  function updateItem(itemId: string, patch: Partial<EntryItem>) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    );
  }

  function removeItem(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function handlePaymentStatusChange(status: PaymentStatus) {
    setPaymentStatus(status);
    if (status === "UNPAID") setPaymentAmount("");
  }

  /* ---- Clear actions ---- */
  function clearProducts() {
    setItems([createItem()]);
  }

  function clearAllDetails() {
    setCustomerId(null);
    setItems([createItem()]);
    setPaymentType(DEFAULT_PAYMENT_TYPE);
    setPaymentStatus(DEFAULT_PAYMENT_STATUS);
    setPaymentAmount("");
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
    setPaymentDate(todayKey());
    setPaymentReference("");
    setNotes("");
    setSaveError(null);
    removeDraft();
  }

  /* ---- Cancel / Save ---- */
  function handleCancel() {
    clearAllDetails(); // cancel discards the draft
    setOpen(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Monthly entries and unpaid immediate entries record no payment
      const recordsPayment = isImmediate && paymentStatus !== "UNPAID";

      const payload = {
        customerId,
        paymentType,
        paymentStatus: isMonthly ? ("UNPAID" as const) : paymentStatus,
        paymentAmount: recordsPayment ? paidPaise : 0,
        paymentMethod: recordsPayment ? paymentMethod : null,
        paymentDate: recordsPayment ? paymentDate : null,
        paymentReference: recordsPayment ? paymentReference.trim() || null : null,
        notes: notes.trim() || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      };

      const result = await createDailyEntryAction(payload);

      if (!result.success) {
        throw new Error(result.error);
      }

      clearAllDetails();
      setOpen(false);
    } catch (error) {
      console.error("Failed to save daily entry:", error);

      // Keep the draft and dialog open so no work is lost
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "Failed to save the entry. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleConfirm() {
    const action = confirm;
    setConfirm(null);

    if (action === "products") clearProducts();
    if (action === "details") clearAllDetails();
    if (action === "save") void handleSave();
  }

  /* ---- Validation ---- */
  const usedProductIds = items
    .map((item) => item.productId)
    .filter((id): id is number => id !== null);

  const allProductsUsed = usedProductIds.length >= products.length;

  const isValid =
    customerId !== null &&
    items.length > 0 &&
    items.every((item) => item.productId !== null && Number(item.quantity) > 0) &&
    paymentValid;

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedMethod = PAYMENT_METHOD_OPTIONS.find(
    (option) => option.value === paymentMethod,
  );

  const confirmCopy = {
    details: {
      title: "Clear all details?",
      description:
        "This removes the customer, every product, the payment details and the notes from this entry. This can't be undone.",
      action: "Clear all details",
      destructive: true,
    },
    products: {
      title: "Clear all products?",
      description:
        "This removes every product from this entry. The customer, payment details and notes are kept. This can't be undone.",
      action: "Clear products",
      destructive: true,
    },
    save: {
      title: "Save this entry?",
      description: "Please review the details below before saving.",
      action: "Confirm & save",
      destructive: false,
    },
  }[confirm ?? "save"];

  return (
    <>
      {/* Closing via Esc / overlay / X keeps the draft; only Cancel or Save clears it */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
          <Plus />
          Add Entry
          {hasDraft && (
            <span
              className="ml-1 size-2 rounded-full bg-amber-400"
              aria-label="Unsaved draft"
            />
          )}
        </DialogTrigger>

        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Add Daily Entry</DialogTitle>
            <DialogDescription>
              Record multiple products for a customer in one daily entry.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Draft bar */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {hasDraft
                  ? "Draft saved on this device until you save or cancel."
                  : "Your progress is saved automatically as a draft."}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!hasDraft}
                onClick={() => setConfirm("details")}
              >
                <RotateCcw />
                Clear all details
              </Button>
            </div>

            {/* Customer */}
            <div className="flex flex-col gap-2">
              <Label>Customer</Label>
              <SearchSelect
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                }))}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Select customer"
                searchPlaceholder="Search customer..."
                emptyText="No customer found."
              />
            </div>

            {/* Products */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Label>
                  Products
                  {items.length > 0 && (
                    <span className="font-normal text-muted-foreground">
                      ({items.length})
                    </span>
                  )}
                </Label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={!hasProductData}
                    onClick={() => setConfirm("products")}
                  >
                    <Eraser />
                    Clear products
                  </Button>

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
                      setItems((current) => [...current, createItem()])
                    }
                  >
                    <Plus />
                    Add Product
                  </Button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Add products to this entry.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Column headings (desktop only) */}
                  <div className="hidden grid-cols-[minmax(0,1fr)_120px_auto] gap-3 px-3 text-xs font-medium text-muted-foreground sm:grid">
                    <span>Product</span>
                    <span>Quantity</span>
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-right">Total</span>
                      <span className="size-9" />
                    </div>
                  </div>

                  {items.map((item) => {
                    const product = products.find(
                      (p) => p.id === item.productId,
                    );
                    const line = lines.find((l) => l.itemId === item.id);

                    const options = products
                      .filter(
                        (p) =>
                          p.id === item.productId ||
                          !usedProductIds.includes(p.id),
                      )
                      .map((p) => ({
                        value: p.id,
                        label: p.name,
                        hint: p.unit,
                      }));

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-2 items-start gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]"
                      >
                        {/* Product */}
                        <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
                          <SearchSelect
                            options={options}
                            value={item.productId}
                            onChange={(productId) =>
                              updateItem(item.id, { productId })
                            }
                            placeholder="Select product"
                            searchPlaceholder="Search product..."
                            emptyText="No product found."
                          />

                          {product && (
                            <p className="truncate px-1 text-xs text-muted-foreground">
                              ₹{formatAmount(product.sellingPrice)} /{" "}
                              {product.unit} · Tax {product.taxRate ?? 0}%
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(item.id, {
                                quantity: event.target.value,
                              })
                            }
                            placeholder="Qty"
                            aria-label="Quantity"
                            className={cn(product && "pr-12")}
                          />
                          {product && (
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                              {product.unit}
                            </span>
                          )}
                        </div>

                        {/* Line total + remove */}
                        <div className="flex items-center justify-end gap-2">
                          <span className="w-24 text-right text-sm font-medium tabular-nums">
                            ₹{formatAmount(line?.total ?? 0)}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove product"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Payment type */}
            <div className="flex flex-col gap-2">
              <Label id="payment-type-label">Payment Type</Label>

              <RadioGroup
                aria-labelledby="payment-type-label"
                value={paymentType}
                onValueChange={(value) => {
                  if (isPaymentType(value)) setPaymentType(value);
                }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {PAYMENT_TYPE_OPTIONS.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`payment-type-${option.value}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal transition-colors",
                      "hover:bg-muted/40",
                      "has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/5",
                    )}
                  >
                    <RadioGroupItem
                      id={`payment-type-${option.value}`}
                      value={option.value}
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

            {/* Payment status (Immediate only) */}
            {isImmediate && (
              <div className="flex flex-col gap-2">
                <Label>Payment Status</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(value) => {
                    if (isPaymentStatus(value)) handlePaymentStatusChange(value);
                  }}
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
            )}

            {/* Monthly note */}
            {isMonthly && (
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3">
                <p className="text-sm font-medium">Billed on the monthly account</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  This entry is saved as unpaid and added to
                  {selectedCustomer ? ` ${selectedCustomer.name}'s` : " the customer's"}{" "}
                  monthly account. No payment is recorded now.
                </p>
              </div>
            )}

            {/* Payment details (Immediate + Paid / Partial only) */}
            {showPaymentDetails && (
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Payment Details</p>
                  <p className="text-xs text-muted-foreground">
                    Record the payment received for this entry.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Amount */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="payment-amount">Amount Paid</Label>

                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        id="payment-amount"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        className="pl-7 tabular-nums"
                        placeholder="0.00"
                        disabled={paymentStatus === "PAID"}
                        aria-invalid={paymentAmountError !== null}
                        value={
                          paymentStatus === "PAID"
                            ? (totalPaise / 100).toFixed(2)
                            : paymentAmount
                        }
                        onChange={(event) =>
                          setPaymentAmount(event.target.value)
                        }
                      />
                    </div>

                    {paymentAmountError ? (
                      <p className="text-xs text-destructive">
                        {paymentAmountError}
                      </p>
                    ) : paymentStatus === "PAID" ? (
                      <p className="text-xs text-muted-foreground">
                        Paid entries use the full entry total.
                      </p>
                    ) : (
                      totalPaise > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Total ₹{formatAmount(totalPaise)}
                          {enteredPaise > 0 &&
                            enteredPaise < totalPaise &&
                            ` · Balance ₹${formatAmount(balancePaise)}`}
                        </p>
                      )
                    )}
                  </div>

                  {/* Method */}
                  <div className="flex flex-col gap-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) => {
                        if (isPaymentMethod(value)) setPaymentMethod(value);
                      }}
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

                  {/* Date */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="payment-date">Payment Date</Label>
                    <Input
                      id="payment-date"
                      type="date"
                      max={todayKey()}
                      value={paymentDate}
                      aria-invalid={!hasValidPaymentDate}
                      onChange={(event) => setPaymentDate(event.target.value)}
                    />
                    {!hasValidPaymentDate && (
                      <p className="text-xs text-destructive">
                        Choose a date that is not in the future.
                      </p>
                    )}
                  </div>

                  {/* Reference */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="payment-reference">Reference</Label>
                    <Input
                      id="payment-reference"
                      value={paymentReference}
                      onChange={(event) =>
                        setPaymentReference(event.target.value)
                      }
                      placeholder={selectedMethod?.referenceHint}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <Label>
                Notes{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add any notes for this entry..."
                rows={3}
              />
            </div>
          </div>

          {/* Save error */}
          {saveError && (
            <p
              role="alert"
              className="shrink-0 border-t bg-destructive/10 px-6 py-2 text-sm text-destructive"
            >
              {saveError}
            </p>
          )}

          {/* Fixed footer */}
          <div className="flex shrink-0 flex-col gap-4 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums">
                  ₹{formatAmount(summary.subtotal)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tax</dt>
                <dd className="font-medium tabular-nums">
                  ₹{formatAmount(summary.tax)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  ₹{formatAmount(summary.total)}
                </dd>
              </div>

              {showPaymentDetails && (
                <>
                  <div>
                    <dt className="text-xs text-muted-foreground">Paid</dt>
                    <dd className="font-medium tabular-nums">
                      ₹{formatAmount(paidPaise)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Balance</dt>
                    <dd
                      className={cn(
                        "font-medium tabular-nums",
                        balancePaise > 0 && "text-red-600 ",
                      )}
                    >
                      ₹{formatAmount(balancePaise)}
                    </dd>
                  </div>
                </>
              )}
            </dl>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!isValid || isSaving}
                onClick={() => {
                  setSaveError(null);
                  setConfirm("save");
                }}
              >
                {isSaving && <Loader2 className="animate-spin" />}
                Save Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation modal (clear details, clear products, save) */}
      <AlertDialog
        open={confirm !== null}
        onOpenChange={(value) => {
          if (!value) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Review summary, only for the save confirmation */}
          {confirm === "save" && (
            <dl className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="truncate font-medium">
                  {selectedCustomer?.name ?? "-"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Products</dt>
                <dd className="font-medium">{items.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payment type</dt>
                <dd className="font-medium">{paymentTypeLabel(paymentType)}</dd>
              </div>

              {isImmediate && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Payment status</dt>
                  <dd className="font-medium">{paymentLabel(paymentStatus)}</dd>
                </div>
              )}

              {showPaymentDetails && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Amount paid</dt>
                    <dd className="font-medium tabular-nums">
                      ₹{formatAmount(paidPaise)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Method</dt>
                    <dd className="font-medium">{methodLabel(paymentMethod)}</dd>
                  </div>
                  {paymentReference.trim() && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Reference</dt>
                      <dd className="truncate font-medium">
                        {paymentReference.trim()}
                      </dd>
                    </div>
                  )}
                </>
              )}

              {notes.trim() && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="line-clamp-2 text-right font-medium">
                    {notes.trim()}
                  </dd>
                </div>
              )}

              <div className="flex justify-between gap-4 border-t pt-2">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular-nums">
                  ₹{formatAmount(summary.total)}
                </dd>
              </div>

              {isMonthly ? (
                <p className="pt-1 text-xs text-muted-foreground">
                  Added to the customer's monthly account. No payment is
                  recorded now.
                </p>
              ) : (
                balancePaise > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Outstanding</dt>
                    <dd className="font-medium text-red-600 tabular-nums ">
                      ₹{formatAmount(balancePaise)}
                    </dd>
                  </div>
                )
              )}
            </dl>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>
              {confirm === "save" ? "Go back" : "Keep editing"}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={confirmCopy.destructive ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {confirmCopy.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}