"use client";

import { cloneElement } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { ReportData } from "@/lib/types/report";
import { formatMoney } from "@/app/(app)/stock-purchases/components/stock-purchase-shared";

import { COLORS, PIE_COLORS, compact } from "./report-format";

export type FixedSize = { width: number; height: number };

/* -------------------------------------------------------------------------- */
/* Building blocks                                                            */
/* -------------------------------------------------------------------------- */

function Frame({
  config,
  fixed,
  className,
  children,
}: {
  config: ChartConfig;
  fixed?: FixedSize;
  className?: string;
  children: React.ReactElement<{ width?: number; height?: number }>;
}) {
  if (fixed) {
    return (
      <div style={{ width: fixed.width, height: fixed.height }}>
        {cloneElement(children, { width: fixed.width, height: fixed.height })}
      </div>
    );
  }

  return (
    <ChartContainer config={config} className={cn("aspect-auto h-64 w-full", className)}>
      {children}
    </ChartContainer>
  );
}

function LegendRow({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function Block({
  title,
  description,
  fixed,
  children,
}: {
  title: string;
  description: string;
  fixed?: FixedSize;
  children: React.ReactNode;
}) {
  if (fixed) {
    return (
      <div className="break-inside-avoid rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-semibold">{title}</p>
        <div className="mt-2 space-y-2">{children}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Charts                                                                     */
/* -------------------------------------------------------------------------- */

export function ReportCharts({
  report,
  fixed,
}: {
  report: ReportData;
  fixed?: FixedSize;
}) {
  const { series, period, business, breakdown } = report;
  const currency = business.currency || "INR";
  const unit = period.type === "month" ? "day" : "month";

  const hasActivity = series.some(
    (point) => point.sales || point.purchases || point.expenses || point.salaries,
  );

  if (!hasActivity) {
    return fixed ? (
      <p className="rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-500">
        No activity recorded for this period.
      </p>
    ) : (
      <Card>
        <CardContent className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
          No activity recorded for this period, so there is nothing to chart yet.
        </CardContent>
      </Card>
    );
  }

  // Charts use rupees, not paise
  const data = series.map((point) => ({
    label: point.label,
    sales: point.sales / 100,
    purchases: point.purchases / 100,
    expenses: point.expenses / 100,
    salaries: point.salaries / 100,
    profit: point.profit / 100,
    cashIn: point.cashIn / 100,
    cashOut: point.cashOut / 100,
    receivable: point.receivable / 100,
    payable: point.payable / 100,
    previousSales: point.previousSales / 100,
  }));

  const x = {
    dataKey: "label",
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    fontSize: 11,
    interval: "preserveStartEnd" as const,
  };
  const y = {
    tickLine: false,
    axisLine: false,
    width: 44,
    fontSize: 11,
    tickFormatter: (value: number) => compact(value),
  };
  const margin = { left: 0, right: 8, top: 8 };
  const animate = !fixed;
  const tooltip = fixed ? null : <ChartTooltip content={<ChartTooltipContent />} />;

  /* Expense categories donut: top 5 plus "Other" */
  const topCategories = breakdown.expenseCategories.slice(0, 5);
  const otherTotal = breakdown.expenseCategories
    .slice(5)
    .reduce((sum, row) => sum + row.amount, 0);

  const pie = [
    ...topCategories.map((row, index) => ({
      name: row.name,
      value: row.amount / 100,
      amount: row.amount,
      fill: PIE_COLORS[index],
    })),
    ...(otherTotal > 0
      ? [{ name: "Other", value: otherTotal / 100, amount: otherTotal, fill: PIE_COLORS[5] }]
      : []),
  ];
  const pieTotal = pie.reduce((sum, row) => sum + row.value, 0);
  const pieConfig: ChartConfig = Object.fromEntries(
    pie.map((row) => [row.name, { label: row.name, color: row.fill }]),
  );

  return (
    <div
      className={cn(
        "grid gap-6",
        fixed ? "grid-cols-2" : "lg:grid-cols-2",
      )}
    >
      {/* 1. Sales & profit */}
      <Block
        title="Sales & profit"
        description={`Sales each ${unit}, with profit after all costs.`}
        fixed={fixed}
      >
        <Frame
          fixed={fixed}
          config={{
            sales: { label: "Sales", color: COLORS.sales },
            profit: { label: "Profit", color: COLORS.profit },
          }}
        >
          <ComposedChart data={data} margin={margin}>
            <CartesianGrid vertical={false} />
            <XAxis {...x} />
            <YAxis {...y} />
            {tooltip}
            <Bar dataKey="sales" fill={COLORS.sales} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
            <Line type="monotone" dataKey="profit" stroke={COLORS.profit} strokeWidth={2} dot={false} isAnimationActive={animate} />
          </ComposedChart>
        </Frame>
        <LegendRow
          items={[
            { label: "Sales", color: COLORS.sales },
            { label: "Profit", color: COLORS.profit },
          ]}
        />
      </Block>

      {/* 2. Where the money goes */}
      <Block
        title="Where the money goes"
        description={`Stock purchases, expenses and salaries each ${unit}.`}
        fixed={fixed}
      >
        <Frame
          fixed={fixed}
          config={{
            purchases: { label: "Stock purchases", color: COLORS.purchases },
            expenses: { label: "Expenses", color: COLORS.expenses },
            salaries: { label: "Salaries", color: COLORS.salaries },
          }}
        >
          <BarChart data={data} margin={margin}>
            <CartesianGrid vertical={false} />
            <XAxis {...x} />
            <YAxis {...y} />
            {tooltip}
            <Bar dataKey="purchases" stackId="costs" fill={COLORS.purchases} isAnimationActive={animate} />
            <Bar dataKey="expenses" stackId="costs" fill={COLORS.expenses} isAnimationActive={animate} />
            <Bar dataKey="salaries" stackId="costs" fill={COLORS.salaries} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
          </BarChart>
        </Frame>
        <LegendRow
          items={[
            { label: "Stock purchases", color: COLORS.purchases },
            { label: "Expenses", color: COLORS.expenses },
            { label: "Salaries", color: COLORS.salaries },
          ]}
        />
      </Block>

      {/* 3. Sales vs previous period */}
      <Block
        title="Sales vs last period"
        description={`${period.label} against ${period.previousLabel}.`}
        fixed={fixed}
      >
        <Frame
          fixed={fixed}
          config={{
            sales: { label: period.label, color: COLORS.sales },
            previousSales: { label: period.previousLabel, color: COLORS.previous },
          }}
        >
          <LineChart data={data} margin={margin}>
            <CartesianGrid vertical={false} />
            <XAxis {...x} />
            <YAxis {...y} />
            {tooltip}
            <Line type="monotone" dataKey="previousSales" stroke={COLORS.previous} strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={animate} />
            <Line type="monotone" dataKey="sales" stroke={COLORS.sales} strokeWidth={2} dot={false} isAnimationActive={animate} />
          </LineChart>
        </Frame>
        <LegendRow
          items={[
            { label: period.label, color: COLORS.sales },
            { label: period.previousLabel, color: COLORS.previous },
          ]}
        />
      </Block>

      {/* 4. Cash flow */}
      <Block
        title="Cash flow"
        description={`Cash received against cash paid out each ${unit}.`}
        fixed={fixed}
      >
        <Frame
          fixed={fixed}
          config={{
            cashIn: { label: "Cash in", color: COLORS.cashIn },
            cashOut: { label: "Cash out", color: COLORS.cashOut },
          }}
        >
          <BarChart data={data} margin={margin}>
            <CartesianGrid vertical={false} />
            <XAxis {...x} />
            <YAxis {...y} />
            {tooltip}
            <Bar dataKey="cashIn" fill={COLORS.cashIn} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
            <Bar dataKey="cashOut" fill={COLORS.cashOut} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
          </BarChart>
        </Frame>
        <LegendRow
          items={[
            { label: "Cash in", color: COLORS.cashIn },
            { label: "Cash out", color: COLORS.cashOut },
          ]}
        />
      </Block>

      {/* 5. Outstanding */}
      <Block
        title="Outstanding balances"
        description="What customers owe you and what you owe suppliers."
        fixed={fixed}
      >
        <Frame
          fixed={fixed}
          config={{
            receivable: { label: "Customers owe you", color: COLORS.receivable },
            payable: { label: "You owe suppliers", color: COLORS.payable },
          }}
        >
          <AreaChart data={data} margin={margin}>
            <CartesianGrid vertical={false} />
            <XAxis {...x} />
            <YAxis {...y} />
            {tooltip}
            <Area type="monotone" dataKey="receivable" stroke={COLORS.receivable} fill={COLORS.receivable} fillOpacity={0.2} strokeWidth={2} isAnimationActive={animate} />
            <Area type="monotone" dataKey="payable" stroke={COLORS.payable} fill={COLORS.payable} fillOpacity={0.2} strokeWidth={2} isAnimationActive={animate} />
          </AreaChart>
        </Frame>
        <LegendRow
          items={[
            { label: "Customers owe you", color: COLORS.receivable },
            { label: "You owe suppliers", color: COLORS.payable },
          ]}
        />
      </Block>

      {/* 6. Expense categories */}
      <Block
        title="Expenses by category"
        description="Where your running costs went."
        fixed={fixed}
      >
        {pie.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No expenses recorded for this period.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <Frame
              fixed={fixed ? { width: 130, height: 130 } : undefined}
              className="h-48 w-48 shrink-0"
              config={pieConfig}
            >
              <PieChart>
                {fixed ? null : (
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                )}
                <Pie
                  data={pie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="90%"
                  strokeWidth={2}
                  isAnimationActive={animate}
                />
              </PieChart>
            </Frame>

            <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
              {pie.map((row) => (
                <li key={row.name} className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: row.fill }} />
                  <span className="min-w-0 flex-1 truncate">{row.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {((row.value / pieTotal) * 100).toFixed(0)}%
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatMoney(row.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Block>
    </div>
  );
}