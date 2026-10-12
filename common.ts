// CUSTOMER
export type CUSTOMER_TYPE = "PERSON" | "BUSINESS"


// PAYMENTS

export type PAYMENT_TYPE = "IMMEDIATE" | "MONTHLY"


export type PAYMENT_STATUS = "UNPAID" | "PARTIAL" | "PAID"

export type PAYMENT_METHOD =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "CARD"
  | "OTHER";

export const PAYMENT_METHOD_OPTIONS: {
  value: PAYMENT_METHOD;
  label: string;
  referencePlaceholder: string;
}[] = [
  {
    value: "CASH",
    label: "Cash",
    referencePlaceholder: "Optional",
  },
  {
    value: "UPI",
    label: "UPI",
    referencePlaceholder: "UPI transaction ID",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    referencePlaceholder: "UTR / transaction ID",
  },
  {
    value: "CARD",
    label: "Card",
    referencePlaceholder: "Last 4 digits / slip no.",
  },
  {
    value: "OTHER",
    label: "Other",
    referencePlaceholder: "Optional",
  },
];

export const PAYMENT_TYPE_OPTIONS: {
  value: PAYMENT_TYPE;
  label: string;
  description: string;
}[] = [
  {
    value: "IMMEDIATE",
    label: "Immediate",
    description: "Customer pays now, fully or partly.",
  },
  {
    value: "MONTHLY",
    label: "Monthly",
    description: "Added to the customer's monthly account.",
  },
];

export const PAYMENT_OPTIONS: { value: PAYMENT_STATUS; label: string }[] = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
];



// ENTRIES

export type ENTRY_TYPE = "CUSTOMER_SALE" | "QUICK_SALE"