"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from "recharts";

import {
  CardContent,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import type { DashboardSalesOverview } from "@/lib/types/dashboard";

interface SalesOverviewChartProps {
  data: DashboardSalesOverview[];
  currency: string;
}

const chartConfig = {
  total: {
    label: "Sales",
  },
};

function formatCurrency(
  amount: number,
  currency: string,
) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function SalesOverviewChart({
  data,
  currency,
}: SalesOverviewChartProps) {
  return (
    <CardContent>
      {data.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <p className="text-sm font-medium">
              No sales data yet
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Sales activity will appear here once you start
              recording transactions.
            </p>
          </div>
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="min-h-64 w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDate}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    formatCurrency(
                      Number(value),
                      currency,
                    )
                  }
                />
              }
            />

            <Bar
              dataKey="total"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      )}
    </CardContent>
  );
}