import { PAYMENT_METHOD_OPTIONS } from "@/common";
import { WORKER_PAYMENT_TYPE_OPTIONS } from "@/lib/types/worker";

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

/** "2026-09" -> "September" */
export function monthName(month: string) {
  const [year, number] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", { month: "long" }).format(
    new Date(year, number - 1, 1),
  );
}

/** Local-time "yyyy-MM-dd" */
export function todayKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const currentMonthKey = () => todayKey().slice(0, 7);

export const methodLabel = (method: string) =>
  PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
  method;

export const paymentTypeLabel = (type?: string | null) =>
  WORKER_PAYMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
  "—";

/** "1250.5" -> 125050 (paise). Returns 0 for empty or invalid input. */
export function toPaise(value: string) {
  const amount = Number(value.replace(/,/g, "").trim());

  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}