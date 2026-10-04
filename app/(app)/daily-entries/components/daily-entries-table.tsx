
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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

import type { DailyEntryListItem } from "@/lib/types/daily-entry";
import { ViewDailyEntryDialog } from "./view-daily-entry-dialog";

/* -------------------------------------------------------------------------- */
/* Filter types + storage                                                     */
/* -------------------------------------------------------------------------- */

type CustomerTypeFilter = "ALL" | "BUSINESS" | "PERSON";

interface StoredFilters {
    /** "yyyy-MM-dd", or null meaning "follow today" */
    date: string | null;
    customerType: CustomerTypeFilter;
}

const FILTER_KEY = "bizora:daily-entries";

const CUSTOMER_TYPE_OPTIONS: { value: CustomerTypeFilter; label: string }[] = [
    { value: "ALL", label: "All customers" },
    { value: "BUSINESS", label: "Business" },
    { value: "PERSON", label: "Person" },
];

const customerTypeLabel = (value: CustomerTypeFilter) =>
    CUSTOMER_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value;

const isCustomerTypeFilter = (value: unknown): value is CustomerTypeFilter =>
    CUSTOMER_TYPE_OPTIONS.some((option) => option.value === value);

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readFilters(): StoredFilters | null {
    try {
        const raw = localStorage.getItem(FILTER_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;

        return {
            date:
                typeof parsed.date === "string" && DATE_KEY_PATTERN.test(parsed.date)
                    ? parsed.date
                    : null,
            customerType: isCustomerTypeFilter(parsed.customerType)
                ? parsed.customerType
                : "ALL",
        };
    } catch {
        return null;
    }
}

function writeFilters(filters: StoredFilters) {
    try {
        const isDefault = filters.date === null && filters.customerType === "ALL";

        if (isDefault) {
            localStorage.removeItem(FILTER_KEY);
        } else {
            localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
        }
    } catch {
        // storage unavailable: filters just won't persist
    }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Local-time "yyyy-MM-dd" (avoids the UTC shift of toISOString) */
function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function entryDateKey(value: string) {
    if (!value) return "";

    if (value.includes("T")) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? "" : toDateKey(parsed);
    }

    return value.slice(0, 10);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount / 100);
}

