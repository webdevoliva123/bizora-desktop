export const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    PAID: { label: "Paid", className: "border-transparent bg-emerald-100 text-emerald-700" },
    PARTIAL: { label: "Partial", className: "border-transparent bg-amber-100 text-amber-700" },
    UNPAID: { label: "Unpaid", className: "border-transparent bg-red-100 text-red-700" },
  };
  
  export const formatMoney = (amount: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  
  export const formatDay = (date: string) =>
    new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });