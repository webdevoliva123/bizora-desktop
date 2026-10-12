"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
    Building2,
    CreditCard,
    Download,
    FileText,
    Loader2,
    MapPin,
    Phone,
    Printer,
    RefreshCw,
    UserRound,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFileUrl } from "@/lib/files/urls";
import type { MonthlyAccountBill } from "@/lib/db/monthly-account-bill";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

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

type LoadStatus = "idle" | "loading" | "success" | "error";

type MonthlyAccountStatus = "UNPAID" | "PARTIAL" | "PAID";

type BillEntry = MonthlyAccountBill["entries"][number];

type PrintMode = "summary" | "full" | "none";

const PRINT_MODES: { value: PrintMode; label: string; hint: string }[] = [
    {
        value: "summary",
        label: "Summary",
        hint: "Entries with their product count. Products are not listed.",
    },
    {
        value: "full",
        label: "Full entries",
        hint: "Every entry with all its products, in a compact layout.",
    },
    {
        value: "none",
        label: "No entries",
        hint: "Bill details, totals and payments only.",
    },
];

const isPrintMode = (value: string): value is PrintMode =>
    PRINT_MODES.some((mode) => mode.value === value);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatMoney(amount: number, currency: string) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount / 100);
}

function formatDate(value: string) {
    if (!value) return "-";

    const date = new Date(
        value.includes("T") ? value : `${value}T00:00:00`,
    );

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatMonth(value: string) {
    if (!/^\d{4}-\d{2}$/.test(value)) return value;

    const [year, month] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, 1));
}

function formatQuantity(value: number) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 3,
    }).format(value);
}

function slugify(value: string) {
    return (
        value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "customer"
    );
}

const STATUS_LABEL: Record<MonthlyAccountStatus, string> = {
    PAID: "Paid",
    PARTIAL: "Partially Paid",
    UNPAID: "Unpaid",
};

const STATUS_CLASS: Record<MonthlyAccountStatus, string> = {
    PAID: "bg-emerald-50 text-emerald-700",
    PARTIAL: "bg-amber-50 text-amber-700",
    UNPAID: "bg-red-50 text-red-700",
};

/* -------------------------------------------------------------------------- */
/* PDF page-break helpers                                                     */
/* -------------------------------------------------------------------------- */

interface BreakBlock {
    top: number;
    bottom: number;
}

/**
 * Measures every element marked `break-inside-avoid` (entry groups, table
 * rows, summary and footer sections) in canvas pixels, so the PDF slicer
 * knows where it must not cut.
 */
function collectBlocks(node: HTMLElement, ratio: number): BreakBlock[] {
    const origin = node.getBoundingClientRect().top;

    return Array.from(
        node.querySelectorAll<HTMLElement>(".break-inside-avoid"),
    ).map((element) => {
        const rect = element.getBoundingClientRect();

        return {
            top: (rect.top - origin) * ratio,
            bottom: (rect.bottom - origin) * ratio,
        };
    });
}

/**
 * Finds where the current PDF page should end. If a block would be cut by
 * the page boundary, the page ends just before that block instead, as long
 * as the block fits on one page and the page isn't left mostly empty.
 */
function findSliceEnd(
    offset: number,
    maxEnd: number,
    blocks: BreakBlock[],
    pageHeightPx: number,
): number {
    const straddling = blocks.filter(
        (block) =>
            block.top > offset + 1 &&
            block.top < maxEnd &&
            block.bottom > maxEnd &&
            block.bottom - block.top <= pageHeightPx,
    );

    if (straddling.length === 0) return maxEnd;

    const end = Math.floor(
        Math.min(...straddling.map((block) => block.top)),
    );

    // Don't leave a nearly empty page just to keep a block together
    return end - offset < pageHeightPx * 0.25 ? maxEnd : end;
}

/* -------------------------------------------------------------------------- */
/* Entries: summary (entry rows + product count)                              */
/* -------------------------------------------------------------------------- */

