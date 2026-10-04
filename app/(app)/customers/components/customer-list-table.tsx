"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

import type {
    CustomerListItem,
    CustomerTypeFilter,
} from "@/lib/types/customer";

/* -------------------------------------------------------------------------- */
/* Filter options + storage                                                   */
/* -------------------------------------------------------------------------- */

const FILTER_KEY = "bizora:customers";

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

function readCustomerType(): CustomerTypeFilter {
    try {
        const raw = localStorage.getItem(FILTER_KEY);
        if (!raw) return "ALL";

        const parsed = JSON.parse(raw);
        return isCustomerTypeFilter(parsed?.customerType)
            ? parsed.customerType
            : "ALL";
    } catch {
        return "ALL";
    }
}

function writeCustomerType(customerType: CustomerTypeFilter) {
    try {
        if (customerType === "ALL") {
            localStorage.removeItem(FILTER_KEY);
        } else {
            localStorage.setItem(FILTER_KEY, JSON.stringify({ customerType }));
        }
    } catch {
        // storage unavailable: filter just won't persist
    }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function CustomerList() {
    const router = useRouter();

    const [customers, setCustomers] = useState<CustomerListItem[]>([]);
    const [customerType, setCustomerType] = useState<CustomerTypeFilter>("ALL");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [hydrated, setHydrated] = useState(false);

    /* ---- Restore filter once on mount ---- */
    useEffect(() => {
        setCustomerType(readCustomerType());
        setHydrated(true);
    }, []);

    /* ---- Persist filter on change (after hydration) ---- */
    useEffect(() => {
        if (!hydrated) return;
        writeCustomerType(customerType);
    }, [hydrated, customerType]);



    /* ---- Load customers (debounced, cancels stale requests) ---- */

    const loadCustomers = async (signal?: AbortSignal) => {
        try {
          setLoading(true);
      
          const params = new URLSearchParams();
      
          if (search.trim()) {
            params.set("search", search.trim());
          }
      
          if (customerType !== "ALL") {
            params.set("type", customerType);
          }
      
          const response = await fetch(
            `/api/customers?${params.toString()}`,
            {
              cache: "no-store",
              signal,
            },
          );
      
          if (!response.ok) {
            throw new Error("Failed to load customers");
          }
      
          const data = await response.json();
      
          setCustomers(data.customers ?? []);
          setLoading(false);
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            return;
          }
      
          console.error("Failed to load customers:", error);
          setCustomers([]);
          setLoading(false);
        }
      };

      useEffect(() => {
        if (!hydrated) return;
      
        const controller = new AbortController();
      
        const timer = setTimeout(() => {
          loadCustomers(controller.signal);
        }, 250);
      
        return () => {
          clearTimeout(timer);
          controller.abort();
        };
      }, [hydrated, search, customerType]);

      useEffect(() => {
        function handleCustomerRefresh() {
          loadCustomers();
        }
      
        window.addEventListener(
          "customers:refresh",
          handleCustomerRefresh,
        );
      
        return () => {
          window.removeEventListener(
            "customers:refresh",
            handleCustomerRefresh,
          );
        };
      }, [search, customerType]);

    function openCustomer(id: number) {
        router.push(`/customers/${id}`);
    }

    const totalEntries = customers.reduce(
        (sum, customer) => sum + customer.entryCount,
        0,
    );

    // Wait for the stored filter so the table doesn't flash unfiltered rows
    if (!hydrated) {
        return <div className="min-h-64 rounded-lg border" aria-busy="true" />;
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: search */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search customers..."
                        className="pl-9"
                        aria-label="Search customers"
                    />
                </div>

                {/* Right: customer type */}
                <div className="sm:ml-auto">
                    <Select
                        value={customerType}
                        onValueChange={(value) => {
                            if (isCustomerTypeFilter(value)) setCustomerType(value);
                        }}
                    >
                        <SelectTrigger
                            className="w-full sm:w-44"
                            aria-label="Customer type"
                        >
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
                            <TableHead className="w-12 px-4">#</TableHead>
                            <TableHead className="px-4">Customer</TableHead>
                            <TableHead className="px-4">Type</TableHead>
                            <TableHead className="px-4">Phone</TableHead>
                            <TableHead className="px-4">Email</TableHead>
                            <TableHead className="px-4">City</TableHead>
                            <TableHead className="px-4 text-center">Entries</TableHead>
                            <TableHead className="px-4">Status</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={8}
                                    className="h-56 text-center text-sm text-muted-foreground"
                                >
                                    Loading customers...
                                </TableCell>
                            </TableRow>
                        ) : customers.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={8} className="h-56 text-center">
                                    <p className="text-sm font-medium">No customers found</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {search || customerType !== "ALL"
                                            ? "Try a different search or customer type."
                                            : "Add your first customer to get started."}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer, index) => (
                                <TableRow
                                    key={customer.id}
                                    tabIndex={0}
                                    className="cursor-pointer"
                                    onClick={() => openCustomer(customer.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openCustomer(customer.id);
                                        }
                                    }}
                                >
                                    <TableCell className="px-4 text-muted-foreground tabular-nums">
                                        {index + 1}
                                    </TableCell>

                                    <TableCell className="px-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{customer.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                cu-{customer.id}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-4">
                                        <Badge variant="outline">
                                            {customer.type === "BUSINESS" ? "Business" : "Person"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                                        {customer.phone ?? "—"}
                                    </TableCell>

                                    <TableCell className="max-w-56 truncate px-4 text-muted-foreground">
                                        {customer.email ?? "—"}
                                    </TableCell>

                                    <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                                        {customer.city ?? "—"}
                                    </TableCell>

                                    <TableCell className="px-4 text-center font-medium tabular-nums">
                                        {customer.entryCount}
                                    </TableCell>

                                    <TableCell className="px-4">
                                        <Badge
                                            variant="outline"
                                            className={
                                                customer.active
                                                    ? "border-transparent bg-emerald-100 text-emerald-700"
                                                    : "border-transparent bg-muted text-muted-foreground"
                                            }
                                        >
                                            {customer.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>

                    {!loading && customers.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                {/* #, customer, type, phone, email, city */}
                                <TableCell colSpan={6} className="px-4 text-muted-foreground">
                                    {customers.length}{" "}
                                    {customers.length === 1 ? "customer" : "customers"}
                                </TableCell>

                                <TableCell className="px-4 text-center font-semibold tabular-nums">
                                    {totalEntries}
                                </TableCell>

                                {/* status */}
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>
        </div>
    );
}