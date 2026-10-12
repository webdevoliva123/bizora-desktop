"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { ProductOption, StockPurchaseListItem, SupplierOption } from "@/lib/types/stock-purchase";
import { STATUS_STYLES, formatDay, formatMoney } from "./stock-purchase-shared";
import { ViewStockPurchaseDialog } from "./view-stock-purchase-dialog";
import { StockPurchaseMonthlyStatementPreview } from "./stock-purchase-monthly-statement-preview";

type StatusFilter = "ALL" | "UNPAID" | "PARTIAL" | "PAID";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "All purchases" },
    { value: "UNPAID", label: "Unpaid" },
    { value: "PARTIAL", label: "Partially paid" },
    { value: "PAID", label: "Paid" },
];

const statusLabel = (value: StatusFilter) =>
    STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;

const isStatusFilter = (value: unknown): value is StatusFilter =>
    STATUS_OPTIONS.some((option) => option.value === value);

const ROW_TINT: Record<string, string> = {
    UNPAID: "bg-red-50/70 hover:bg-red-100/70",
    PARTIAL: "bg-amber-50/70 hover:bg-amber-100/70",
};

/** Local-time "yyyy-MM" */
function monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(key: string, delta: number) {
    const [year, month] = key.split("-").map(Number);
    return monthKey(new Date(year, month - 1 + delta, 1));
}

function formatMonth(key: string) {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
        new Date(year, month - 1, 1),
    );
}

interface Props {
    purchases: StockPurchaseListItem[];
    currency: string;
    suppliers: SupplierOption[];
    products: ProductOption[];
}

export function StockPurchasesTable({ purchases, currency, suppliers, products }: Props) {
    // Client-only so the month doesn't mismatch between server and browser timezones
    const [currentMonth, setCurrentMonth] = useState("");
    const [monthFilter, setMonthFilter] = useState<string | null>(null); // null = this month
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [viewId, setViewId] = useState<number | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [monthlyStatementOpen, setMonthlyStatementOpen] = useState(false);

    useEffect(() => {
        setCurrentMonth(monthKey(new Date()));
    }, []);

    const selected = monthFilter ?? currentMonth;
    const isCurrent = monthFilter === null;

    function selectMonth(key: string) {
        setMonthFilter(key === currentMonth ? null : key);
    }

    const rows = useMemo(
        () =>
            purchases.filter(
                (purchase) =>
                    purchase.purchaseDate.slice(0, 7) === selected &&
                    (statusFilter === "ALL" || purchase.paymentStatus === statusFilter),
            ),
        [purchases, selected, statusFilter],
    );

    const totalAmount = rows.reduce((sum, row) => sum + row.total, 0);
    const totalPaid = rows.reduce((sum, row) => sum + row.paidAmount, 0);

    if (!currentMonth) {
        return <div className="min-h-64 rounded-lg border" aria-busy="true" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Previous month"
                        onClick={() => selectMonth(shiftMonth(selected, -1))}
                    >
                        <ChevronLeft />
                    </Button>

                    <div className="flex h-9 w-48 items-center justify-center rounded-md border text-sm">
                        {isCurrent && <span className="mr-1 font-medium">This month ·</span>}
                        {formatMonth(selected)}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Next month"
                        onClick={() => selectMonth(shiftMonth(selected, 1))}
                    >
                        <ChevronRight />
                    </Button>

                    {!isCurrent && (
                        <Button type="button" variant="ghost" onClick={() => setMonthFilter(null)}>
                            This month
                        </Button>
                    )}
                </div>

                <div className="sm:ml-auto flex items-center gap-2">

                    <Button
                        type="button"
                        variant="default"
                        onClick={() => setMonthlyStatementOpen(true)}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Monthly Statement
                    </Button>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            if (isStatusFilter(value)) setStatusFilter(value);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-44" aria-label="Payment filter">
                            <SelectValue placeholder="All purchases">{statusLabel(statusFilter)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent align="end">
                            {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12 px-4">#</TableHead>
                            <TableHead className="px-4">Purchase</TableHead>
                            <TableHead className="px-4">Date</TableHead>
                            <TableHead className="px-4">Supplier</TableHead>
                            <TableHead className="px-4">Items</TableHead>
                            <TableHead className="px-4 text-right">Total</TableHead>
                            <TableHead className="px-4 text-right">Paid</TableHead>
                            <TableHead className="px-4 text-right">Balance</TableHead>
                            <TableHead className="px-4 text-center">Payments</TableHead>
                            <TableHead className="px-4">Status</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={10} className="h-56 text-center">
                                    <p className="text-sm font-medium">
                                        No purchases for {isCurrent ? "this month" : formatMonth(selected)}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {statusFilter !== "ALL"
                                            ? "Try another payment filter or month."
                                            : "Use New Purchase to record one, or pick another month."}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((purchase, index) => {
                                const status = STATUS_STYLES[purchase.paymentStatus] ?? STATUS_STYLES.UNPAID;
                                const balance = purchase.total - purchase.paidAmount;

                                return (
                                    <TableRow
                                        key={purchase.id}
                                        tabIndex={0}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            ROW_TINT[purchase.paymentStatus] ?? "hover:bg-muted/50",
                                        )}
                                        onClick={() => {
                                            setViewId(purchase.id);
                                            setViewOpen(true);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                setViewId(purchase.id);
                                                setViewOpen(true);
                                            }
                                        }}
                                    >
                                        <TableCell className="px-4 text-muted-foreground tabular-nums">{index + 1}</TableCell>
                                        <TableCell className="px-4 font-medium">
                                            {purchase.purchaseNumber || `PUR-${String(purchase.id).padStart(5, "0")}`}
                                        </TableCell>
                                        <TableCell className="px-4 whitespace-nowrap">{formatDay(purchase.purchaseDate)}</TableCell>
                                        <TableCell className={cn("px-4", !purchase.supplierName && "text-muted-foreground")}>
                                            {purchase.supplierName || "No supplier"}
                                        </TableCell>
                                        <TableCell className="px-4 text-muted-foreground">{purchase.itemCount}</TableCell>
                                        <TableCell className="px-4 text-right font-medium tabular-nums">
                                            {formatMoney(purchase.total, currency)}
                                        </TableCell>
                                        <TableCell className="px-4 text-right tabular-nums">
                                            {formatMoney(purchase.paidAmount, currency)}
                                        </TableCell>
                                        <TableCell
                                            className={cn("px-4 text-right tabular-nums", balance > 0 && "font-medium text-red-600")}
                                        >
                                            {formatMoney(balance, currency)}
                                        </TableCell>
                                        <TableCell className="px-4 text-center tabular-nums">{purchase.paymentCount}</TableCell>
                                        <TableCell className="px-4">
                                            <Badge variant="outline" className={status.className}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>

                    {rows.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={5} className="px-4 text-muted-foreground">
                                    {rows.length} {rows.length === 1 ? "purchase" : "purchases"}
                                </TableCell>
                                <TableCell className="px-4 text-right font-semibold tabular-nums">
                                    {formatMoney(totalAmount, currency)}
                                </TableCell>
                                <TableCell className="px-4 text-right font-semibold tabular-nums">
                                    {formatMoney(totalPaid, currency)}
                                </TableCell>
                                <TableCell className="px-4 text-right font-semibold tabular-nums">
                                    {formatMoney(totalAmount - totalPaid, currency)}
                                </TableCell>
                                <TableCell colSpan={2} />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>

            <ViewStockPurchaseDialog
                purchaseId={viewId}
                open={viewOpen}
                onOpenChange={setViewOpen}
                currency={currency}
                suppliers={suppliers}
                products={products}
            />

<StockPurchaseMonthlyStatementPreview
  open={monthlyStatementOpen}
  onOpenChange={setMonthlyStatementOpen}
  month={selected}
  suppliers={suppliers}
  currency={currency}
/>
        </div>
    );
}