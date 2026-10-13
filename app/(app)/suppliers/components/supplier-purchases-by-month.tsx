"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Package,
  Receipt,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import type { SupplierPurchase } from "@/lib/types/supplier";
import {
  STATUS_STYLES,
  formatDay,
  formatMoney,
} from "@/app/(app)/stock-purchases/components/stock-purchase-shared";
import StatCard from "@/components/global-common/stat-card";

const ROW_TINT: Record<string, string> = {
  UNPAID: "bg-red-50/70 hover:bg-red-100/70",
  PARTIAL: "bg-amber-50/70 hover:bg-amber-100/70",
};

function formatMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

const formatQuantity = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(value);

export function SupplierPurchasesByMonth({
  purchases,
  currency,
}: {
  purchases: SupplierPurchase[];
  currency: string;
}) {
  // Newest month first
  const months = useMemo(
    () =>
      Array.from(new Set(purchases.map((p) => p.purchaseDate.slice(0, 7))))
        .sort()
        .reverse(),
    [purchases],
  );

  const [selected, setSelected] = useState(months[0] ?? "");
  const month = months.includes(selected) ? selected : (months[0] ?? "");
  const index = months.indexOf(month);

  const rows = useMemo(
    () => purchases.filter((p) => p.purchaseDate.slice(0, 7) === month),
    [purchases, month],
  );

  const products = useMemo(() => {
    const map = new Map<
      string,
      { name: string; unit: string; quantity: number; amount: number; times: number }
    >();

    for (const purchase of rows) {
      for (const item of purchase.items) {
        const key = `${item.productId}|${item.unit}`;
        const entry = map.get(key) ?? {
          name: item.productName,
          unit: item.unit,
          quantity: 0,
          amount: 0,
          times: 0,
        };

        entry.quantity += item.quantity;
        entry.amount += item.total;
        entry.times += 1;
        map.set(key, entry);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [rows]);

  if (months.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <Package className="size-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No purchases yet</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Stock purchases recorded with this supplier will be listed here month by
            month.
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = rows.reduce((sum, p) => sum + p.total, 0);
  const paid = rows.reduce((sum, p) => sum + p.paidAmount, 0);
  const openCount = rows.filter((p) => p.paymentStatus !== "PAID").length;

  return (
    <div className="space-y-4">
      {/* Month picker */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Older month"
          disabled={index >= months.length - 1}
          onClick={() => setSelected(months[index + 1])}
        >
          <ChevronLeft />
        </Button>

        <Select value={month} onValueChange={(value) => value && setSelected(value)}>
          <SelectTrigger className="w-52" aria-label="Month">
            <SelectValue>{formatMonth(month)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((key) => (
              <SelectItem key={key} value={key}>
                {formatMonth(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Newer month"
          disabled={index <= 0}
          onClick={() => setSelected(months[index - 1])}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Purchases" value={rows.length} icon={Receipt} />
        <StatCard title="Purchased" value={formatMoney(total, currency)} icon={Package} />
        <StatCard title="Paid" value={formatMoney(paid, currency)} icon={CheckCircle2} />
        <StatCard
          title="Outstanding"
          value={formatMoney(total - paid, currency)}
          note={`${openCount} unpaid or partially paid`}
          icon={Wallet}
        />
      </div>

      {/* What we bought */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>What we bought in {formatMonth(month)}</CardTitle>
          <CardDescription>Quantities and amounts per product.</CardDescription>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-6">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-center">Times bought</TableHead>
              <TableHead className="pr-6 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.map((product, i) => (
              <TableRow key={`${product.name}-${product.unit}`}>
                <TableCell className="pl-6 text-muted-foreground tabular-nums">
                  {i + 1}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQuantity(product.quantity)} {product.unit}
                </TableCell>
                <TableCell className="text-center tabular-nums">{product.times}</TableCell>
                <TableCell className="pr-6 text-right font-medium tabular-nums">
                  {formatMoney(product.amount, currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="pl-6 text-muted-foreground">
                {products.length} {products.length === 1 ? "product" : "products"}
              </TableCell>
              <TableCell className="pr-6 text-right font-semibold tabular-nums">
                {formatMoney(total, currency)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Purchases */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Purchases</CardTitle>
          <CardDescription>Every purchase recorded in {formatMonth(month)}.</CardDescription>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Date</TableHead>
              <TableHead>Purchase</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((purchase) => {
              const status = STATUS_STYLES[purchase.paymentStatus] ?? STATUS_STYLES.UNPAID;
              const balance = purchase.total - purchase.paidAmount;

              return (
                <TableRow
                  key={purchase.id}
                  className={cn(ROW_TINT[purchase.paymentStatus])}
                >
                  <TableCell className="pl-6 whitespace-nowrap">
                    {formatDay(purchase.purchaseDate)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {purchase.purchaseNumber ||
                      `PUR-${String(purchase.id).padStart(5, "0")}`}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {purchase.items
                      .map((item) => `${item.productName} (${formatQuantity(item.quantity)} ${item.unit})`)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(purchase.total, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(purchase.paidAmount, currency)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      balance > 0 && "font-medium text-red-600",
                    )}
                  >
                    {formatMoney(balance, currency)}
                  </TableCell>
                  <TableCell className="pr-6">
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="pl-6 text-muted-foreground">
                {rows.length} {rows.length === 1 ? "purchase" : "purchases"}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatMoney(total, currency)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatMoney(paid, currency)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatMoney(total - paid, currency)}
              </TableCell>
              <TableCell className="pr-6" />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}