function EntriesSummaryTable({
    entries,
    money,
}: {
    entries: BillEntry[];
    money: (amount: number) => string;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs">
                <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-slate-600">
                        <th className="w-10 px-3 py-2 text-left font-medium">
                            #
                        </th>

                        <th className="px-3 py-2 text-left font-medium">
                            Entry Date
                        </th>

                        <th className="px-3 py-2 text-left font-medium">
                            Entry
                        </th>

                        <th className="px-3 py-2 text-right font-medium">
                            Products
                        </th>

                        <th className="px-3 py-2 text-right font-medium">
                            Amount
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {entries.map((entry, index) => (
                        <tr
                            key={entry.id}
                            className="break-inside-avoid border-b border-slate-100 last:border-b-0"
                        >
                            <td className="px-3 py-1.5 text-slate-500 tabular-nums">
                                {index + 1}
                            </td>

                            <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                                {formatDate(entry.entryDate)}
                            </td>

                            <td className="px-3 py-1.5 text-slate-500">
                                #{entry.id}
                            </td>

                            <td className="px-3 py-1.5 text-right tabular-nums">
                                {entry.items.length}
                            </td>

                            <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                                {money(entry.total)}
                            </td>
                        </tr>
                    ))}

                    {entries.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className="px-3 py-6 text-center text-slate-500"
                            >
                                No monthly entries for this period.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Entries: full (one compact table, entry band + product rows)               */
/* -------------------------------------------------------------------------- */

function EntriesFullTable({
    entries,
    money,
}: {
    entries: BillEntry[];
    money: (amount: number) => string;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-[11px] leading-tight">
                <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-slate-600">
                        <th className="px-3 py-1.5 text-left font-medium">
                            Product
                        </th>

                        <th className="px-3 py-1.5 text-right font-medium">
                            Qty
                        </th>

                        <th className="px-3 py-1.5 text-right font-medium">
                            Rate
                        </th>

                        <th className="px-3 py-1.5 text-right font-medium">
                            Tax
                        </th>

                        <th className="px-3 py-1.5 text-right font-medium">
                            Amount
                        </th>
                    </tr>
                </thead>

                {entries.map((entry, index) => {
                    const extras = [
                        entry.discount > 0
                            ? `Disc −${money(entry.discount)}`
                            : null,
                        entry.tax > 0 ? `Tax ${money(entry.tax)}` : null,
                    ].filter(Boolean);

                    return (
                        <tbody
                            key={entry.id}
                            className="break-inside-avoid border-t border-slate-200 first:border-t-0"
                        >
                            {/* Entry band */}
                            <tr className="bg-slate-100/80">
                                <td
                                    colSpan={4}
                                    className="px-3 py-1 font-semibold"
                                >
                                    {index + 1}. {formatDate(entry.entryDate)}
                                    <span className="ml-2 font-normal text-slate-500">
                                        Entry #{entry.id}
                                        {extras.length > 0 &&
                                            ` · ${extras.join(" · ")}`}
                                    </span>
                                </td>

                                <td className="px-3 py-1 text-right font-semibold tabular-nums">
                                    {money(entry.total)}
                                </td>
                            </tr>

                            {/* Products */}
                            {entry.items.map((item) => (
                                <tr
                                    key={item.id}
                                    className="break-inside-avoid"
                                >
                                    <td className="py-0.5 pr-3 pl-6">
                                        {item.productName}
                                    </td>

                                    <td className="px-3 py-0.5 text-right whitespace-nowrap tabular-nums">
                                        {formatQuantity(item.quantity)}{" "}
                                        {item.unit}
                                    </td>

                                    <td className="px-3 py-0.5 text-right tabular-nums">
                                        {money(item.unitPrice)}
                                    </td>

                                    <td className="px-3 py-0.5 text-right text-slate-500 tabular-nums">
                                        {item.taxRate > 0
                                            ? `${item.taxRate}%`
                                            : "—"}
                                    </td>

                                    <td className="px-3 py-0.5 text-right tabular-nums">
                                        {money(item.total)}
                                    </td>
                                </tr>
                            ))}

                            {entry.items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-0.5 pl-6 text-slate-500"
                                    >
                                        No items in this entry.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    );
                })}

                {entries.length === 0 && (
                    <tbody>
                        <tr>
                            <td
                                colSpan={5}
                                className="px-3 py-6 text-center text-slate-500"
                            >
                                No monthly entries for this period.
                            </td>
                        </tr>
                    </tbody>
                )}
            </table>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Bill Document                                                              */
/* -------------------------------------------------------------------------- */

function BillDocument({
    bill,
    mode,
}: {
    bill: MonthlyAccountBill;
    mode: PrintMode;
}) {
    const { business, customer,entries } = bill;

    console.log({entries})

    const details = bill.paymentDetails;

    const money = (amount: number) =>
        formatMoney(amount, business.currency);

    const showPaymentSection = bill.outstandingAmount > 0;

    const showQr =
        showPaymentSection &&
        Boolean(details?.showQr && details.qrImagePath);

    const bankRows: [string, string | null | undefined][] = [
        ["Account Name", details?.accountName],
        ["Bank", details?.bankName],
        ["Account Number", details?.accountNumber],
        ["Branch", details?.branchName],
        ["Routing Code", details?.routingCode],
        ["Payment ID", details?.paymentIdentifier],
    ];

    const visibleBankRows = bankRows.filter(([, value]) => Boolean(value));

    const showBank =
        showPaymentSection &&
        Boolean(details?.showBankDetails) &&
        visibleBankRows.length > 0;

    const showInstructions =
        showPaymentSection && Boolean(details?.paymentInstructions);

    const hasPaymentContent = showQr || showBank || showInstructions;

    const registrations = [
        ...bill.taxRegistrations
            .filter((registration) => registration.registrationNumber)
            .map((registration) => ({
                label: registration.taxSystem,
                value: registration.registrationNumber,
            })),

        ...bill.businessRegistrations
            .filter((registration) => registration.registrationNumber)
            .map((registration) => ({
                label: registration.registrationType,
                value: registration.registrationNumber,
            })),
    ];

    const showEntries = mode !== "none";

    return (
        <div className="text-sm leading-normal text-slate-900">
            {/* Business Header */}

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
                        <h2 className="text-xl font-semibold tracking-tight">
                            {business.name}
                        </h2>

                        {business.businessCategory && (
                            <p className="mt-0.5 text-sm text-slate-500">
                                {business.businessCategory}
                            </p>
                        )}

                        {business.address && (
                            <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                                <MapPin className="mt-0.5 size-4 shrink-0" />

                                <span>
                                    {business.address}
                                    {business.city && `, ${business.city}`}
                                    {business.state && `, ${business.state}`}
                                    {business.postalCode &&
                                        ` - ${business.postalCode}`}
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
                        Monthly Account
                    </p>

                    <p className="mt-1 text-lg font-semibold">Statement</p>

                    <p className="mt-1 text-sm text-slate-500">
                        {formatMonth(bill.accountMonth)}
                    </p>
                </div>
            </div>

            {/* Customer */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-5">
                <div>
                    <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                        Bill To
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                        <UserRound className="size-4 text-slate-500" />

                        <p className="font-semibold">{customer.name}</p>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        {customer.type === "BUSINESS"
                            ? "Business Customer"
                            : "Personal Customer"}
                    </p>
                </div>

                <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASS[bill.status]}`}
                >
                    {STATUS_LABEL[bill.status]}
                </div>
            </div>

            {/* Entries (hidden in "No entries" mode) */}

            {showEntries && (
                <div className="py-6">
                    <div className="mb-3">
                        <h3 className="text-base font-semibold">
                            Monthly Account — {formatMonth(bill.accountMonth)}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            {bill.entries.length}{" "}
                            {bill.entries.length === 1 ? "entry" : "entries"}
                            {mode === "summary" &&
                                " · product count shown per entry"}
                        </p>
                    </div>

                    {mode === "full" ? (
                        <EntriesFullTable entries={bill.entries} money={money} />
                    ) : (
                        <EntriesSummaryTable
                            entries={bill.entries}
                            money={money}
                        />
                    )}
                </div>
            )}

            {/* Account Summary */}

            <div
                className={`flex justify-end break-inside-avoid ${
                    showEntries ? "" : "pt-6"
                }`}
            >
                <div className="w-full max-w-[320px] space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Monthly Total</span>

                        <span className="tabular-nums">{money(bill.total)}</span>
                    </div>

                    {bill.paidAmount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-700">
                            <span>Paid</span>

                            <span className="tabular-nums">
                                {money(bill.paidAmount)}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
                        <span>Outstanding</span>

                        <span
                            className={
                                bill.outstandingAmount > 0
                                    ? "text-red-600 tabular-nums"
                                    : "text-emerald-700 tabular-nums"
                            }
                        >
                            {money(bill.outstandingAmount)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment History */}

            {bill.payments.length > 0 && (
                <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-6">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold">
                            Payment History
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Payments received against this monthly account.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                                        Date
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                                        Method
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                                        Reference
                                    </th>

                                    <th className="px-4 py-3 text-right font-medium text-slate-600">
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {bill.payments.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className="break-inside-avoid border-b border-slate-200 last:border-b-0"
                                    >
                                        <td className="px-4 py-3">
                                            {formatDate(payment.paymentDate)}
                                        </td>

                                        <td className="px-4 py-3 capitalize">
                                            {payment.paymentMethod
                                                .toLowerCase()
                                                .replace(/_/g, " ")}
                                        </td>

                                        <td className="px-4 py-3 text-slate-500">
                                            {payment.reference || "-"}
                                        </td>

                                        <td className="px-4 py-3 text-right font-medium text-emerald-700 tabular-nums">
                                            {money(payment.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Details */}

            {showPaymentSection && hasPaymentContent && (
                <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-6">
                    <div className="mb-5">
                        <h3 className="text-base font-semibold">
                            Payment Details
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Please pay the outstanding amount.
                        </p>
                    </div>

                    {(showQr || showBank) && (
                        <div className="grid grid-cols-2 gap-6">
                            {showQr && (
                                <div className="flex flex-col items-center rounded-xl border border-slate-200 p-5">
                                    <p className="mb-3 text-sm font-medium">
                                        Scan to Pay
                                    </p>

                                    <div className="size-40 overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
                                        <img
                                            src={
                                                getFileUrl(
                                                    details?.qrImagePath ?? "",
                                                ) ?? ""
                                            }
                                            alt="Payment QR Code"
                                            className="size-full object-contain"
                                        />
                                    </div>

                                    {details?.paymentIdentifier && (
                                        <p className="mt-3 text-center text-xs text-slate-500">
                                            {details.paymentIdentifier}
                                        </p>
                                    )}
                                </div>
                            )}

                            {showBank && (
                                <div
                                    className={`rounded-xl border border-slate-200 p-5 ${
                                        showQr ? "" : "col-span-2"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="size-4" />

                                        <p className="text-sm font-medium">
                                            Bank Details
                                        </p>
                                    </div>

                                    <div className="mt-4 space-y-3 text-sm">
                                        {visibleBankRows.map(
                                            ([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="flex justify-between gap-4"
                                                >
                                                    <span className="text-slate-500">
                                                        {label}
                                                    </span>

                                                    <span className="text-right font-medium break-all">
                                                        {value}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {showInstructions && (
                        <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                            <p className="font-medium text-slate-800">
                                Payment Instructions
                            </p>

                            <p className="mt-1 whitespace-pre-wrap">
                                {details?.paymentInstructions}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}

            <div className="mt-8 break-inside-avoid border-t border-slate-200 pt-5">
                {registrations.length > 0 && (
                    <div className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
                        {registrations.map((registration, index) => (
                            <span key={`${registration.label}-${index}`}>
                                {registration.label}:{" "}
                                <span className="font-medium text-slate-700">
                                    {registration.value}
                                </span>
                            </span>
                        ))}
                    </div>
                )}

                <p className="text-center text-xs text-slate-500">
                    Thank you for your business.
                </p>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

interface MonthlyAccountBillPreviewProps {
    customerId: number | null;
    accountMonth: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MonthlyAccountBillPreview({
    customerId,
    accountMonth,
    open,
    onOpenChange,
}: MonthlyAccountBillPreviewProps) {
    const [bill, setBill] = useState<MonthlyAccountBill | null>(null);

    const [status, setStatus] = useState<LoadStatus>("idle");

    const [error, setError] = useState<string | null>(null);

    const [reloadKey, setReloadKey] = useState(0);

    const [mode, setMode] = useState<PrintMode>("summary");

    const [isExporting, setIsExporting] = useState(false);

    const [exportError, setExportError] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    /* ---------------------------------------------------------------------- */
    /* Load Bill                                                              */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (!open || customerId === null || !accountMonth) {
            return;
        }

        const controller = new AbortController();

        async function loadBill() {
            setStatus("loading");
            setError(null);

            try {
                const month = accountMonth ?? "";

                const response = await fetch(
                    `/api/customers/${customerId}/monthly-account/bill?${new URLSearchParams(
                        { month },
                    ).toString()}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        signal: controller.signal,
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.error || "Failed to load monthly account bill.",
                    );
                }

                setBill(data as MonthlyAccountBill);
                setStatus("success");
            } catch (err) {
                if (controller.signal.aborted) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load monthly account bill.",
                );

                setStatus("error");
            }
        }

        void loadBill();

        return () => controller.abort();
    }, [open, customerId, accountMonth, reloadKey]);

    useEffect(() => {
        setExportError(null);
    }, [open, customerId, accountMonth]);

    // Summary is the default every time the dialog opens
    useEffect(() => {
        if (open) setMode("summary");
    }, [open]);

    /* ---------------------------------------------------------------------- */
    /* Current bill                                                           */
    /* ---------------------------------------------------------------------- */

    const current =
        bill &&
        bill.customer.id === customerId &&
        bill.accountMonth === accountMonth
            ? bill
            : null;

    const showError = status === "error" && !current;

    const showLoading = !current && !showError;

    const baseName = current
        ? `Monthly-Account-${current.accountMonth}-${slugify(
              current.customer.name,
          )}`
        : "Monthly-Account";

    const activeMode =
        PRINT_MODES.find((option) => option.value === mode) ??
        PRINT_MODES[0];

    /* ---------------------------------------------------------------------- */
    /* Print                                                                   */
    /* ---------------------------------------------------------------------- */

    const handlePrint = useReactToPrint({
        contentRef: exportRef,
        documentTitle: baseName,
        pageStyle: PRINT_PAGE_STYLE,
    });

    /* ---------------------------------------------------------------------- */
    /* Download PDF                                                            */
    /* ---------------------------------------------------------------------- */

    async function handleDownload() {
        const node = exportRef.current;

        if (!node || !current) return;

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

            // Canvas pixels per millimetre on the PDF page
            const pxPerMm = canvas.width / contentWidth;

            // Maximum canvas pixels that fit on one PDF page
            const pageHeightPx = Math.floor(contentHeight * pxPerMm);

            // Canvas pixels per CSS pixel, used to measure the DOM blocks
            const domRatio = canvas.width / node.offsetWidth;

            const blocks = collectBlocks(node, domRatio);

            let offsetY = 0;
            let pageIndex = 0;

            while (offsetY < canvas.height) {
                const maxEnd = Math.min(
                    offsetY + pageHeightPx,
                    canvas.height,
                );

                // Last page takes the rest; otherwise avoid cutting a block
                const endY =
                    maxEnd >= canvas.height
                        ? canvas.height
                        : findSliceEnd(
                              offsetY,
                              maxEnd,
                              blocks,
                              pageHeightPx,
                          );

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

                if (pageIndex > 0) {
                    pdf.addPage();
                }

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

                    pdf.text(
                        `Page ${page} of ${totalPages}`,
                        pageWidth / 2,
                        pageHeight - 6,
                        { align: "center" },
                    );
                }
            }

            pdf.save(`${baseName}.pdf`);
        } catch (err) {
            console.error("Failed to generate the monthly account PDF:", err);

            setExportError(
                "Couldn't generate the PDF. Try Print and choose Save as PDF instead.",
            );
        } finally {
            setIsExporting(false);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Render                                                                  */
    /* ---------------------------------------------------------------------- */

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-4xl">
                    <DialogHeader className="shrink-0 border-b px-6 py-4">
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Monthly Account Bill
                        </DialogTitle>

                        <DialogDescription>
                            {current
                                ? `${formatMonth(
                                      current.accountMonth,
                                  )} · ${current.customer.name}`
                                : "Review the monthly account before printing or saving it as a PDF."}
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
                                    <TabsTrigger
                                        key={option.value}
                                        value={option.value}
                                        disabled={isExporting}
                                    >
                                        {option.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        <p className="text-xs text-muted-foreground">
                            {activeMode.hint}
                        </p>
                    </div>

                    {/* Scrollable preview */}

                    <div className="min-h-0 flex-1 overflow-auto bg-muted/50 p-4 sm:p-6">
                        {showLoading && (
                            <div
                                className="mx-auto max-w-[794px] space-y-6 rounded-sm bg-white p-10 ring-1 ring-slate-200"
                                aria-busy="true"
                                aria-label="Loading monthly account bill"
                            >
                                <div className="flex justify-between gap-6">
                                    <div className="flex gap-4">
                                        <Skeleton className="size-16 rounded-xl" />

                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>

                                    <Skeleton className="h-12 w-32" />
                                </div>

                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        )}

                        {showError && (
                            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
                                <p className="text-sm font-medium text-destructive">
                                    Unable to load monthly account bill
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    {error}
                                </p>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setReloadKey((key) => key + 1)
                                    }
                                >
                                    <RefreshCw />
                                    Try again
                                </Button>
                            </div>
                        )}

                        {current && (
                            <div className="overflow-x-auto">
                                <div className="mx-auto max-w-[794px] min-w-[640px] rounded-sm bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-12">
                                    <BillDocument bill={current} mode={mode} />
                                </div>
                            </div>
                        )}
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
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!current || isExporting}
                                onClick={handleDownload}
                            >
                                {isExporting ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Download />
                                )}

                                {isExporting
                                    ? "Creating PDF..."
                                    : "Download PDF"}
                            </Button>

                            <Button
                                type="button"
                                disabled={!current || isExporting}
                                onClick={() => handlePrint()}
                            >
                                <Printer />
                                Print
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden fixed-width print/PDF copy */}

            {current &&
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
                            <BillDocument bill={current} mode={mode} />
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}