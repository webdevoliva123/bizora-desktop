"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createStockPurchase } from "../actions";
import type { ProductOption, SupplierOption } from "@/lib/types/stock-purchase";
import { StockPurchaseForm } from "./stock-purchase-form";

type Props = {
  suppliers: SupplierOption[];
  products: ProductOption[];
};

export function AddStockPurchaseDialog({ suppliers, products }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(data: Parameters<typeof createStockPurchase>[0]) {
    const result = await createStockPurchase(data);
  
    if (!result.success) {
      throw new Error(result.error);
    }
  
    setOpen(false);
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New Purchase
      </DialogTrigger>

      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>New stock purchase</DialogTitle>
          <DialogDescription>
            Record what you bought, from whom, and how it was paid.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <StockPurchaseForm
            suppliers={suppliers}
            products={products}
            onCancel={() => setOpen(false)}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}