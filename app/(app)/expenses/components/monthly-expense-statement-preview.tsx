"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Download,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Tag,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAYMENT_METHOD_OPTIONS } from "@/common";
import { getFileUrl } from "@/lib/files/urls";
import { collectBlocks, findSliceEnd } from "@/lib/pdf/page-breaks";
import type {
  ExpenseCategoryOption,
  ExpenseStatementData,
} from "@/lib/types/expense";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

type PrintMode = "summary" | "full" | "none";
type LoadStatus = "idle" | "loading" | "success" | "error";
type Loaded = { key: string; data: ExpenseStatementData };

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

const PRINT_MODES: { value: PrintMode; label: string; hint: string }[] = [
  {
    value: "summary",
    label: "Category totals",
    hint: "One row per category with its total. Individual expenses are not listed.",
  },
  {
    value: "full",
    label: "Full entries",
    hint: "Every expense, grouped by category.",
  },
  {
    value: "none",
    label: "No entries",
    hint: "Business details and the monthly total only.",
  },
];

const isPrintMode = (value: string): value is PrintMode =>
  PRINT_MODES.some((mode) => mode.value === value);

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

function formatMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;

  const [year, month] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "all-categories"
  );
}

const methodLabel = (method: string) =>
  PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
  method;

/* -------------------------------------------------------------------------- */
/* Categories: summary                                                        */
/* -------------------------------------------------------------------------- */

