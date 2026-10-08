"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { MonthlyAccountPayment } from "@/lib/db/monthly-account";
import { PAYMENT_METHOD } from "@/common";

interface MonthlyPaymentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: MonthlyAccountPayment[];
  accountMonth: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(value: string): string {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month) return value;

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function paymentMethodLabel(value: PAYMENT_METHOD): string {
  switch (value) {
    case "CASH":
      return "Cash";
    case "UPI":
        return "UPI"
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "CARD":
      return "Card";
    case "OTHER":
      return "Other";
    default:
      return value;
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function MonthlyPaymentHistory({
  open,
  onOpenChange,
  payments,
  accountMonth,
}: MonthlyPaymentHistoryProps) {
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  // Always start on the list when the dialog opens
  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  const selectedPayment = useMemo(
    () => payments.find((payment) => payment.id === selectedId) ?? null,
    [payments, selectedId],
  );

  const totalPaid = useMemo(
    () => payments.reduce((total, payment) => total + payment.amount, 0),
    [payments],
  );

  const countLabel = `${payments.length} ${
    payments.length === 1 ? "payment" : "payments"
  }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {selectedPayment ? (
          /* ----------------------------- Details view ----------------------------- */
          <>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>

              <DialogDescription>
                Details of the monthly account payment.
              </DialogDescription>
            </DialogHeader>

            <div className="mx-auto w-full max-w-md space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(selectedPayment.amount)}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Payment received
                </p>
              </div>

              <div className="divide-y rounded-lg border">
                <Detail
                  label="Payment Date"
                  value={formatDate(selectedPayment.paymentDate)}
                />
                <Detail
                  label="Payment Method"
                  value={paymentMethodLabel(selectedPayment.paymentMethod as PAYMENT_METHOD)}
                />
                <Detail label="Reference" value={selectedPayment.reference} />
                <Detail label="Notes" value={selectedPayment.notes} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft />
                Back to history
              </Button>

              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ------------------------------ List view ------------------------------- */
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <DialogTitle>Payment History</DialogTitle>

                {payments.length > 0 && (
                  <Badge variant="outline">{countLabel}</Badge>
                )}
              </div>

              <DialogDescription>
                Payments received for {formatMonth(accountMonth)}.
              </DialogDescription>
            </DialogHeader>

            {payments.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  No payments recorded for this month.
                </p>
              </div>
            ) : (
              <div className="min-w-0 overflow-hidden rounded-lg border">
                {/* shadcn's own table container is the scroll area, so the header stays sticky */}
                <div className="[&>[data-slot=table-container]]:max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 z-10 bg-background px-4">
                          Date
                        </TableHead>
                        <TableHead className="sticky top-0 z-10 bg-background px-4">
                          Payment Method
                        </TableHead>
                        <TableHead className="sticky top-0 z-10 bg-background px-4">
                          Reference
                        </TableHead>
                        <TableHead className="sticky top-0 z-10 bg-background px-4 text-right">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow
                          key={payment.id}
                          tabIndex={0}
                          className="cursor-pointer"
                          onClick={() => setSelectedId(payment.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedId(payment.id);
                            }
                          }}
                        >
                          <TableCell className="px-4 font-medium whitespace-nowrap">
                            {formatDate(payment.paymentDate)}
                          </TableCell>

                          <TableCell className="px-4">
                            {paymentMethodLabel(payment.paymentMethod as PAYMENT_METHOD
                            )}
                          </TableCell>

                          <TableCell className="px-4 text-muted-foreground">
                            {payment.reference || "—"}
                          </TableCell>

                          <TableCell className="px-4 text-right font-medium tabular-nums">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                    <TableFooter>
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="px-4 text-muted-foreground"
                        >
                          Total paid ({countLabel})
                        </TableCell>

                        <TableCell className="px-4 text-right font-semibold tabular-nums">
                          {formatCurrency(totalPaid)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>

      <span className="text-right text-sm font-medium break-words whitespace-pre-wrap">
        {value || "—"}
      </span>
    </div>
  );
}