function formatDateTime(value: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

const PAYMENT_STYLES: Record<string, { label: string; className: string }> = {
    PAID: {
        label: "Paid",
        className:
            "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    },
    PARTIAL: {
        label: "Partial",
        className:
            "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    UNPAID: {
        label: "Unpaid",
        className:
            "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

interface DailyEntriesTableProps {
    entries: DailyEntryListItem[];
    currency: string;
}

export function DailyEntriesTable({
    entries,
    currency,
}: DailyEntriesTableProps) {
    // Client-only values are set after mount to avoid SSR/timezone mismatches
    const [today, setToday] = useState("");
    const [dateFilter, setDateFilter] = useState<string | null>(null); // null = today
    const [customerType, setCustomerType] = useState<CustomerTypeFilter>("ALL");
    const [hydrated, setHydrated] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [viewEntryId, setViewEntryId] =
        useState<number | null>(null);

    const [viewEntryOpen, setViewEntryOpen] =
        useState(false);

    /* ---- Restore filters once on mount ---- */
    useEffect(() => {
        setToday(toDateKey(new Date()));

        const stored = readFilters();
        if (stored) {
            setDateFilter(stored.date);
            setCustomerType(stored.customerType);
        }

        setHydrated(true);
    }, []);

    /* ---- Persist filters on change (after hydration) ---- */
    useEffect(() => {
        if (!hydrated) return;
        writeFilters({ date: dateFilter, customerType });
    }, [hydrated, dateFilter, customerType]);

    const selectedKey = dateFilter ?? today;
    const isToday = dateFilter === null;
    const selectedDate = useMemo(
        () => (selectedKey ? new Date(`${selectedKey}T00:00:00`) : new Date()),
        [selectedKey],
    );

    function selectDate(key: string) {
        // Picking today's date goes back to "follow today"
        setDateFilter(key === today ? null : key);
    }

    function shiftDay(delta: number) {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + delta);
        selectDate(toDateKey(next));
    }

    /* ---- Filtered list ---- */
    const filteredEntries = useMemo(
        () =>
            entries.filter((entry) => {
                if (entryDateKey(entry.entryDate) !== selectedKey) {
                    return false;
                }

                if (customerType === "BUSINESS") {
                    return entry.customerType === "BUSINESS";
                }

                if (customerType === "PERSON") {
                    return entry.customerType === "PERSON";
                }

                return true;
            }),
        [entries, selectedKey, customerType],
    );

    const totalAmount = useMemo(
        () => filteredEntries.reduce((sum, entry) => sum + entry.total, 0),
        [filteredEntries],
    );

    const totalPaidAmount = useMemo(
        () =>
            filteredEntries.reduce(
                (sum, entry) => sum + entry.paidAmount,
                0,
            ),
        [filteredEntries],
    );

    // Wait for the stored filters so the table doesn't flash today's rows first
    if (!hydrated) {
        return <div className="min-h-64 rounded-lg border" aria-busy="true" />;
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: date selection */}
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Previous day"
                        onClick={() => shiftDay(-1)}
                    >
                        <ChevronLeft />
                    </Button>

                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger
                            render={
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-48 justify-start font-normal"
                                />
                            }
                        >
                            <CalendarIcon className="size-4 opacity-60" />
                            <span>
                                {isToday && (
                                    <span className="mr-1 font-medium">Today ·</span>
                                )}
                                {formatDate(selectedDate)}
                            </span>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                defaultMonth={selectedDate}
                                onSelect={(date) => {
                                    if (!date) return;
                                    selectDate(toDateKey(date));
                                    setCalendarOpen(false);
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Next day"
                        onClick={() => shiftDay(1)}
                    >
                        <ChevronRight />
                    </Button>

                    {!isToday && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDateFilter(null)}
                        >
                            Today
                        </Button>
                    )}
                </div>

                {/* Right: customer type */}
                <div className="sm:ml-auto">
                    <Select
                        value={customerType}
                        onValueChange={(value) => {
                            if (isCustomerTypeFilter(value)) setCustomerType(value);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-44" aria-label="Customer type">
                            <SelectValue placeholder="Customer type">
                                {customerTypeLabel(customerType)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent align="end">
                            {CUSTOMER_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12 px-4">
                                #
                            </TableHead>

                            <TableHead className="px-4">
                                Entry Date & Time
                            </TableHead>
                            <TableHead className="px-4">
                                Customer
                            </TableHead>

                            <TableHead className="px-4">
                                Items
                            </TableHead>

                            <TableHead className="px-4 text-right">
                                Total
                            </TableHead>

                            <TableHead className="px-4 text-right">
                                Paid Amount
                            </TableHead>

                            <TableHead className="px-4 text-center">
                                Payments
                            </TableHead>

                            <TableHead className="px-4">
                                Payment Status
                            </TableHead>

                            <TableHead className="w-12 px-4" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredEntries.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={9} className="h-56 text-center">
                                    <p className="text-sm font-medium">
                                        No entries for {isToday ? "today" : formatDate(selectedDate)}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {customerType !== "ALL"
                                            ? "Try another customer type or date."
                                            : "Use Add Entry to record one, or pick another date."}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEntries.map((entry,index) => {
                                const payment = PAYMENT_STYLES[entry.paymentStatus];

                                return (
                                    <TableRow key={entry.id} onClick={() => {
                                        setViewEntryId(entry.id);
                                        setViewEntryOpen(true);
                                    }}>
                                        <TableCell className="px-4 text-muted-foreground tabular-nums">
                                            {index + 1}
                                        </TableCell>

                                        <TableCell className="px-4 whitespace-nowrap text-sm">
                                            {formatDateTime(entry.createdAt)}
                                        </TableCell>
                                        <TableCell className="px-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {entry.customerName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {entry.customerType === "BUSINESS"
                                                        ? "Business"
                                                        : "Person"}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 text-muted-foreground">
                                            {entry.itemCount}
                                        </TableCell>

                                        <TableCell className="px-4 text-right font-medium tabular-nums">
                                            {formatCurrency(entry.total, currency)}
                                        </TableCell>

                                        <TableCell className="px-4 text-right tabular-nums">
                                            {formatCurrency(entry.paidAmount, currency)}
                                        </TableCell>

                                        <TableCell className="px-4 text-center tabular-nums">
                                            {entry.paymentCount}
                                        </TableCell>

                                        <TableCell className="px-4">
                                            <Badge
                                                variant="outline"
                                                className={cn(payment?.className)}
                                            >
                                                {payment?.label ?? entry.paymentStatus}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="px-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Actions"
                                                        />
                                                    }
                                                >
                                                    <MoreHorizontal />
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Pencil />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                        <Trash2 />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>

                    {filteredEntries.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="px-4 text-muted-foreground"
                                >
                                    {filteredEntries.length}{" "}
                                    {filteredEntries.length === 1
                                        ? "entry"
                                        : "entries"}
                                </TableCell>

                                <TableCell className="px-4 text-right font-semibold tabular-nums">
                                    {formatCurrency(totalAmount, currency)}
                                </TableCell>

                                <TableCell className="px-4 text-right font-semibold tabular-nums">
                                    {formatCurrency(totalPaidAmount, currency)}
                                </TableCell>

                                <TableCell colSpan={3} />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
                <ViewDailyEntryDialog
                    entryId={viewEntryId}
                    open={viewEntryOpen}
                    onOpenChange={(open) => {
                        setViewEntryOpen(open);

                        if (!open) {
                            setViewEntryId(null);
                        }
                    }}
                />
            </div>
        </div>
    );
}