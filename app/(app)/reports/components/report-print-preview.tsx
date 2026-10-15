"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Download,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Printer,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFileUrl } from "@/lib/files/urls";
import { collectBlocks, findSliceEnd } from "@/lib/pdf/page-breaks";
import { pctChange } from "@/lib/reports/health";
import type { ReportData } from "@/lib/types/report";
import { formatMoney } from "@/app/(app)/stock-purchases/components/stock-purchase-shared";

import { ReportCharts } from "./report-charts";
import {
  HEALTH_STYLES,
  formatChange,
  formatPercent,
  formatQuantity,
} from "./report-format";
import { ScoreRing, TREND } from "./report-health-card";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

type PrintMode = "summary" | "charts" | "full";

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
    label: "Summary",
    hint: "Health score, profit and loss, outstanding balances and highlights.",
  },
  {
    value: "charts",
    label: "With charts",
    hint: "Everything in the summary plus six charts.",
  },
  {
    value: "full",
    label: "Full report",
    hint: "Charts, top lists, dues and the full breakdown table.",
  },
];

const isPrintMode = (value: string): value is PrintMode =>
  PRINT_MODES.some((mode) => mode.value === value);

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function SimpleTable({
  head,
  rows,
  right = [],
  foot,
}: {
  head: string[];
  rows: string[][];
  right?: number[];
  foot?: string[];
}) {
  const align = (index: number) =>
    right.includes(index) ? "text-right tabular-nums" : "text-left";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-[11px] leading-tight">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200 text-slate-600">
            {head.map((cell, index) => (
              <th key={index} className={`px-3 py-1.5 font-medium ${align(index)}`}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="px-3 py-5 text-center text-slate-500">
                Nothing to show for this period.
              </td>
            </tr>
          )}

          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="break-inside-avoid border-b border-slate-100 last:border-b-0"
            >
              {row.map((cell, index) => (
                <td key={index} className={`px-3 py-1 ${align(index)}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {foot && (
          <tfoot className="bg-slate-50 font-semibold">
            <tr className="border-t border-slate-200">
              {foot.map((cell, index) => (
                <td key={index} className={`px-3 py-1.5 ${align(index)}`}>
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Report document                                                            */
/* -------------------------------------------------------------------------- */

function ReportDocument({
  report,
  mode,
}: {
  report: ReportData;
  mode: PrintMode;
}) {
  const { business, period, totals, previous, health, insights, outstanding } = report;

  const money = (amount: number) => formatMoney(amount, business.currency || "INR");
  const style = HEALTH_STYLES[health.status];
  const trend = TREND[health.trend];
  const unit = period.type === "month" ? "Day" : "Month";

  const change = (current: number, before: number) =>
    formatChange(pctChange(current, before));

  const registrations = [
    ...report.taxRegistrations
      .filter((item) => item.registrationNumber)
      .map((item) => ({ label: item.taxSystem, value: item.registrationNumber })),
    ...report.businessRegistrations
      .filter((item) => item.registrationNumber)
      .map((item) => ({ label: item.registrationType, value: item.registrationNumber })),
  ];

  const periodRows = report.series.filter(
    (point) =>
      period.type === "year" ||
      point.sales || point.purchases || point.expenses || point.salaries,
  );

  const rowLabel = (key: string) =>
    period.type === "month"
      ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
          new Date(`${key}T00:00:00`),
        )
      : new Intl.DateTimeFormat("en-IN", { month: "long" }).format(
          new Date(`${key}-01T00:00:00`),
        );

  const generated = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(report.generatedAt));

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
              <p className="mt-0.5 text-sm text-slate-500">{business.businessCategory}</p>
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
            {period.type === "month" ? "Monthly" : "Yearly"} Business
          </p>
          <p className="mt-1 text-lg font-semibold">Report</p>
          <p className="mt-1 text-sm text-slate-500">{period.label}</p>
        </div>
      </div>

      {/* Health */}
      <div className="break-inside-avoid border-b border-slate-200 py-6">
        <div className="flex items-center gap-6">
          <ScoreRing score={health.score} color={style.color} size={112} />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Business health
            </p>
            <p className="mt-1 text-lg font-semibold" style={{ color: style.color }}>
              {health.label}
            </p>
            <p className="mt-1 text-xs text-slate-600">{health.summary}</p>
            <p className="mt-1 text-xs text-slate-500">{trend.label(period.previousLabel)}</p>
          </div>
        </div>

        {health.components.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
            {health.components.map((item) => (
              <div key={item.key}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{item.label}</span>
                  <span className="tabular-nums text-slate-500">{item.score}/100</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.score}%`, background: style.color }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profit & loss */}
      <Section
        title="Profit & loss"
        note="Profit = sales − stock purchases − expenses − salaries."
      >
        <div className="break-inside-avoid">
          <SimpleTable
            head={["", period.label, period.previousLabel, "Change"]}
            right={[1, 2, 3]}
            rows={[
              ["Sales", money(totals.sales), money(previous.sales), change(totals.sales, previous.sales)],
              ["Less: stock purchases", money(totals.purchases), money(previous.purchases), change(totals.purchases, previous.purchases)],
              ["Less: expenses", money(totals.expenses), money(previous.expenses), change(totals.expenses, previous.expenses)],
              ["Less: salaries", money(totals.salaries), money(previous.salaries), change(totals.salaries, previous.salaries)],
            ]}
            foot={[
              `Profit (${formatPercent(totals.margin)} margin)`,
              money(totals.profit),
              money(previous.profit),
              change(totals.profit, previous.profit),
            ]}
          />
        </div>
      </Section>

      {/* Cash & outstanding */}
      <Section title="Cash & outstanding">
        <div className="grid grid-cols-2 gap-6">
          <div className="break-inside-avoid">
            <SimpleTable
              head={["Cash flow", "Amount"]}
              right={[1]}
              rows={[
                ["Cash received", money(totals.cashIn)],
                ["Paid to suppliers", money(totals.supplierPaid)],
                ["Expenses paid", money(totals.expenses)],
                ["Salaries paid", money(totals.salaries)],
              ]}
              foot={["Net cash", money(totals.netCash)]}
            />
          </div>

          <div className="break-inside-avoid">
            <SimpleTable
              head={["Outstanding at period end", "Amount"]}
              right={[1]}
              rows={[
                ["Customers owe you", money(outstanding.receivable)],
                ["You owe suppliers", money(outstanding.payable)],
                ["Salary due", money(outstanding.salaryDue)],
              ]}
            />
          </div>
        </div>
      </Section>

      {/* Insights */}
      {insights.length > 0 && (
        <Section title="Highlights">
          <ul className="space-y-1.5 text-xs">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full"
                  style={{
                    background:
                      insight.tone === "positive"
                        ? "#16a34a"
                        : insight.tone === "negative"
                          ? "#dc2626"
                          : "#94a3b8",
                  }}
                />
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Charts */}
      {mode !== "summary" && (
        <Section
          title="Charts"
          note={`Amounts in ${business.currency || "INR"}.`}
        >
          <ReportCharts report={report} fixed={{ width: 340, height: 170 }} />
        </Section>
      )}

      {/* Tables */}
      {mode === "full" && (
        <>
          <Section title="Top products">
            <SimpleTable
              head={["Product", "Quantity", "Sales"]}
              right={[1, 2]}
              rows={report.breakdown.products.map((row) => [
                row.name,
                `${formatQuantity(row.quantity)} ${row.unit}`,
                money(row.amount),
              ])}
            />
          </Section>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div>
              <h3 className="mb-3 text-base font-semibold">Top customers</h3>
              <SimpleTable
                head={["Customer", "Entries", "Sales"]}
                right={[1, 2]}
                rows={report.breakdown.customers.map((row) => [
                  row.name,
                  String(row.count),
                  money(row.amount),
                ])}
              />
            </div>

            <div>
              <h3 className="mb-3 text-base font-semibold">Top suppliers</h3>
              <SimpleTable
                head={["Supplier", "Purchases", "Amount"]}
                right={[1, 2]}
                rows={report.breakdown.suppliers.map((row) => [
                  row.name,
                  String(row.count),
                  money(row.amount),
                ])}
              />
            </div>
          </div>

          <Section title="Expense categories">
            <SimpleTable
              head={["Category", "Expenses", "Amount"]}
              right={[1, 2]}
              rows={report.breakdown.expenseCategories.map((row) => [
                row.name,
                String(row.count),
                money(row.amount),
              ])}
              foot={["Total", String(totals.expenseCount), money(totals.expenses)]}
            />
          </Section>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div>
              <h3 className="mb-3 text-sm font-semibold">Customers owe you</h3>
              <SimpleTable
                head={["Customer", "Due"]}
                right={[1]}
                rows={report.dues.customers.map((row) => [row.name, money(row.amount)])}
              />
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">You owe suppliers</h3>
              <SimpleTable
                head={["Supplier", "Due"]}
                right={[1]}
                rows={report.dues.suppliers.map((row) => [row.name, money(row.amount)])}
              />
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Salary due</h3>
              <SimpleTable
                head={["Worker", "Due"]}
                right={[1]}
                rows={report.dues.salaries.map((row) => [row.name, money(row.due)])}
              />
            </div>
          </div>

          <Section title={`${unit}-by-${unit.toLowerCase()} breakdown`}>
            <SimpleTable
              head={[unit, "Sales", "Purchases", "Expenses", "Salaries", "Profit"]}
              right={[1, 2, 3, 4, 5]}
              rows={periodRows.map((point) => [
                rowLabel(point.key),
                money(point.sales),
                money(point.purchases),
                money(point.expenses),
                money(point.salaries),
                money(point.profit),
              ])}
              foot={[
                "Total",
                money(totals.sales),
                money(totals.purchases),
                money(totals.expenses),
                money(totals.salaries),
                money(totals.profit),
              ]}
            />
          </Section>
        </>
      )}

      {/* Footer */}
      <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-5">
        {registrations.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            {registrations.map((item, index) => (
              <span key={`${item.label}-${index}`}>
                {item.label}:{" "}
                <span className="font-medium text-slate-700">{item.value}</span>
              </span>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-500">
          Generated by {business.name} on {generated}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

export function ReportPrintPreview({
  open,
  onOpenChange,
  report,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportData;
}) {
  const [mode, setMode] = useState<PrintMode>("summary");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);

  // Summary is the default every time the dialog opens
  useEffect(() => {
    if (open) {
      setMode("summary");
      setExportError(null);
    }
  }, [open]);

  const baseName = `Business-Report-${report.period.type === "month" ? "Monthly" : "Yearly"}-${slugify(report.period.label)}`;

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

    if (!node) return;

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
      console.error("Failed to generate the business report PDF:", err);

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
              Business Report
            </DialogTitle>

            <DialogDescription>
              {report.period.label} · compared with {report.period.previousLabel}
            </DialogDescription>
          </DialogHeader>

          {/* Print mode */}
          <div className="flex shrink-0 flex-col gap-2 border-b px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={mode}
              onValueChange={(value) => {
                if (isPrintMode(value)) setMode(value);
              }}
            >
              <TabsList>
                {PRINT_MODES.map((option) => (
                  <TabsTrigger key={option.value} value={option.value} disabled={isExporting}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <p className="text-xs text-muted-foreground">{activeMode.hint}</p>
          </div>

          {/* Scrollable preview */}
          <div className="min-h-0 flex-1 overflow-auto bg-muted/50 p-4 sm:p-6">
            <div className="overflow-x-auto">
              <div className="mx-auto w-[794px] rounded-sm bg-white p-[45px] text-slate-900 shadow-sm ring-1 ring-slate-200">
                <ReportDocument report={report} mode={mode} />
              </div>
            </div>
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
                disabled={isExporting}
                onClick={handleDownload}
              >
                {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                {isExporting ? "Creating PDF..." : "Download PDF"}
              </Button>

              <Button type="button" disabled={isExporting} onClick={() => handlePrint()}>
                <Printer />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden fixed-width print/PDF copy */}
      {open &&
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
              <ReportDocument report={report} mode={mode} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}