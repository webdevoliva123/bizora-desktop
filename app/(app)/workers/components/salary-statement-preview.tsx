"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, FileText, MapPin, Phone, Printer, RefreshCw } from "lucide-react";
import { useReactToPrint } from "react-to-print";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getFileUrl } from "@/lib/files/urls";
import type { WorkerSalaryStatement } from "@/lib/types/worker";

import {
  formatCurrency,
  formatDate,
  methodLabel,
  monthName,
  paymentTypeLabel,
} from "./worker-shared";

const PAGE_MARGIN_MM = 12;

const PRINT_PAGE_STYLE = `
  @page { size: A4; margin: ${PAGE_MARGIN_MM}mm; }
  html, body { background: #fff; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  thead { display: table-header-group; }
  tr, tbody { break-inside: avoid; }
`;

type LoadStatus = "idle" | "loading" | "success" | "error";

function StatementDocument({ statement }: { statement: WorkerSalaryStatement }) {
  const { business, worker, salary, year } = statement;

  const money = (amount: number) => formatCurrency(amount, business.currency);
  const monthsWithPayments = salary.months.filter(
    (month) => month.payments.length > 0,
  );

  return (
    <div className="text-sm leading-normal text-slate-900">
      {/* Business header */}
      <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="flex min-w-0 items-start gap-4">
          {business.logoPath ? (
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={getFileUrl(business.logoPath) ?? ""}
                alt={business.name}
                className="size-full object-contain"
              />
            </div>
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <Building2 className="size-7 text-slate-400" />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">
              {business.name}
            </h2>

            {business.businessCategory && (
              <p className="mt-0.5 text-sm text-slate-500">
                {business.businessCategory}
              </p>
            )}

            {business.address && (
              <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {business.address}
                  {business.city && `, ${business.city}`}
                  {business.state && `, ${business.state}`}
                  {business.postalCode && ` - ${business.postalCode}`}
                </span>
              </div>
            )}

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {business.phone && (
                <span className="inline-flex items-center gap-2">
                  <Phone className="size-3.5" />
                  {business.phone}
                </span>
              )}
              {business.email && <span>{business.email}</span>}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Salary
          </p>
          <p className="mt-1 text-lg font-semibold">Statement</p>
          <p className="mt-1 text-sm text-slate-500">{year}</p>
        </div>
      </div>

      {/* Worker */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-5">
        <div>
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Paid To
          </p>
          <p className="mt-1 font-semibold">{worker.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {[worker.role, worker.phone].filter(Boolean).join(" · ") || "Worker"}
          </p>
        </div>

        {worker.defaultPaymentAmount != null && (
          <div className="text-right">
            <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              {paymentTypeLabel(worker.paymentType)} salary
            </p>
            <p className="mt-1 font-semibold tabular-nums">
              {money(worker.defaultPaymentAmount)}
            </p>
          </div>
        )}
      </div>

      {/* Payments by month */}
      <div className="py-6">
        <div className="mb-3">
          <h3 className="text-base font-semibold">Salary paid in {year}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {salary.paymentCount}{" "}
            {salary.paymentCount === 1 ? "payment" : "payments"} across{" "}
            {monthsWithPayments.length}{" "}
            {monthsWithPayments.length === 1 ? "month" : "months"}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2 text-left font-medium">Payment date</th>
                <th className="px-3 py-2 text-left font-medium">Method</th>
                <th className="px-3 py-2 text-left font-medium">Reference</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>

            {monthsWithPayments.map((month) => (
              <tbody
                key={month.month}
                className="break-inside-avoid border-t border-slate-200 first:border-t-0"
              >
                <tr className="bg-slate-100/80">
                  <td colSpan={3} className="px-3 py-1.5 font-semibold">
                    {monthName(month.month)} {year}
                  </td>
                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                    {money(month.total)}
                  </td>
                </tr>

                {month.payments.map((payment) => (
                  <tr key={payment.id} className="break-inside-avoid">
                    <td className="px-3 py-1 whitespace-nowrap">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-3 py-1">
                      {methodLabel(payment.paymentMethod)}
                    </td>
                    <td className="px-3 py-1 text-slate-500">
                      {payment.reference || "—"}
                    </td>
                    <td className="px-3 py-1 text-right tabular-nums">
                      {money(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}

            {monthsWithPayments.length === 0 && (
              <tbody>
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No salary payments in {year}.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end break-inside-avoid">
        <div className="flex w-full max-w-[320px] justify-between border-t border-slate-200 pt-3 text-base font-semibold">
          <span>Total paid in {year}</span>
          <span className="tabular-nums">{money(salary.totalPaid)}</span>
        </div>
      </div>

      <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-5">
        <p className="text-center text-xs text-slate-500">
          This is a record of salary paid by {business.name}.
        </p>
      </div>
    </div>
  );
}

interface SalaryStatementPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: number;
  year: number;
}

export default function SalaryStatementPreview({
  open,
  onOpenChange,
  workerId,
  year,
}: SalaryStatementPreviewProps) {
  const [statement, setStatement] = useState<WorkerSalaryStatement | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(
          `/api/workers/${workerId}/salary/statement?year=${year}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load salary statement.");
        }

        setStatement(data as WorkerSalaryStatement);
        setStatus("success");
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Failed to load salary statement.",
        );
        setStatus("error");
      }
    }

    void load();

    return () => controller.abort();
  }, [open, workerId, year, reloadKey]);

  const current =
    statement && statement.worker.id === workerId && statement.year === year
      ? statement
      : null;

  const showError = status === "error" && !current;
  const showLoading = !current && !showError;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: current
      ? `Salary-${year}-${current.worker.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
      : "Salary-Statement",
    pageStyle: PRINT_PAGE_STYLE,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Salary Statement
          </DialogTitle>
          <DialogDescription>
            {current
              ? `${year} · ${current.worker.name}`
              : "Review the statement, then print it or save it as a PDF."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/50 p-4 sm:p-6">
          {showLoading && (
            <div
              className="mx-auto max-w-[794px] space-y-6 rounded-sm bg-white p-10 ring-1 ring-slate-200"
              aria-busy="true"
            >
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {showError && (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-medium text-destructive">
                Unable to load salary statement
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
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

          {current && (
            <div className="overflow-x-auto">
              <div
                ref={printRef}
                className="mx-auto max-w-[794px] min-w-[640px] rounded-sm bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-12"
              >
                <StatementDocument statement={current} />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button type="button" disabled={!current} onClick={() => handlePrint()}>
            <Printer />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}