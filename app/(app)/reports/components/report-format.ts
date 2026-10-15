import type { ReportHealthStatus } from "@/lib/types/report";

export const COLORS = {
  sales: "#16a34a",
  purchases: "#f59e0b",
  expenses: "#ef4444",
  salaries: "#8b5cf6",
  profit: "#2563eb",
  cashIn: "#0d9488",
  cashOut: "#f97316",
  receivable: "#0ea5e9",
  payable: "#e11d48",
  previous: "#94a3b8",
};

export const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#94a3b8",
];

export const HEALTH_STYLES: Record<
  ReportHealthStatus,
  { color: string; badge: string }
> = {
  excellent: { color: "#059669", badge: "border-transparent bg-emerald-100 text-emerald-700" },
  good: { color: "#16a34a", badge: "border-transparent bg-green-100 text-green-700" },
  fair: { color: "#d97706", badge: "border-transparent bg-amber-100 text-amber-700" },
  weak: { color: "#ea580c", badge: "border-transparent bg-orange-100 text-orange-700" },
  critical: { color: "#dc2626", badge: "border-transparent bg-red-100 text-red-700" },
  no_data: { color: "#94a3b8", badge: "border-transparent bg-muted text-muted-foreground" },
};

/** Compact axis numbers in the Indian style: 1.2K, 3L, 1Cr */
export const compact = (rupees: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(rupees);

export function formatChange(value: number | null) {
  if (value === null) return "New";
  if (value === 0) return "0%";

  return `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

export const formatPercent = (value: number | null, digits = 1) =>
  value === null ? "—" : `${(value * 100).toFixed(digits)}%`;

export const formatQuantity = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(value);