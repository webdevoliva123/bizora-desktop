"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import type { MonthlyAccount } from "@/lib/db/monthly-account";

import MonthlyAccountSection from "./monthly-account-section";
import { ViewDailyEntryDialog } from "@/app/(app)/daily-entries/components/view-daily-entry-dialog";

interface CustomerAccountViewProps {
    customerId: number;
}

function getCurrentMonth(): string {
    const date = new Date();

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    }).format(amount / 100);
}

function formatEntryDate(value: string): string {
    if (!value) return "—";

    const [year, month, day] = value.slice(0, 10).split("-").map(Number);

    if (!year || !month || !day) return value;

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(year, month - 1, day));
}

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
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

export default function CustomerAccountView({
    customerId,
}: CustomerAccountViewProps) {
    const [accountMonth, setAccountMonth] = useState(getCurrentMonth);
    const [account, setAccount] = useState<MonthlyAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

    const loadAccount = useCallback(
        async (month: string) => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `/api/customers/${customerId}/monthly-account?month=${month}`,
                    { cache: "no-store" },
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error || "Failed to load monthly account.");
                }

                setAccount(data.account);
            } catch (err) {
                console.error("Failed to load monthly account:", err);
                setAccount(null);
                setError(
                    err instanceof Error ? err.message : "Failed to load monthly account.",
                );
            } finally {
                setLoading(false);
            }
        },
        [customerId],
    );

    useEffect(() => {
        void loadAccount(accountMonth);
    }, [accountMonth, loadAccount]);

    const entries = account?.entries ?? [];

    return (
        <div className="space-y-3">
            <MonthlyAccountSection
                account={account}
                loading={loading}
                error={error}
                accountMonth={accountMonth}
                onAccountMonthChange={setAccountMonth}
                onRefresh={() => loadAccount(accountMonth)}
            />

            <section className="overflow-hidden rounded-lg border">
                {/*
          The scroll area is shadcn's own table container (data-slot="table-container"),
          so the sticky header works and the table fits the viewport.
        */}
                <div className="[&>[data-slot=table-container]]:max-h-[calc(100vh-20rem)] [&>[data-slot=table-container]]:min-h-48">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky top-0 z-10 w-12 bg-background px-4">#</TableHead>
                                <TableHead className="sticky top-0 z-10 bg-background px-4">Entry Date</TableHead>
                                <TableHead className="sticky top-0 z-10 bg-background px-4">Items</TableHead>
                                <TableHead className="sticky top-0 z-10 bg-background px-4">Payment Type</TableHead>
                                <TableHead className="sticky top-0 z-10 bg-background px-4 text-right">Total</TableHead>
                                <TableHead className="sticky top-0 z-10 bg-background px-4 text-right">Paid Amount</TableHead>
                                <TableHead className="sticky top-0 z-10 bg-background px-4 text-center">Payments</TableHead>
                                <TableHead className="sticky top-0 z-10 bg-background px-4">Payment Status</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell
                                        colSpan={8}
                                        className="h-40 text-center text-sm text-muted-foreground"
                                    >
                                        Loading entries...
                                    </TableCell>
                                </TableRow>
                            ) : entries.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell
                                        colSpan={8}
                                        className="h-40 text-center text-sm text-muted-foreground"
                                    >
                                        No entries found for this month.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry, index) => {
                                    const isMonthly = entry.paymentType === "MONTHLY";
                                    const status =
                                        PAYMENT_STATUS[entry.paymentStatus] ?? PAYMENT_STATUS.UNPAID;

                                    return (
                                        <TableRow key={entry.id} onClick={() => setSelectedEntryId(entry.id)}>
                                            <TableCell className="px-4 text-muted-foreground tabular-nums">
                                                {index + 1}
                                            </TableCell>

                                            <TableCell className="px-4 font-medium whitespace-nowrap">
                                                {formatEntryDate(entry.entryDate)}
                                            </TableCell>

                                            <TableCell className="px-4 text-muted-foreground">
                                                {entry.itemCount}
                                            </TableCell>

                                            <TableCell className="px-4">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        isMonthly
                                                            ? "border-sky-200 bg-sky-50 text-sky-700"
                                                            : undefined
                                                    }
                                                >
                                                    {isMonthly ? "Monthly" : "Immediate"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="px-4 text-right font-medium tabular-nums">
                                                {formatCurrency(entry.total)}
                                            </TableCell>

                                            <TableCell className="px-4 text-right tabular-nums">
                                                {formatCurrency(entry.paidAmount)}
                                            </TableCell>

                                            <TableCell className="px-4 text-center tabular-nums">
                                                {entry.paymentCount}
                                            </TableCell>

                                            <TableCell className="px-4">
                                                {isMonthly ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        On monthly account
                                                    </span>
                                                ) : (
                                                    <Badge variant="outline" className={status.className}>
                                                        {status.label}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {!loading && entries.length > 0 && (
                    <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                        {entries.length} {entries.length === 1 ? "entry" : "entries"}
                    </div>
                )}
            </section>
            {selectedEntryId !== null && (
                <ViewDailyEntryDialog
                    customers={[]}
                    products={[]}
                    entryId={selectedEntryId}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedEntryId(null);
                        }
                    }}
                />
            )}
        </div>
    );
}