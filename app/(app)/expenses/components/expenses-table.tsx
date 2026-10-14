"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PAYMENT_METHOD_OPTIONS } from "@/common";
import { cn } from "@/lib/utils";

import type { ExpenseCategoryOption, ExpenseListItem } from "@/lib/types/expense";
import {
  formatDay,
  formatMoney,
} from "@/app/(app)/stock-purchases/components/stock-purchase-shared";
import { deleteExpenseAction } from "../actions";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { MonthlyExpenseStatementPreview } from "./monthly-expense-statement-preview";

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

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

const methodLabel = (method: string) =>
  PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
  method;

export function ExpensesTable({
  expenses,
  categories,
  currency,
}: {
  expenses: ExpenseListItem[];
  categories: ExpenseCategoryOption[];
  currency: string;
}) {
  const router = useRouter();

  // Client-only so the month doesn't mismatch between server and browser timezones
  const [currentMonth, setCurrentMonth] = useState("");
  const [monthFilter, setMonthFilter] = useState<string | null>(null); // null = this month
  const [categoryFilter, setCategoryFilter] = useState("all"); // all | none | id
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    setCurrentMonth(monthKey(new Date()));
  }, []);

  const selected = monthFilter ?? currentMonth;
  const isCurrent = monthFilter === null;

  function selectMonth(key: string) {
    setMonthFilter(key === currentMonth ? null : key);
  }

  const editing = expenses.find((expense) => expense.id === editId);

  const categoryLabel =
    categoryFilter === "all"
      ? "All categories"
      : categoryFilter === "none"
        ? "Uncategorised"
        : (categories.find((category) => String(category.id) === categoryFilter)
            ?.name ?? "All categories");

  const rows = useMemo(
    () =>
      expenses.filter((expense) => {
        if (expense.expenseDate.slice(0, 7) !== selected) return false;
        if (categoryFilter === "all") return true;
        if (categoryFilter === "none") return expense.categoryId === null;

        return String(expense.categoryId) === categoryFilter;
      }),
    [expenses, selected, categoryFilter],
  );

  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  async function confirmDelete() {
    if (deleteId === null) return;

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteExpenseAction(deleteId);

    setDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setDeleteId(null);
    router.refresh();
  }

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

        <div className="flex items-center gap-2 sm:ml-auto">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Category filter">
              <SelectValue placeholder="All categories">{categoryLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="none">Uncategorised</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" variant="outline" onClick={() => setPrintOpen(true)}>
            <Printer />
            Print bill
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-4">#</TableHead>
              <TableHead className="px-4">Date</TableHead>
              <TableHead className="px-4">Description</TableHead>
              <TableHead className="px-4">Category</TableHead>
              <TableHead className="px-4">Method</TableHead>
              <TableHead className="px-4">Reference</TableHead>
              <TableHead className="px-4 text-right">Amount</TableHead>
              <TableHead className="w-24 px-4" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-56 text-center">
                  <p className="text-sm font-medium">
                    No expenses for {isCurrent ? "this month" : formatMonth(selected)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {categoryFilter !== "all"
                      ? "Try another category or month."
                      : "Use Add Expense to record one, or pick another month."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((expense, index) => (
                <TableRow
                  key={expense.id}
                  tabIndex={0}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setEditId(expense.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setEditId(expense.id);
                    }
                  }}
                >
                  <TableCell className="px-4 text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>

                  <TableCell className="px-4 whitespace-nowrap">
                    {formatDay(expense.expenseDate)}
                  </TableCell>

                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{expense.description}</span>
                      {expense.notes && (
                        <span className="max-w-xs truncate text-xs text-muted-foreground">
                          {expense.notes}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-4">
                    {expense.categoryName ? (
                      <Badge variant="outline">{expense.categoryName}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="px-4">{methodLabel(expense.paymentMethod)}</TableCell>

                  <TableCell className="px-4 text-muted-foreground">
                    {expense.reference || "—"}
                  </TableCell>

                  <TableCell className="px-4 text-right font-medium tabular-nums">
                    {formatMoney(expense.amount, currency)}
                  </TableCell>

                  <TableCell className="px-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${expense.description}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditId(expense.id);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${expense.description}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteError(null);
                          setDeleteId(expense.id);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="px-4 text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "expense" : "expenses"}
                </TableCell>
                <TableCell className="px-4 text-right font-semibold tabular-nums">
                  {formatMoney(totalAmount, currency)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {editing && (
        <ExpenseFormDialog
          open
          onOpenChange={(value) => {
            if (!value) setEditId(null);
          }}
          expense={editing}
          categories={categories}
        />
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(value) => {
          if (!value && !deleting) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from your monthly totals and printed bills. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep expense</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting && <Loader2 className="animate-spin" />}
              Delete expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MonthlyExpenseStatementPreview
        open={printOpen}
        onOpenChange={setPrintOpen}
        month={selected}
        categories={categories}
      />
    </div>
  );
}