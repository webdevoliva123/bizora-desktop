import type { ReportPeriodType } from "@/lib/types/report";

export type { ReportPeriodType };

const pad = (value: number) => String(value).padStart(2, "0");

export function isValidPeriod(type: ReportPeriodType, key: string) {
  if (type === "month") return /^\d{4}-(0[1-9]|1[0-2])$/.test(key);

  return /^\d{4}$/.test(key) && Number(key) >= 2000 && Number(key) <= 2100;
}

/** Local-time key for today: "yyyy-MM" or "yyyy" */
export function currentPeriodKey(type: ReportPeriodType, now = new Date()) {
  return type === "month"
    ? `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
    : String(now.getFullYear());
}

export function shiftPeriod(type: ReportPeriodType, key: string, delta: number) {
  if (type === "year") return String(Number(key) + delta);

  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function periodLabel(type: ReportPeriodType, key: string) {
  if (type === "year") return key;

  const [year, month] = key.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

/** Every bucket in a period: the days of a month, or the 12 months of a year. */
export function bucketKeys(type: ReportPeriodType, key: string) {
  if (type === "year") {
    return Array.from({ length: 12 }, (_, index) => `${key}-${pad(index + 1)}`);
  }

  const [year, month] = key.split("-").map(Number);
  const days = new Date(year, month, 0).getDate();

  return Array.from({ length: days }, (_, index) => `${key}-${pad(index + 1)}`);
}

/** Short axis label: "15" for a day, "Oct" for a month. */
export function bucketLabel(type: ReportPeriodType, bucketKey: string) {
  if (type === "month") return String(Number(bucketKey.slice(8, 10)));

  const [year, month] = bucketKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
    new Date(year, month - 1, 1),
  );
}

/** Long label for sentences: "15 Oct" for a day, "October" for a month. */
export function bucketLongLabel(type: ReportPeriodType, bucketKey: string) {
  if (type === "month") {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(new Date(`${bucketKey}T00:00:00`));
  }

  const [year, month] = bucketKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", { month: "long" }).format(
    new Date(year, month - 1, 1),
  );
}

export function monthsInPeriod(type: ReportPeriodType, key: string) {
  return type === "month" ? [key] : bucketKeys("year", key);
}