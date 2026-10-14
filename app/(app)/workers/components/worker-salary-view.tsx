"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { WorkerSalaryPayment, WorkerSalaryYear } from "@/lib/types/worker";

import { deleteWorkerPaymentAction } from "../actions";
import RecordSalaryDialog from "./record-salary-dialog";
import SalaryStatementPreview from "./salary-statement-preview";
import {
  currentMonthKey,
  formatCurrency,
  formatDate,
  methodLabel,
  monthName,
} from "./worker-shared";

interface WorkerSalaryViewProps {
  workerId: number;
  workerName: string;
  paymentType: string | null;
  defaultAmount: number | null;
  /** Called after a payment is added or removed so the page summary can refresh. */
  onChanged: () => void | Promise<void>;
}

export default function WorkerSalaryView({
  workerId,
  workerName,
  paymentType,
  defaultAmount,
  onChanged,
}: WorkerSalaryViewProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [salary, setSalary] = useState<WorkerSalaryYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recordMonth, setRecordMonth] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkerSalaryPayment | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Monthly workers have an expected amount per month we can compare against
  const expected = paymentType === "MONTHLY" ? defaultAmount : null;

  const loadSalary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workers/${workerId}/salary?year=${year}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load salary details.");
      }

      setSalary(data.salary);
    } catch (err) {
      console.error("Failed to load salary details:", err);
      setSalary(null);
      setError(
        err instanceof Error ? err.message : "Failed to load salary details.",
      );
    } finally {
      setLoading(false);
    }
  }, [workerId, year]);

  useEffect(() => {
    void loadSalary();
  }, [loadSalary]);

  async function handleRecorded() {
    await Promise.all([loadSalary(), onChanged()]);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError("");

    const result = await deleteWorkerPaymentAction(workerId, deleteTarget.id);

    setDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setDeleteTarget(null);
    await handleRecorded();
  }

  // Default new payments to the current month, or January of a past year
  const defaultMonth =
    year === new Date().getFullYear() ? currentMonthKey() : `${year}-01`;

  const years = salary?.availableYears ?? [year];

  return (
    <section className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Salary</span>

          <Select
            value={String(year)}
            onValueChange={(value) => {
              if (value) setYear(Number(value));
            }}
          >
            <SelectTrigger className="w-28" aria-label="Salary year">
              <SelectValue>{year}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {years.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {salary && (
            <span className="text-sm text-muted-foreground">
              {formatCurrency(salary.totalPaid)} paid in {year}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!salary || salary.paymentCount === 0}
            onClick={() => setPrintOpen(true)}
          >
            <Printer />
            Print Statement
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setRecordMonth(defaultMonth)}
          >
            <Plus />
            Add Salary
          </Button>
        </div>
      </div>

      {/* Months */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Month</TableHead>
              <TableHead className="px-4">Date</TableHead>
              <TableHead className="px-4">Method</TableHead>
              <TableHead className="px-4">Reference</TableHead>
              <TableHead className="px-4 text-right">Amount</TableHead>
              <TableHead className="w-24 px-4" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-sm text-muted-foreground"
                >
                  Loading salary details...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-sm text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : (
              salary?.months.map((month) => {
                const due = expected != null ? expected - month.total : null;

                return (
                  <Fragment key={month.month}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell className="px-4 font-medium">
                        {monthName(month.month)}
                      </TableCell>

                      <TableCell
                        colSpan={3}
                        className="px-4 text-xs text-muted-foreground"
                      >
                        {month.payments.length === 0
                          ? "No payments"
                          : `${month.payments.length} ${
                              month.payments.length === 1 ? "payment" : "payments"
                            }`}
                        {due !== null &&
                          (due > 0 ? (
                            <span className="text-red-600">
                              {" "}
                              · {formatCurrency(due)} due
                            </span>
                          ) : month.total > 0 ? (
                            <span className="text-emerald-600"> · Settled</span>
                          ) : null)}
                      </TableCell>

                      <TableCell className="px-4 text-right font-semibold tabular-nums">
                        {month.total > 0 ? formatCurrency(month.total) : "—"}
                      </TableCell>

                      <TableCell className="px-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Add salary for ${monthName(month.month)}`}
                          onClick={() => setRecordMonth(month.month)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {month.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="px-4" />
                        <TableCell className="px-4 whitespace-nowrap">
                          {formatDate(payment.paymentDate)}
                        </TableCell>
                        <TableCell className="px-4">
                          {methodLabel(payment.paymentMethod)}
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground">
                          {payment.reference || "—"}
                        </TableCell>
                        <TableCell className="px-4 text-right tabular-nums">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="px-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Delete payment"
                            onClick={() => {
                              setDeleteError("");
                              setDeleteTarget(payment);
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })
            )}
          </TableBody>

          {!loading && !error && salary && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="px-4 text-muted-foreground">
                  Total for {year} ({salary.paymentCount}{" "}
                  {salary.paymentCount === 1 ? "payment" : "payments"})
                </TableCell>
                <TableCell className="px-4 text-right font-semibold tabular-nums">
                  {formatCurrency(salary.totalPaid)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <RecordSalaryDialog
        open={recordMonth !== null}
        onOpenChange={(open) => {
          if (!open) setRecordMonth(null);
        }}
        workerId={workerId}
        workerName={workerName}
        defaultAmount={defaultAmount}
        initialMonth={recordMonth ?? defaultMonth}
        onRecorded={handleRecorded}
      />

      <SalaryStatementPreview
        open={printOpen}
        onOpenChange={setPrintOpen}
        workerId={workerId}
        year={year}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!deleting && !next) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete salary payment?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This removes the ${formatCurrency(deleteTarget.amount)} payment for ${monthName(deleteTarget.paymentPeriod)} ${year}. This can't be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}