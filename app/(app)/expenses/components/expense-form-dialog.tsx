"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHOD_OPTIONS } from "@/common";

import { CreatableCombobox } from "@/app/(app)/stock-purchases/components/creatable-combobox";
import type { ExpenseCategoryOption, ExpenseListItem } from "@/lib/types/expense";
import {
  createExpenseAction,
  createExpenseCategoryAction,
  updateExpenseAction,
} from "../actions";

type FormState = {
  description: string;
  amount: string; // rupees, as typed
  expenseDate: string;
  categoryId: string; // "none" or id
  paymentMethod: string;
  reference: string;
  notes: string;
};

/** Local-time "yyyy-MM-dd" */
function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

const byName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name);

const methodLabel = (method: string) =>
  PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
  method;

const toForm = (expense?: ExpenseListItem): FormState => ({
  description: expense?.description ?? "",
  amount: expense ? (expense.amount / 100).toFixed(2) : "",
  expenseDate: expense?.expenseDate.slice(0, 10) ?? todayKey(),
  categoryId: expense?.categoryId ? String(expense.categoryId) : "none",
  paymentMethod: expense?.paymentMethod ?? "CASH",
  reference: expense?.reference ?? "",
  notes: expense?.notes ?? "",
});

function ExpenseForm({
  expense,
  categories,
  onDone,
  onCancel,
}: {
  expense?: ExpenseListItem;
  categories: ExpenseCategoryOption[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(expense);

  const [form, setForm] = useState<FormState>(() => toForm(expense));
  const [categoryList, setCategoryList] = useState(categories);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const amountPaise = Math.round((Number(form.amount) || 0) * 100);

  async function handleCreateCategory(name: string) {
    const result = await createExpenseCategoryAction(name);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setError(null);
    setCategoryList((current) => [...current, result.category].sort(byName));
    setForm((current) => ({
      ...current,
      categoryId: String(result.category.id),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (amountPaise <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!form.expenseDate || form.expenseDate > todayKey()) {
      setError("Choose a date that is not in the future.");
      return;
    }

    setSaving(true);

    const payload = {
      categoryId: form.categoryId === "none" ? null : Number(form.categoryId),
      expenseDate: form.expenseDate,
      description: form.description,
      amount: amountPaise,
      paymentMethod: form.paymentMethod,
      reference: form.reference,
      notes: form.notes,
    };

    const result = expense
      ? await updateExpenseAction(expense.id, payload)
      : await createExpenseAction(payload);

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={field("description")}
              placeholder="e.g. Shop electricity bill"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="pl-7 tabular-nums"
                placeholder="0.00"
                value={form.amount}
                onChange={field("amount")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenseDate">Date</Label>
            <Input
              id="expenseDate"
              type="date"
              max={todayKey()}
              value={form.expenseDate}
              onChange={field("expenseDate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CreatableCombobox
              id="category"
              value={form.categoryId}
              onValueChange={(value: string) =>
                setForm((current) => ({ ...current, categoryId: value }))
              }
              noneOption={{ value: "none", label: "No category" }}
              options={categoryList.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
              placeholder="Select category"
              searchPlaceholder="Search categories..."
              emptyText="No category found."
              createLabel="Create new category"
              onCreate={(name: string) => void handleCreateCategory(name)}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  paymentMethod: value ?? "OTHER",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method">
                  {methodLabel(form.paymentMethod)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reference">
              Reference{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="reference"
              value={form.reference}
              onChange={field("reference")}
              placeholder="Transaction ID, bill number..."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={field("notes")}
            />
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="shrink-0 border-t bg-destructive/10 px-6 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/30 px-6 py-4">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {isEdit ? "Save changes" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Controlled dialog (used by the table's edit button)                        */
/* -------------------------------------------------------------------------- */

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: ExpenseListItem;
  categories: ExpenseCategoryOption[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>
            {expense
              ? "Update the details of this expense."
              : "Record money spent on running the business."}
          </DialogDescription>
        </DialogHeader>

        <ExpenseForm
          key={expense?.id ?? "new"}
          expense={expense}
          categories={categories}
          onDone={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Header "Add Expense" button                                                */
/* -------------------------------------------------------------------------- */

export function AddExpenseDialog({
  categories,
}: {
  categories: ExpenseCategoryOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Add Expense
      </Button>
      <ExpenseFormDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
      />
    </>
  );
}