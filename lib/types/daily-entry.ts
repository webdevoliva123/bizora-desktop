export const DAILY_ENTRY_TYPES = {
    CUSTOMER_SALE: "CUSTOMER_SALE",
    QUICK_SALE: "QUICK_SALE",
  } as const;
  
  export type DailyEntryType =
    (typeof DAILY_ENTRY_TYPES)[keyof typeof DAILY_ENTRY_TYPES];

export interface DailyEntryListItem {
    id: number;
    entryDate: string;
    createdAt: string;

    customerName: string;
    customerType: "PERSON" | "BUSINESS";
    itemCount: number;
    total: number;
    paymentType: "IMMEDIATE" | "MONTHLY";
    paidAmount: number;
    paymentCount: number;
    paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
}

  export interface DailyEntryDetailItem {
    id: number;
    productId: number;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }
  

  
  
  export interface DailyEntryDetailPayment {
    id: number;
    amount: number;
    paymentMethod: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER";
    paymentDate: string;
    reference: string | null;
    notes: string | null;
}

export interface DailyEntryDetail {
    id: number;
    entryDate: string;

    customerId: number;
    customerName: string;
    customerType: "PERSON" | "BUSINESS";

    subtotal: number;
    discount: number;
    tax: number;
    total: number;

    paymentType: "IMMEDIATE" | "MONTHLY";
    paymentStatus: "UNPAID" | "PARTIAL" | "PAID";

    paidAmount: number;
    outstandingAmount: number;

    notes: string | null;

    items: DailyEntryDetailItem[];

    payments: DailyEntryDetailPayment[];
}

export interface DailyEntryBill {
    business: {
      id: number;
      name: string;
      logoPath: string | null;
      businessType: string;
      businessCategory: string | null;
      country: string;
      currency: string;
      phone: string | null;
      email: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      postalCode: string | null;
    };
  
    customer: {
      id: number;
      name: string;
      type: "PERSON" | "BUSINESS";
    };
  
    entry: DailyEntryDetail;
  
    paymentDetails: {
      bankName: string | null;
      accountName: string | null;
      accountNumber: string | null;
      branchName: string | null;
      routingCode: string | null;
      paymentIdentifier: string | null;
      qrImagePath: string | null;
      showBankDetails: boolean;
      showQr: boolean;
      paymentInstructions: string | null;
    } | null;
  
    taxRegistrations: {
      taxSystem: string;
      registrationNumber: string | null;
    }[];
  
    businessRegistrations: {
      authorityName: string;
      registrationType: string;
      registrationNumber: string | null;
    }[];
  }