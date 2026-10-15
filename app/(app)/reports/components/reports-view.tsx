"use client";

import { useState, useTransition } from "react";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  Printer,
  Receipt,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { pctChange } from "@/lib/reports/health";
import {
  currentPeriodKey,
  shiftPeriod,
  type ReportPeriodType,
} from "@/lib/reports/period";
import type { ReportData } from "@/lib/types/report";
import { formatMoney } from "@/app/(app)/stock-purchases/components/stock-purchase-shared";

import { getReportAction } from "../actions";
import { ReportBreakdown } from "./report-breakdown";
import { ReportCharts } from "./report-charts";
import { formatPercent } from "./report-format";
import { ReportHealthCard } from "./report-health-card";
import { KpiCard } from "./report-kpi-card";
import { ReportPrintPreview } from "./report-print-preview";

export function ReportsView({ initialReport }: { initialReport: ReportData }) {
  const [report, setReport] = useState(initialReport);
  const [error, setError] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const { type, key, label, previousLabel, isCurrent } = report.period;
  const { totals, previous, outstanding } = report;
  const currency = report.business.currency || "INR";
  const money = (amount: number) => formatMoney(amount, currency);

  function load(nextType: ReportPeriodType, nextKey: string) {
    setError(null);

    startTransition(async () => {
      const result = await getReportAction(nextType, nextKey);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setReport(result.report);
    });
  }

  const change = (current: number, before: number) => pctChange(current, before);

  return (
    <div className={cn("space-y-6 transition-opacity", pending && "opacity-60")}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={type}
            onValueChange={(value) => {
              if (value === "month" || value === "year") {
                load(value, currentPeriodKey(value));
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="month" disabled={pending}>Monthly</TabsTrigger>
              <TabsTrigger value="year" disabled={pending}>Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Previous ${type}`}
            disabled={pending}
            onClick={() => load(type, shiftPeriod(type, key, -1))}
          >
            <ChevronLeft />
          </Button>

          <div className="flex h-9 min-w-48 items-center justify-center rounded-md border px-3 text-sm">
            {pending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {isCurrent && (
              <span className="mr-1 font-medium">
                {type === "month" ? "This month ·" : "This year ·"}
              </span>
            )}
            {label}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Next ${type}`}
            disabled={pending || isCurrent}
            onClick={() => load(type, shiftPeriod(type, key, 1))}
          >
            <ChevronRight />
          </Button>

          {!isCurrent && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => load(type, currentPeriodKey(type))}
            >
              {type === "month" ? "This month" : "This year"}
            </Button>
          )}
        </div>

        <Button type="button" variant="outline" onClick={() => setPrintOpen(true)}>
          <Printer />
          Print report
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <ReportHealthCard report={report} />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Sales" value={money(totals.sales)} icon={Receipt} change={change(totals.sales, previous.sales)} previousLabel={previousLabel} />
        <KpiCard title="Stock purchases" value={money(totals.purchases)} icon={Package} change={change(totals.purchases, previous.purchases)} goodWhenUp={false} previousLabel={previousLabel} />
        <KpiCard title="Expenses" value={money(totals.expenses)} icon={Wallet} change={change(totals.expenses, previous.expenses)} goodWhenUp={false} previousLabel={previousLabel} />
        <KpiCard title="Salaries paid" value={money(totals.salaries)} icon={Users} change={change(totals.salaries, previous.salaries)} goodWhenUp={false} previousLabel={previousLabel} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Profit"
          value={money(totals.profit)}
          icon={TrendingUp}
          change={change(totals.profit, previous.profit)}
          previousLabel={previousLabel}
          note={`${formatPercent(totals.margin)} margin`}
        />
        <KpiCard
          title="Net cash"
          value={money(totals.netCash)}
          icon={Banknote}
          note={`${money(totals.cashIn)} in · ${money(totals.cashOut)} out`}
        />
        <KpiCard
          title="Customers owe you"
          value={money(outstanding.receivable)}
          icon={Clock}
          note="Balance at the end of this period"
        />
        <KpiCard
          title="You owe suppliers"
          value={money(outstanding.payable)}
          icon={Truck}
          note={
            outstanding.salaryDue > 0
              ? `Plus ${money(outstanding.salaryDue)} salary due`
              : "No salary due"
          }
        />
      </div>

      <ReportCharts report={report} />

      <ReportBreakdown report={report} />

      <ReportPrintPreview open={printOpen} onOpenChange={setPrintOpen} report={report} />
    </div>
  );
}