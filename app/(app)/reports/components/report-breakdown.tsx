import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { cn } from "@/lib/utils";
  import type { ReportData } from "@/lib/types/report";
  import { formatMoney } from "@/app/(app)/stock-purchases/components/stock-purchase-shared";
  
  import { formatQuantity } from "./report-format";
  
  type RankedItem = { key: string; name: string; hint?: string; amount: number };
  
  function RankedCard({
    title,
    description,
    rows,
    total,
    currency,
    danger = false,
    empty,
  }: {
    title: string;
    description: string;
    rows: RankedItem[];
    total?: number;
    currency: string;
    danger?: boolean;
    empty: string;
  }) {
    const base = total ?? rows.reduce((sum, row) => sum + row.amount, 0);
  
    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
  
        {rows.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {empty}
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead className="w-28">Share</TableHead>
                <TableHead className="pr-6 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const share = base > 0 ? Math.min((row.amount / base) * 100, 100) : 0;
  
                return (
                  <TableRow key={row.key}>
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-medium">{row.name}</span>
                        {row.hint && (
                          <span className="text-xs text-muted-foreground">{row.hint}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", danger ? "bg-red-500" : "bg-primary")}
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {share.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "pr-6 text-right font-medium tabular-nums",
                        danger && "text-red-600",
                      )}
                    >
                      {formatMoney(row.amount, currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    );
  }
  
  export function ReportBreakdown({ report }: { report: ReportData }) {
    const { breakdown, dues, totals, series, period } = report;
    const currency = report.business.currency || "INR";
    const unit = period.type === "month" ? "Day" : "Month";
  
    // A month has up to 31 days, so only show the days that had activity
    const periodRows = series.filter(
      (point) =>
        period.type === "year" ||
        point.sales || point.purchases || point.expenses || point.salaries,
    );
  
    const dayLabel = (key: string) =>
      period.type === "month"
        ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
            new Date(`${key}T00:00:00`),
          )
        : new Intl.DateTimeFormat("en-IN", { month: "long" }).format(
            new Date(`${key}-01T00:00:00`),
          );
  
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <RankedCard
            title="Top products"
            description="Best sellers by sales amount."
            total={totals.sales}
            currency={currency}
            empty="No sales in this period."
            rows={breakdown.products.map((row) => ({
              key: String(row.id),
              name: row.name,
              hint: `${formatQuantity(row.quantity)} ${row.unit} sold`,
              amount: row.amount,
            }))}
          />
  
          <RankedCard
            title="Top customers"
            description="Who bought the most."
            total={totals.sales}
            currency={currency}
            empty="No sales in this period."
            rows={breakdown.customers.map((row) => ({
              key: String(row.id),
              name: row.name,
              hint: `${row.count} ${row.count === 1 ? "entry" : "entries"}`,
              amount: row.amount,
            }))}
          />
  
          <RankedCard
            title="Expense categories"
            description="Running costs by category."
            total={totals.expenses}
            currency={currency}
            empty="No expenses in this period."
            rows={breakdown.expenseCategories.map((row) => ({
              key: String(row.id ?? "none"),
              name: row.name,
              hint: `${row.count} ${row.count === 1 ? "expense" : "expenses"}`,
              amount: row.amount,
            }))}
          />
  
          <RankedCard
            title="Top suppliers"
            description="Where stock was bought from."
            total={totals.purchases}
            currency={currency}
            empty="No stock purchases in this period."
            rows={breakdown.suppliers.map((row) => ({
              key: String(row.id ?? "none"),
              name: row.name,
              hint: `${row.count} ${row.count === 1 ? "purchase" : "purchases"}`,
              amount: row.amount,
            }))}
          />
        </div>
  
        <div className="grid gap-6 lg:grid-cols-3">
          <RankedCard
            title="Customers who owe you"
            description={`Balances as of the end of ${period.label}.`}
            currency={currency}
            danger
            empty="No customer dues. All paid up."
            rows={dues.customers.map((row) => ({
              key: String(row.id),
              name: row.name,
              amount: row.amount,
            }))}
          />
  
          <RankedCard
            title="Suppliers you owe"
            description={`Balances as of the end of ${period.label}.`}
            currency={currency}
            danger
            empty="No supplier dues. All paid up."
            rows={dues.suppliers.map((row) => ({
              key: String(row.id ?? "none"),
              name: row.name,
              amount: row.amount,
            }))}
          />
  
          <RankedCard
            title="Salary due"
            description="Monthly-paid workers with an unpaid balance."
            currency={currency}
            danger
            empty="No salary is due."
            rows={dues.salaries.map((row) => ({
              key: String(row.id),
              name: row.name,
              hint: `Expected ${formatMoney(row.expected, currency)} · paid ${formatMoney(row.paid, currency)}`,
              amount: row.due,
            }))}
          />
        </div>
  
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle>{unit}-by-{unit.toLowerCase()} breakdown</CardTitle>
            <CardDescription>
              Sales, costs and profit for {period.label}.
            </CardDescription>
          </CardHeader>
  
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">{unit}</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Salaries</TableHead>
                <TableHead className="pr-6 text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
  
            <TableBody>
              {periodRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No activity in this period.
                  </TableCell>
                </TableRow>
              ) : (
                periodRows.map((point) => (
                  <TableRow key={point.key}>
                    <TableCell className="pl-6 font-medium whitespace-nowrap">
                      {dayLabel(point.key)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(point.sales, currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(point.purchases, currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(point.expenses, currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(point.salaries, currency)}</TableCell>
                    <TableCell
                      className={cn(
                        "pr-6 text-right font-medium tabular-nums",
                        point.profit < 0 ? "text-red-600" : point.profit > 0 && "text-emerald-600",
                      )}
                    >
                      {formatMoney(point.profit, currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
  
            {periodRows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="pl-6 text-muted-foreground">Total</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatMoney(totals.sales, currency)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatMoney(totals.purchases, currency)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatMoney(totals.expenses, currency)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatMoney(totals.salaries, currency)}</TableCell>
                  <TableCell
                    className={cn(
                      "pr-6 text-right font-semibold tabular-nums",
                      totals.profit < 0 && "text-red-600",
                    )}
                  >
                    {formatMoney(totals.profit, currency)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </Card>
      </div>
    );
  }