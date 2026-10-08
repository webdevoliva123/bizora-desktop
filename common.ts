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

// ENTRIES

export type ENTRY_TYPE = "CUSTOMER_SALE" | "QUICK_SALE"