// components/daily-entries/payment-options.ts

import { PAYMENT_METHOD } from "@/common";

export type PaymentMethod = PAYMENT_METHOD;

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  referenceHint: string;
}[] = [
  { value: "CASH", label: "Cash", referenceHint: "Optional" },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    referenceHint: "UTR / transaction ID (optional)",
  },
  {
    value: "CARD",
    label: "Card",
    referenceHint: "Last 4 digits or slip no. (optional)",
  },
  { value: "OTHER", label: "Other", referenceHint: "Optional" },
];

export const methodLabel = (method: PaymentMethod) =>
  PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
  method;

export const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  PAYMENT_METHOD_OPTIONS.some((option) => option.value === value);

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Local-time "yyyy-MM-dd" (toISOString would give the UTC date, which is
 *  yesterday in India before 5:30 AM) */
export function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

/** paise -> "1,250.00" */
export const formatPaise = (amount: number) =>
  (amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });