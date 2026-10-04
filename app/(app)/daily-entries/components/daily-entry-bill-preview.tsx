// app/(app)/daily-entries/components/daily-entry-bill-preview.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  UserRound,
} from "lucide-react";
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
import type { DailyEntryBill } from "@/lib/types/daily-entry";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A4 is 210mm wide. With 12mm margins on each side the printable width is
 * 186mm, which is 704px at 96dpi. The hidden export node uses exactly this
 * width, so print and PDF share one layout whatever size the screen is.
 */
const BILL_WIDTH = 704;
const PAGE_MARGIN_MM = 12;

const PRINT_PAGE_STYLE = `
  @page { size: A4; margin: ${PAGE_MARGIN_MM}mm; }
  html, body { background: #fff; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bill-export { width: 100% !important; }
`;

type LoadStatus = "idle" | "loading" | "success" | "error";
type PaymentStatus = DailyEntryBill["entry"]["paymentStatus"];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "customer"
  );
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PARTIAL: "Partially Paid",
  UNPAID: "Unpaid",
};

const STATUS_CLASS: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  UNPAID: "bg-red-50 text-red-700",
};

/* -------------------------------------------------------------------------- */
/* The bill itself (pure presentation, explicit colours so it looks the same  */
/* in the preview, in print and in the PDF, light or dark theme)              */
/* -------------------------------------------------------------------------- */

function BillDocument({ bill }: { bill: DailyEntryBill }) {
  const { entry, business, customer } = bill;
  const details = bill.paymentDetails;
  const money = (amount: number) => formatMoney(amount, business.currency);

  const isMonthly = entry.paymentType === "MONTHLY";

  const showPaymentSection =
    !isMonthly && entry.paymentStatus !== "PAID" && entry.outstandingAmount > 0;

  const showQr = showPaymentSection && Boolean(details?.showQr && details.qrImagePath);

  const bankRows: [string, string | null | undefined][] = [
    ["Account Name", details?.accountName],
    ["Bank", details?.bankName],
    ["Account Number", details?.accountNumber],
    ["Branch", details?.branchName],
    ["Routing Code", details?.routingCode],
    ["Payment ID", details?.paymentIdentifier],
  ];

  const visibleBankRows = bankRows.filter(([, value]) => Boolean(value));

  const showBank =
    showPaymentSection &&
    Boolean(details?.showBankDetails) &&
    visibleBankRows.length > 0;

  const showInstructions =
    showPaymentSection && Boolean(details?.paymentInstructions);

  const hasPaymentContent = showQr || showBank || showInstructions;

  const registrations = [
    ...bill.taxRegistrations
      .filter((r) => r.registrationNumber)
      .map((r) => ({ label: r.taxSystem, value: r.registrationNumber })),
    ...bill.businessRegistrations
      .filter((r) => r.registrationNumber)
      .map((r) => ({ label: r.registrationType, value: r.registrationNumber })),
  ];

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
            Bill
          </p>
          <p className="mt-1 text-lg font-semibold">#{entry.id}</p>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(entry.entryDate)}
          </p>
        </div>
      </div>

      {/* Customer */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-5">
        <div>
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Bill To
          </p>
          <div className="mt-1 flex items-center gap-2">
            <UserRound className="size-4 text-slate-500" />
            <p className="font-semibold">{customer.name}</p>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {customer.type === "BUSINESS"
              ? "Business Customer"
              : "Personal Customer"}
          </p>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isMonthly
              ? "bg-sky-50 text-sky-700"
              : STATUS_CLASS[entry.paymentStatus]
          }`}
        >
          {isMonthly ? "Monthly Account" : STATUS_LABEL[entry.paymentStatus]}
        </div>
      </div>

      {/* Items */}
      <div className="py-6">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Item
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Qty
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Price
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {entry.items.map((item) => (
                <tr
                  key={item.id}
                  className="break-inside-avoid border-b border-slate-200 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-slate-500">
                      Per {item.unit}
                      {item.taxRate > 0 && ` · Tax ${item.taxRate}%`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {money(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end break-inside-avoid">
        <div className="w-full max-w-[320px] space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="tabular-nums">{money(entry.subtotal)}</span>
          </div>

          {entry.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Discount</span>
              <span className="tabular-nums">-{money(entry.discount)}</span>
            </div>
          )}

          {entry.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span className="tabular-nums">{money(entry.tax)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{money(entry.total)}</span>
          </div>

          {isMonthly ? (
            <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
              This amount will be billed on {customer.name}&apos;s monthly
              account statement.
            </p>
          ) : (
            <>
              {entry.paidAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Paid</span>
                  <span className="tabular-nums">{money(entry.paidAmount)}</span>
                </div>
              )}

              {entry.outstandingAmount > 0 && (
                <div className="flex justify-between text-sm font-semibold text-red-600">
                  <span>Amount Due</span>
                  <span className="tabular-nums">
                    {money(entry.outstandingAmount)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment details */}
      {showPaymentSection && hasPaymentContent && (
        <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold">Payment Details</h3>
            <p className="mt-1 text-sm text-slate-500">
              Please pay the outstanding amount.
            </p>
          </div>

          {(showQr || showBank) && (
            <div className="grid grid-cols-2 gap-6">
              {showQr && (
                <div className="flex flex-col items-center rounded-xl border border-slate-200 p-5">
                  <p className="mb-3 text-sm font-medium">Scan to Pay</p>

                  <div className="size-40 overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
                    <img
                      src={getFileUrl(details?.qrImagePath) ?? ""}
                      alt="Payment QR Code"
                      className="size-full object-contain"
                    />
                  </div>

                  {details?.paymentIdentifier && (
                    <p className="mt-3 text-center text-xs text-slate-500">
                      {details.paymentIdentifier}
                    </p>
                  )}
                </div>
              )}

              {showBank && (
                <div
                  className={`rounded-xl border border-slate-200 p-5 ${
                    showQr ? "" : "col-span-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="size-4" />
                    <p className="text-sm font-medium">Bank Details</p>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    {visibleBankRows.map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-right font-medium break-all">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {showInstructions && (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-800">Payment Instructions</p>
              <p className="mt-1 whitespace-pre-wrap">
                {details?.paymentInstructions}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-5">
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Notes
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap text-slate-600">
            {entry.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-5">
        {registrations.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            {registrations.map((registration, index) => (
              <span key={`${registration.label}-${index}`}>
                {registration.label}:{" "}
                <span className="font-medium text-slate-700">
                  {registration.value}
                </span>
              </span>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-500">
          Thank you for your business.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

interface DailyEntryBillPreviewProps {
  entryId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyEntryBillPreview({
  entryId,
  open,
  onOpenChange,
}: DailyEntryBillPreviewProps) {
  const [bill, setBill] = useState<DailyEntryBill | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Hidden, fixed-width copy of the bill used for printing and the PDF
  const exportRef = useRef<HTMLDivElement>(null);

  /* ---- Load the bill (aborts if the dialog closes or the id changes) ---- */
  useEffect(() => {
    if (!open || entryId === null) return;

    const controller = new AbortController();

    async function loadBill() {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(`/api/daily-entries/${entryId}/bill`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load bill.");
        }

        setBill(data as DailyEntryBill);
        setStatus("success");
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(err instanceof Error ? err.message : "Failed to load bill.");
        setStatus("error");
      }
    }

    void loadBill();

    return () => controller.abort();
  }, [open, entryId, reloadKey]);

  useEffect(() => {
    setExportError(null);
  }, [open, entryId]);

  // Never show a bill that belongs to a different entry
  const current = bill && bill.entry.id === entryId ? bill : null;
  const showError = status === "error" && !current;
  const showLoading = !current && !showError;

  const baseName = current
    ? `Bill-${current.entry.id}-${slugify(current.customer.name)}`
    : "Bill";

  /* ---- Print (browser print dialog, crisp text, "Save as PDF" works too) ---- */
  const handlePrint = useReactToPrint({
    contentRef: exportRef,
    documentTitle: baseName,
    pageStyle: PRINT_PAGE_STYLE,
  });

  /* ---- Download PDF (A4, multi-page) ---- */
  async function handleDownload() {
    const node = exportRef.current;

    if (!node || !current) return;

    setIsExporting(true);
    setExportError(null);

    try {
      // Loaded on demand so they don't weigh down the page bundle
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: 1200, // desktop layout, whatever the current screen is
        onclone: (_document, clonedNode) => {
          // Bring the off-screen wrapper into view inside the clone
          const wrapper = clonedNode.parentElement;

          if (wrapper) {
            wrapper.style.left = "0";
            wrapper.style.top = "0";
          }
        },
      });

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - PAGE_MARGIN_MM * 2;
      const contentHeight = pageHeight - PAGE_MARGIN_MM * 2;

      const pxPerMm = canvas.width / contentWidth;
      const sliceHeightPx = Math.floor(contentHeight * pxPerMm);

      // Cut the tall canvas into page-sized slices
      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height) {
        const sliceHeight = Math.min(sliceHeightPx, canvas.height - offsetY);

        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;

        const context = slice.getContext("2d");
        if (!context) throw new Error("Could not prepare the PDF page.");

        context.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight,
        );

        if (pageIndex > 0) pdf.addPage();

        pdf.addImage(
          slice.toDataURL("image/png"),
          "PNG",
          PAGE_MARGIN_MM,
          PAGE_MARGIN_MM,
          contentWidth,
          sliceHeight / pxPerMm,
        );

        offsetY += sliceHeight;
        pageIndex += 1;
      }

      const totalPages = pdf.getNumberOfPages();

      if (totalPages > 1) {
        pdf.setFontSize(8);
        pdf.setTextColor(120);

        for (let page = 1; page <= totalPages; page++) {
          pdf.setPage(page);
          pdf.text(`Page ${page} of ${totalPages}`, pageWidth / 2, pageHeight - 6, {
            align: "center",
          });
        }
      }

      pdf.save(`${baseName}.pdf`);
    } catch (err) {
      console.error("Failed to generate the PDF:", err);

      setExportError(
        "Couldn't generate the PDF. Try Print and choose Save as PDF instead.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-4xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Bill Preview
            </DialogTitle>
            <DialogDescription>
              {current
                ? `Bill #${current.entry.id} · ${current.customer.name}`
                : "Review the bill before printing or saving it as a PDF."}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable "desk" with the paper on it */}
          <div className="min-h-0 flex-1 overflow-auto bg-muted/50 p-4 sm:p-6">
            {showLoading && (
              <div
                className="mx-auto max-w-[794px] space-y-6 rounded-sm bg-white p-10 ring-1 ring-slate-200"
                aria-busy="true"
                aria-label="Loading bill"
              >
                <div className="flex justify-between gap-6">
                  <div className="flex gap-4">
                    <Skeleton className="size-16 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-24" />
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            )}

            {showError && (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm font-medium text-destructive">
                  Unable to load bill
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
                <div className="mx-auto max-w-[794px] min-w-[640px] rounded-sm bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-12">
                  <BillDocument bill={current} />
                </div>
              </div>
            )}
          </div>

          {exportError && (
            <p
              role="alert"
              className="shrink-0 border-t bg-destructive/10 px-6 py-2 text-sm text-destructive"
            >
              {exportError}
            </p>
          )}

          {/* Fixed footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                disabled={!current || isExporting}
                onClick={handleDownload}
              >
                {isExporting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
                {isExporting ? "Creating PDF..." : "Download PDF"}
              </Button>

              <Button
                type="button"
                disabled={!current || isExporting}
                onClick={() => handlePrint()}
              >
                <Printer />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden fixed-width copy: the single source for printing and the PDF.
          Portalled to <body> so the dialog's transform can't affect it. */}
      {current &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed top-0 -left-[10000px]"
          >
            <div
              ref={exportRef}
              className="bill-export bg-white text-slate-900"
              style={{ width: BILL_WIDTH }}
            >
              <BillDocument bill={current} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}