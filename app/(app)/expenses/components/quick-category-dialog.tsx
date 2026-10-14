"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

import type { ExpenseCategoryOption } from "@/lib/types/expense";
import { createExpenseCategoryAction } from "../actions";

type Props = {
  open: boolean;
  initialName: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: ExpenseCategoryOption) => void;
};

export function QuickCategoryDialog({
  open,
  initialName,
  onOpenChange,
  onCreated,
}: Props) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset every time the dialog opens, prefilled with what the user typed.
  useEffect(() => {
    if (open) {
      setName(initialName);
      setError(null);
    }
  }, [open, initialName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // This dialog is rendered inside the expense <form> in the React tree,
    // so stop the submit from bubbling up and saving the expense too.
    event.stopPropagation();

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await createExpenseCategoryAction(name);

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onCreated(result.category);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
          <DialogDescription>
            Create an expense category you can reuse later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-category-name">Category name</Label>
            <Input
              id="quick-category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Electricity, Rent, Transport"
              maxLength={80}
              autoFocus
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Create category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}