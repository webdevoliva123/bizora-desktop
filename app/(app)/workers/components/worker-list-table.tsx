"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkerListItem, WorkerStatusFilter } from "@/lib/types/worker";

import { formatCurrency, formatDate, paymentTypeLabel } from "./worker-shared";

const STATUS_OPTIONS: { value: WorkerStatusFilter; label: string }[] = [
  { value: "ALL", label: "All workers" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const statusLabel = (value: WorkerStatusFilter) =>
  STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;

const isStatus = (value: unknown): value is WorkerStatusFilter =>
  STATUS_OPTIONS.some((option) => option.value === value);

export default function WorkerList() {
  const router = useRouter();

  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [status, setStatus] = useState<WorkerStatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWorkers = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (status !== "ALL") params.set("status", status);

        const response = await fetch(`/api/workers?${params.toString()}`, {
          cache: "no-store",
          signal,
        });

        if (!response.ok) throw new Error("Failed to load workers");

        const data = await response.json();

        setWorkers(data.workers ?? []);
        setLoading(false);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        console.error("Failed to load workers:", error);
        setWorkers([]);
        setLoading(false);
      }
    },
    [search, status],
  );

  // Debounced load that cancels stale requests
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void loadWorkers(controller.signal), 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadWorkers]);

  // Refresh after a worker is added
  useEffect(() => {
    const handleRefresh = () => void loadWorkers();

    window.addEventListener("workers:refresh", handleRefresh);
    return () => window.removeEventListener("workers:refresh", handleRefresh);
  }, [loadWorkers]);

  const openWorker = (id: number) => router.push(`/workers/${id}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone or role..."
            className="pl-9"
            aria-label="Search workers"
          />
        </div>

        <div className="sm:ml-auto">
          <Select
            value={status}
            onValueChange={(value) => {
              if (isStatus(value)) setStatus(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Worker status">
              <SelectValue placeholder="Status">{statusLabel(status)}</SelectValue>
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
              <TableHead className="px-4">Worker</TableHead>
              <TableHead className="px-4">Role</TableHead>
              <TableHead className="px-4">Phone</TableHead>
              <TableHead className="px-4">Salary</TableHead>
              <TableHead className="px-4">Joined</TableHead>
              <TableHead className="px-4">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="h-56 text-center text-sm text-muted-foreground"
                >
                  Loading workers...
                </TableCell>
              </TableRow>
            ) : workers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-56 text-center">
                  <p className="text-sm font-medium">No workers found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {search || status !== "ALL"
                      ? "Try a different search or status."
                      : "Add your first worker to get started."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              workers.map((worker, index) => (
                <TableRow
                  key={worker.id}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => openWorker(worker.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openWorker(worker.id);
                    }
                  }}
                >
                  <TableCell className="px-4 text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>

                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{worker.name}</span>
                      <span className="text-xs text-muted-foreground">
                        wk-{worker.id}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 text-muted-foreground">
                    {worker.role ?? "—"}
                  </TableCell>

                  <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                    {worker.phone ?? "—"}
                  </TableCell>

                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-medium tabular-nums">
                        {worker.defaultPaymentAmount != null
                          ? formatCurrency(worker.defaultPaymentAmount)
                          : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {paymentTypeLabel(worker.paymentType)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                    {formatDate(worker.joiningDate)}
                  </TableCell>

                  <TableCell className="px-4">
                    <Badge
                      variant="outline"
                      className={
                        worker.active
                          ? "border-transparent bg-emerald-100 text-emerald-700"
                          : "border-transparent bg-muted text-muted-foreground"
                      }
                    >
                      {worker.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && workers.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            {workers.length} {workers.length === 1 ? "worker" : "workers"}
          </div>
        )}
      </div>
    </div>
  );
}