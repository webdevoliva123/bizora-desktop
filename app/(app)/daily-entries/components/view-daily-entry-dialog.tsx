// components/daily-entries/view-daily-entry-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import type { DailyEntryDetail } from "@/lib/types/daily-entry";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

interface ViewDailyEntryDialogProps {
  entryId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LoadStatus = "idle" | "loading" | "success" | "error";

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

const PAYMENT_STATUS: Record<
  DailyEntryDetail["paymentStatus"],
  { label: string; className: string }
> = {
  PAID: {
    label: "Paid",
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  PARTIAL: {
    label: "Partial",
    className:
      "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  UNPAID: {
    label: "Unpaid",
    className:
      "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
};

/* -------------------------------------------------------------------------- */
/* Loading skeleton                                                           */
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

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

export function ViewDailyEntryDialog({
  entryId,
  open,
  onOpenChange,
}: ViewDailyEntryDialogProps) {
  const [entry, setEntry] = useState<DailyEntryDetail | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [reloadKey, setReloadKey] = useState(0);

  /* ---- Load the entry (aborts if the dialog closes or the id changes) ---- */
  useEffect(() => {
    if (!open || entryId === null) return;

    const controller = new AbortController();

    async function loadEntry() {
      setStatus("loading");
      setEntry(null);

      try {
        const response = await fetch(`/api/daily-entries/${entryId}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Failed to load daily entry.");

        const data = (await response.json()) as DailyEntryDetail;

        setEntry(data);
        setStatus("success");
      } catch (error) {
        if (controller.signal.aborted) return; // superseded, ignore

        console.error("Failed to load daily entry:", error);
        setStatus("error");
      }
    }

    loadEntry();

    return () => controller.abort();
  }, [open, entryId, reloadKey]);

  // Never show a previously loaded entry for a different id
  const current = entry && entry.id === entryId ? entry : null;
  const showError = status === "error" && !current;
  const showLoading = !current && !showError;

  const payment = current ? PAYMENT_STATUS[current.paymentStatus] : null;
  const canMarkPaid =
    current?.paymentStatus === "UNPAID" || current?.paymentStatus === "PARTIAL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Header + footer are fixed, only the body scrolls */}
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="size-5" />
            View Daily Entry
          </DialogTitle>
          <DialogDescription>
            {entryId !== null
              ? `Entry #${entryId}`
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

          {current && payment && (
            <div className="space-y-6">
              {/* Customer / date / status */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {current.customerName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">
                      {getCustomerTypeLabel(current.customerType)}
                    </Badge>
                    <Badge variant="outline" className={payment.className}>
                      {payment.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" />
                  {formatDate(current.entryDate)}
                </div>
              </div>

              {/* Key figures */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums sm:text-base">
                    {formatCurrency(current.total)}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums sm:text-base">
                    {formatCurrency(current.paidAmount)}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p
                    className={cn(
                      "mt-1 text-sm font-semibold tabular-nums sm:text-base",
                      current.outstandingAmount > 0 &&
                        "text-red-600 dark:text-red-400",
                    )}
                  >
                    {formatCurrency(current.outstandingAmount)}
                  </p>
                </div>
              </div>

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
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={2}
                          className="px-4 text-muted-foreground"
                        >
                          Subtotal
                        </TableCell>
                        <TableCell className="px-4 text-right tabular-nums">
                          {formatCurrency(current.subtotal)}
                        </TableCell>
                      </TableRow>

                      {current.discount > 0 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={2}
                            className="px-4 text-muted-foreground"
                          >
                            Discount
                          </TableCell>
                          <TableCell className="px-4 text-right tabular-nums">
                            -{formatCurrency(current.discount)}
                          </TableCell>
                        </TableRow>
                      )}

                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={2}
                          className="px-4 text-muted-foreground"
                        >
                          Tax
                        </TableCell>
                        <TableCell className="px-4 text-right tabular-nums">
                          {formatCurrency(current.tax)}
                        </TableCell>
                      </TableRow>

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

              {/* Payment history */}
              {current.payments.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">
                    Payment History{" "}
                    <span className="font-normal text-muted-foreground">
                      ({current.payments.length})
                    </span>
                  </h3>

                  <div className="divide-y rounded-lg border">
                    {current.payments.map((paymentItem) => (
                      <div
                        key={paymentItem.id}
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            {toLabel(paymentItem.paymentMethod)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDate(paymentItem.paymentDate)}
                            {paymentItem.reference
                              ? ` · ${paymentItem.reference}`
                              : ""}
                          </p>
                        </div>

                        <span className="font-medium tabular-nums">
                          {formatCurrency(paymentItem.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Notes */}
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
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {current && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Print will be implemented next.
                  console.log("Print daily entry:", current.id);
                }}
              >
                <Printer />
                Print Bill
              </Button>

              {canMarkPaid && (
                <Button
                  type="button"
                  onClick={() => {
                    // Mark as paid will be implemented next.
                    console.log("Mark as paid:", current.id);
                  }}
                >
                  Mark as Paid
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}