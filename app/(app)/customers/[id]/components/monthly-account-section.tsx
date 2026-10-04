"use client";

import { ArrowLeft, ArrowRight, CalendarDays, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type {
  MonthlyAccount,
  MonthlyAccountStatus,
} from "@/lib/db/monthly-account";

interface MonthlyAccountSectionProps {
  account: MonthlyAccount | null;
  loading: boolean;
  error: string | null;
  accountMonth: string;
  onAccountMonthChange: (month: string) => void;
}

function getCurrentMonth(): string {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

const STATUS: Record<MonthlyAccountStatus, { label: string; className: string }> = {
  PAID: {
    label: "Paid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  PARTIAL: {
    label: "Partial",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  UNPAID: {
    label: "Unpaid",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default function MonthlyAccountSection({
  account,
  loading,
  error,
  accountMonth,
  onAccountMonthChange,
}: MonthlyAccountSectionProps) {
  const canGoNext = accountMonth < getCurrentMonth();
  const dash = "—";

  return (
    <div className="flex flex-col gap-3 rounded-lg border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Previous month"
          onClick={() => onAccountMonthChange(shiftMonth(accountMonth, -1))}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <span className="min-w-32 text-center text-sm font-medium">
          {formatMonth(accountMonth)}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Next month"
          disabled={!canGoNext}
          onClick={() => onAccountMonthChange(shiftMonth(accountMonth, 1))}
        >
          <ArrowRight className="size-4" />
        </Button>

        {accountMonth !== getCurrentMonth() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAccountMonthChange(getCurrentMonth())}
          >
            This Month
          </Button>
        )}
      </div>

      {/* Inline totals */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <Metric
              label="Total"
              value={!loading && account ? formatCurrency(account.total) : dash}
            />
            <Metric
              label="Paid"
              value={!loading && account ? formatCurrency(account.paidAmount) : dash}
              className="text-emerald-600"
            />
            <Metric
              label="Outstanding"
              value={
                !loading && account ? formatCurrency(account.outstandingAmount) : dash
              }
              className="text-red-600"
            />

            {!loading && account && (
              <Badge variant="outline" className={STATUS[account.status].className}>
                {STATUS[account.status].label}
              </Badge>
            )}
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title="Monthly bill will be added next"
        >
          <Printer />
          Print Bill
        </Button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${className ?? ""}`}>
        {value}
      </span>
    </div>
  );
}