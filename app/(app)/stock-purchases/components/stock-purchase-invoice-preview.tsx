
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
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

const BILL_WIDTH = 704;
const PAGE_MARGIN_MM = 12;

const PRINT_PAGE_STYLE = `
  @page { size: A4; margin: ${PAGE_MARGIN_MM}mm; }
  html, body { background: #fff; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bill-export { width: 100% !important; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
`;

type LoadStatus = "idle" | "loading" | "success" | "error";

type InvoiceData = {
  purchase: {
    id: number;
    purchaseNumber: string | null;
    purchaseDate: string;
    subtotal: number;
    tax: number;
    total: number;
    paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
    paidAmount: number;
    outstandingAmount: number;
    notes: string | null;
  };
  business: {
    name: string;
    logoPath: string | null;
    currency: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  };
  supplier: {
    name: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    taxRegistrationNumber: string | null;
  } | null;
  items: {
    id: number;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }[];
  payments: {
    id: number;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    reference: string | null;
    notes: string | null;
  }[];
  taxRegistrations: {
    taxSystem: string | null;
    registrationNumber: string | null;
  }[];
  businessRegistrations: {
    registrationType: string | null;
    registrationNumber: string | null;
  }[];
};

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

  const date = new Date(
    value.includes("T") ? value : `${value}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function slugify(value: string) {
  return (
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
    "purchase"
  );
}

function PurchaseInvoiceDocument({ data }: { data: InvoiceData }) {
  const { purchase, business, supplier } = data;
  const money = (amount: number) => formatMoney(amount, business.currency);

  const statusStyles = {
    PAID: "bg-emerald-50 text-emerald-700",
    PARTIAL: "bg-amber-50 text-amber-700",
    UNPAID: "bg-red-50 text-red-700",
  };

  const statusLabels = {
    PAID: "Paid",
    PARTIAL: "Partially Paid",
    UNPAID: "Unpaid",
  };

  const address = [
    business.address,
    business.city,
    business.state,
    business.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const supplierAddress = [
    supplier?.address,
    supplier?.city,
    supplier?.state,
    supplier?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

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
          ) : null}

          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">
              {business.name}
            </h2>

            {address && (
              <p className="mt-2 text-sm text-slate-600">{address}</p>
            )}

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {business.phone && <span>{business.phone}</span>}
              {business.email && <span>{business.email}</span>}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Purchase Invoice
          </p>
          <p className="mt-1 text-lg font-semibold">
            {purchase.purchaseNumber || `PUR-${String(purchase.id).padStart(5, "0")}`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(purchase.purchaseDate)}
          </p>
        </div>
      </div>

      {/* Supplier details and status */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-5">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Supplier
          </p>
          <p className="mt-1 font-semibold">
            {supplier?.name || "No supplier recorded"}
          </p>

          {supplier?.contactPerson && (
            <p className="mt-1 text-sm text-slate-600">
              Contact: {supplier.contactPerson}
            </p>
          )}

          {supplierAddress && (
            <p className="mt-1 text-sm text-slate-600">{supplierAddress}</p>
          )}

          {supplier?.phone && (
            <p className="mt-1 text-sm text-slate-600">{supplier.phone}</p>
          )}

          {supplier?.email && (
            <p className="mt-1 text-sm text-slate-600">{supplier.email}</p>
          )}

          {supplier?.taxRegistrationNumber && (
            <p className="mt-1 text-sm text-slate-600">
              Tax registration: {supplier.taxRegistrationNumber}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyles[purchase.paymentStatus]}`}
        >
          {statusLabels[purchase.paymentStatus]}
        </span>
      </div>

      {/* Purchased items */}
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
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Tax
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {data.items.map((item) => (
                <tr
                  key={item.id}
                  className="break-inside-avoid border-b border-slate-200 last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {item.productName}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.taxRate ?? 0}%
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
            <span className="tabular-nums">{money(purchase.subtotal)}</span>
          </div>

          {purchase.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span className="tabular-nums">{money(purchase.tax)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
            <span>Purchase Total</span>
            <span className="tabular-nums">{money(purchase.total)}</span>
          </div>

          {purchase.paidAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-700">
              <span>Paid</span>
              <span className="tabular-nums">{money(purchase.paidAmount)}</span>
            </div>
          )}

          {purchase.outstandingAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-red-600">
              <span>Balance Due</span>
              <span className="tabular-nums">
                {money(purchase.outstandingAmount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payment history */}
      {data.payments.length > 0 && (
        <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-6">
          <h3 className="mb-4 text-base font-semibold">Payment History</h3>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Method
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Reference
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-200 last:border-0">
                    <td className="px-3 py-2">{formatDate(payment.paymentDate)}</td>
                    <td className="px-3 py-2">{payment.paymentMethod}</td>
                    <td className="px-3 py-2">{payment.reference || "-"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {money(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {purchase.notes && (
        <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-5">
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Notes
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {purchase.notes}
          </p>
        </div>
      )}

      <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-5">
        {[
          ...data.taxRegistrations
            .filter((item) => item.registrationNumber)
            .map((item) => ({
              label: item.taxSystem || "Tax Registration",
              value: item.registrationNumber!,
            })),
          ...data.businessRegistrations
            .filter((item) => item.registrationNumber)
            .map((item) => ({
              label: item.registrationType || "Business Registration",
              value: item.registrationNumber!,
            })),
        ].length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            {[
              ...data.taxRegistrations
                .filter((item) => item.registrationNumber)
                .map((item) => ({
                  label: item.taxSystem || "Tax Registration",
                  value: item.registrationNumber!,
                })),
              ...data.businessRegistrations
                .filter((item) => item.registrationNumber)
                .map((item) => ({
                  label: item.registrationType || "Business Registration",
                  value: item.registrationNumber!,
                })),
            ].map((registration, index) => (
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
          Purchase invoice generated by {business.name}.
        </p>
      </div>
    </div>
  );
}

interface Props {
  purchaseId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockPurchaseInvoicePreview({
  purchaseId,
  open,
  onOpenChange,
}: Props) {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || purchaseId === null) return;

    const controller = new AbortController();

    async function loadInvoice() {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(
          `/api/stock-purchases/${purchaseId}/invoice`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Failed to load purchase invoice.");
        }

        setData(result as InvoiceData);
        setStatus("success");
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Failed to load purchase invoice.",
        );
        setStatus("error");
      }
    }

    void loadInvoice();

    return () => controller.abort();
  }, [open, purchaseId, reloadKey]);

  useEffect(() => {
    setExportError(null);
  }, [open, purchaseId]);

  const current = data && data.purchase.id === purchaseId ? data : null;
  const showError = status === "error" && !current;
  const showLoading = !current && !showError;

  const baseName = current
    ? `Purchase-${current.purchase.purchaseNumber || current.purchase.id}-${slugify(current.supplier?.name || "supplier")}`
    : "Purchase-Invoice";

  const handlePrint = useReactToPrint({
    contentRef: exportRef,
    documentTitle: baseName,
    pageStyle: PRINT_PAGE_STYLE,
  });

  async function handleDownload() {
    const node = exportRef.current;
    if (!node || !current) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        onclone: (_document, clonedNode) => {
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

      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height) {
        const sliceHeight = Math.min(
          sliceHeightPx,
          canvas.height - offsetY,
        );

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
      console.error("Failed to generate purchase invoice PDF:", err);
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
              Purchase Invoice Preview
            </DialogTitle>
            <DialogDescription>
              {current
                ? `${current.purchase.purchaseNumber || `PUR-${String(current.purchase.id).padStart(5, "0")}`} · ${current.supplier?.name || "No supplier"}`
                : "Review the purchase invoice before printing or saving it as a PDF."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto bg-muted/50 p-4 sm:p-6">
            {showLoading && (
              <div
                className="mx-auto max-w-[794px] space-y-6 rounded-sm bg-white p-10 ring-1 ring-slate-200"
                aria-busy="true"
                aria-label="Loading purchase invoice"
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
                  Unable to load purchase invoice
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
                  <PurchaseInvoiceDocument data={current} />
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
                onClick={() => void handleDownload()}
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

      {current && typeof document !== "undefined" &&
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
              <PurchaseInvoiceDocument data={current} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
