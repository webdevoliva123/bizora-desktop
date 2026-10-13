"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

import type { SupplierListItem } from "@/lib/types/supplier";
import { formatMoney } from "@/app/(app)/stock-purchases/components/stock-purchase-shared";
import { SupplierFormDialog } from "./supplier-form-dialog";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All suppliers" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const statusLabel = (value: StatusFilter) =>
  STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;

const isStatusFilter = (value: unknown): value is StatusFilter =>
  STATUS_OPTIONS.some((option) => option.value === value);

export function SuppliersTable({
  suppliers,
  currency,
}: {
  suppliers: SupplierListItem[];
  currency: string;
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [editId, setEditId] = useState<number | null>(null);

  const editing = suppliers.find((supplier) => supplier.id === editId);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      if (statusFilter === "ACTIVE" && !supplier.active) return false;
      if (statusFilter === "INACTIVE" && supplier.active) return false;
      if (!query) return true;

      return [supplier.name, supplier.contactPerson, supplier.phone, supplier.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [suppliers, search, statusFilter]);

  const totalPurchases = rows.reduce((sum, row) => sum + row.purchaseCount, 0);
  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);
  const totalPaid = rows.reduce((sum, row) => sum + row.paidAmount, 0);

  const open = (id: number) => router.push(`/suppliers/${id}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search suppliers..."
            aria-label="Search suppliers"
            className="pl-9"
          />
        </div>

        <div className="sm:ml-auto">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (isStatusFilter(value)) setStatusFilter(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Status filter">
              <SelectValue placeholder="All suppliers">
                {statusLabel(statusFilter)}
              </SelectValue>
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
              <TableHead className="px-4">Supplier</TableHead>
              <TableHead className="px-4">Phone</TableHead>
              <TableHead className="px-4">Email</TableHead>
              <TableHead className="px-4 text-center">Purchases</TableHead>
              <TableHead className="px-4 text-right">Total purchased</TableHead>
              <TableHead className="px-4 text-right">Outstanding</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="w-14 px-4" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="h-56 text-center">
                  <p className="text-sm font-medium">
                    {suppliers.length === 0 ? "No suppliers yet" : "No suppliers found"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {suppliers.length === 0
                      ? "Use Add Supplier to create your first one."
                      : "Try another search or status filter."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((supplier, index) => {
                const balance = supplier.totalAmount - supplier.paidAmount;

                return (
                  <TableRow
                    key={supplier.id}
                    tabIndex={0}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      !supplier.active && "bg-muted/30 text-muted-foreground",
                    )}
                    onClick={() => open(supplier.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        open(supplier.id);
                      }
                    }}
                  >
                    <TableCell className="px-4 text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>

                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{supplier.name}</span>
                        {supplier.contactPerson && (
                          <span className="text-xs text-muted-foreground">
                            {supplier.contactPerson}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-4">{supplier.phone || "—"}</TableCell>
                    <TableCell className="px-4">{supplier.email || "—"}</TableCell>

                    <TableCell className="px-4 text-center tabular-nums">
                      {supplier.purchaseCount}
                    </TableCell>

                    <TableCell className="px-4 text-right font-medium tabular-nums">
                      {formatMoney(supplier.totalAmount, currency)}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "px-4 text-right tabular-nums",
                        balance > 0 && "font-medium text-red-600",
                      )}
                    >
                      {formatMoney(balance, currency)}
                    </TableCell>

                    <TableCell className="px-4">
                      <Badge
                        variant="outline"
                        className={
                          supplier.active
                            ? "border-transparent bg-emerald-100 text-emerald-700"
                            : "border-transparent bg-muted text-muted-foreground"
                        }
                      >
                        {supplier.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${supplier.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditId(supplier.id);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>

          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="px-4 text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "supplier" : "suppliers"}
                </TableCell>
                <TableCell className="px-4 text-center font-semibold tabular-nums">
                  {totalPurchases}
                </TableCell>
                <TableCell className="px-4 text-right font-semibold tabular-nums">
                  {formatMoney(totalAmount, currency)}
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

      {editing && (
        <SupplierFormDialog
          open
          onOpenChange={(value) => {
            if (!value) setEditId(null);
          }}
          supplier={editing}
        />
      )}
    </div>
  );
}