function CategorySummaryTable({
  data,
  money,
}: {
  data: ExpenseStatementData;
  money: (amount: number) => string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="w-10 px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Category</th>
            <th className="px-3 py-2 text-right font-medium">Expenses</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>

        <tbody>
          {data.categories.map((category, index) => (
            <tr
              key={category.categoryId ?? "none"}
              className="break-inside-avoid border-b border-slate-100 last:border-b-0"
            >
              <td className="px-3 py-1.5 text-slate-500 tabular-nums">{index + 1}</td>
              <td className="px-3 py-1.5 font-medium">{category.name}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{category.count}</td>
              <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                {money(category.total)}
              </td>
            </tr>
          ))}

          {data.categories.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                No expenses for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Categories: full (category band + expense rows)                            */
/* -------------------------------------------------------------------------- */

function ExpensesFullTable({
  data,
  money,
}: {
  data: ExpenseStatementData;
  money: (amount: number) => string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-[11px] leading-tight">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="px-3 py-1.5 text-left font-medium">Date</th>
            <th className="px-3 py-1.5 text-left font-medium">Description</th>
            <th className="px-3 py-1.5 text-left font-medium">Method</th>
            <th className="px-3 py-1.5 text-left font-medium">Reference</th>
            <th className="px-3 py-1.5 text-right font-medium">Amount</th>
          </tr>
        </thead>

        {data.categories.map((category) => (
          <tbody
            key={category.categoryId ?? "none"}
            className="break-inside-avoid border-t border-slate-200 first:border-t-0"
          >
            <tr className="bg-slate-100/80">
              <td colSpan={4} className="px-3 py-1 font-semibold">
                {category.name}
                <span className="ml-2 font-normal text-slate-500">
                  {category.count} {category.count === 1 ? "expense" : "expenses"}
                </span>
              </td>
              <td className="px-3 py-1 text-right font-semibold tabular-nums">
                {money(category.total)}
              </td>
            </tr>

            {data.expenses
              .filter((expense) => expense.categoryId === category.categoryId)
              .map((expense) => (
                <tr key={expense.id} className="break-inside-avoid">
                  <td className="py-0.5 pr-3 pl-6 whitespace-nowrap">
                    {formatDate(expense.expenseDate)}
                  </td>
                  <td className="px-3 py-0.5">{expense.description}</td>
                  <td className="px-3 py-0.5">{methodLabel(expense.paymentMethod)}</td>
                  <td className="px-3 py-0.5 text-slate-500">
                    {expense.reference || "—"}
                  </td>
                  <td className="px-3 py-0.5 text-right tabular-nums">
                    {money(expense.amount)}
                  </td>
                </tr>
              ))}
          </tbody>
        ))}

        {data.categories.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                No expenses for this period.
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Statement document                                                         */
/* -------------------------------------------------------------------------- */

function StatementDocument({
  data,
  mode,
  categoryName,
}: {
  data: ExpenseStatementData;
  mode: PrintMode;
  categoryName: string | null; // null = all categories
}) {
  const { business, totals } = data;

  const money = (amount: number) => formatMoney(amount, business.currency);

  const registrations = [
    ...data.taxRegistrations
      .filter((registration) => registration.registrationNumber)
      .map((registration) => ({
        label: registration.taxSystem,
        value: registration.registrationNumber,
      })),
    ...data.businessRegistrations
      .filter((registration) => registration.registrationNumber)
      .map((registration) => ({
        label: registration.registrationType,
        value: registration.registrationNumber,
      })),
  ];

  const showEntries = mode !== "none";

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
            <h2 className="text-xl font-semibold tracking-tight">{business.name}</h2>

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
            Expenses
          </p>
          <p className="mt-1 text-lg font-semibold">Statement</p>
          <p className="mt-1 text-sm text-slate-500">{formatMonth(data.month)}</p>
        </div>
      </div>

      {/* Category */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-5">
        <div>
          <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
            Spending On
          </p>

          <div className="mt-1 flex items-center gap-2">
            <Tag className="size-4 text-slate-500" />
            <p className="font-semibold">{categoryName ?? "All categories"}</p>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {totals.expenseCount}{" "}
            {totals.expenseCount === 1 ? "expense" : "expenses"}
          </p>
        </div>
      </div>

      {/* Entries (hidden in "No entries" mode) */}
      {showEntries && (
        <div className="py-6">
          <div className="mb-3">
            <h3 className="text-base font-semibold">
              Expenses — {formatMonth(data.month)}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {data.categories.length}{" "}
              {data.categories.length === 1 ? "category" : "categories"}
            </p>
          </div>

          {mode === "full" ? (
            <ExpensesFullTable data={data} money={money} />
          ) : (
            <CategorySummaryTable data={data} money={money} />
          )}
        </div>
      )}

      {/* Total */}
      <div
        className={`flex justify-end break-inside-avoid ${showEntries ? "" : "pt-6"}`}
      >
        <div className="w-full max-w-[320px] space-y-3">
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
            <span>Total Expenses</span>
            <span className="tabular-nums">{money(totals.totalAmount)}</span>
          </div>
        </div>
      </div>

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
          Generated by {business.name}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

export function MonthlyExpenseStatementPreview({
  open,
  onOpenChange,
  month,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string; // yyyy-MM
  categories: ExpenseCategoryOption[];
}) {
  const [categoryId, setCategoryId] = useState("all");
  const [mode, setMode] = useState<PrintMode>("summary");

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);

  const key = `${month}|${categoryId}`;

  const selectedCategory = useMemo(
    () =>
      categoryId === "all"
        ? null
        : (categories.find((category) => String(category.id) === categoryId) ??
          null),
    [categoryId, categories],
  );

  /* ---------------------------------------------------------------------- */
  /* Load statement                                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!open || !month) return;

    const controller = new AbortController();

    async function loadStatement() {
      setStatus("loading");
      setError(null);

      try {
        const params = new URLSearchParams({ month });
        if (categoryId !== "all") params.set("categoryId", categoryId);

        const response = await fetch(
          `/api/expenses/monthly-statement?${params.toString()}`,
          { method: "GET", cache: "no-store", signal: controller.signal },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error ?? "Unable to load the monthly statement.");
        }

        setLoaded({ key, data: result as ExpenseStatementData });
        setStatus("success");
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the monthly statement.",
        );
        setStatus("error");
      }
    }

    void loadStatement();

    return () => controller.abort();
  }, [open, month, categoryId, key, reloadKey]);

  useEffect(() => {
    setExportError(null);
  }, [open, month, categoryId]);

  // Category totals and all categories are the defaults every time the dialog opens
  useEffect(() => {
    if (open) {
      setMode("summary");
      setCategoryId("all");
    }
  }, [open]);

  /* ---------------------------------------------------------------------- */
  /* Current statement                                                      */
  /* ---------------------------------------------------------------------- */

  const current = loaded && loaded.key === key ? loaded.data : null;

  const showError = status === "error" && !current;
  const showLoading = !current && !showError;

  const baseName = `Expenses-${month}-${slugify(
    selectedCategory?.name ?? "all-categories",
  )}`;

  const activeMode =
    PRINT_MODES.find((option) => option.value === mode) ?? PRINT_MODES[0];

  /* ---------------------------------------------------------------------- */
  /* Print                                                                  */
  /* ---------------------------------------------------------------------- */

  const handlePrint = useReactToPrint({
    contentRef: exportRef,
    documentTitle: baseName,
    pageStyle: PRINT_PAGE_STYLE,
  });

  /* ---------------------------------------------------------------------- */
  /* Download PDF                                                           */
  /* ---------------------------------------------------------------------- */

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
      const pageHeightPx = Math.floor(contentHeight * pxPerMm);
      const domRatio = canvas.width / node.offsetWidth;

      const blocks = collectBlocks(node, domRatio);

      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height) {
        const maxEnd = Math.min(offsetY + pageHeightPx, canvas.height);

        const endY =
          maxEnd >= canvas.height
            ? canvas.height
            : findSliceEnd(offsetY, maxEnd, blocks, pageHeightPx);

        const sliceHeight = Math.max(1, endY - offsetY);

        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;

        const context = slice.getContext("2d");

        if (!context) {
          throw new Error("Could not prepare the PDF page.");
        }

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
      console.error("Failed to generate the expense statement PDF:", err);

      setExportError(
        "Couldn't generate the PDF. Try Print and choose Save as PDF instead.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-4xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Monthly Expense Statement
            </DialogTitle>

            <DialogDescription>
              {current
                ? `${formatMonth(month)} · ${
                    selectedCategory?.name ?? "All categories"
                  }`
                : "Review the monthly statement before printing or saving it as a PDF."}
            </DialogDescription>
          </DialogHeader>

          {/* Category + print mode */}
          <div className="flex shrink-0 flex-col gap-3 border-b px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={categoryId}
                onValueChange={(value) => setCategoryId(value ?? "all")}
                disabled={isExporting}
              >
                <SelectTrigger className="w-full sm:w-56" aria-label="Category">
                  <SelectValue placeholder="All categories">
                    {selectedCategory?.name ?? "All categories"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs
                value={mode}
                onValueChange={(value) => {
                  if (isPrintMode(value)) setMode(value);
                }}
              >
                <TabsList>
                  {PRINT_MODES.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      disabled={isExporting}
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <p className="text-xs text-muted-foreground">{activeMode.hint}</p>
          </div>

          {/* Scrollable preview */}
          <div className="min-h-0 flex-1 overflow-auto bg-muted/50 p-4 sm:p-6">
            {showLoading && (
              <div
                className="mx-auto max-w-[794px] space-y-6 rounded-sm bg-white p-10 ring-1 ring-slate-200"
                aria-busy="true"
                aria-label="Loading monthly statement"
              >
                <div className="flex justify-between gap-6">
                  <div className="flex gap-4">
                    <Skeleton className="size-16 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-32" />
                </div>

                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {showError && (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm font-medium text-destructive">
                  Unable to load monthly statement
                </p>

                <p className="text-sm text-muted-foreground">{error}</p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadKey((value) => value + 1)}
                >
                  <RefreshCw />
                  Try again
                </Button>
              </div>
            )}

            {current && (
              <div className="overflow-x-auto">
                <div className="mx-auto max-w-[794px] min-w-[640px] rounded-sm bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-12">
                  <StatementDocument
                    data={current}
                    mode={mode}
                    categoryName={selectedCategory?.name ?? null}
                  />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                disabled={!current || isExporting}
                onClick={handleDownload}
              >
                {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
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

      {/* Hidden fixed-width print/PDF copy */}
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
              <StatementDocument
                data={current}
                mode={mode}
                categoryName={selectedCategory?.name ?? null}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}