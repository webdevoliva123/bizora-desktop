import { CUSTOMER_TYPE, PAYMENT_METHOD, PAYMENT_STATUS, PAYMENT_TYPE } from "@/common";

export const DAILY_ENTRY_TYPES = {
    CUSTOMER_SALE: "CUSTOMER_SALE",
    QUICK_SALE: "QUICK_SALE",
  } as const;
  
  export type DailyEntryType =
    (typeof DAILY_ENTRY_TYPES)[keyof typeof DAILY_ENTRY_TYPES];

export interface DailyEntryListItem {
    id: number;
    entryDate: string;
    isQuickSaleEntry : boolean,
    createdAt: string;

    customerName: string;
    customerType: CUSTOMER_TYPE;
    itemCount: number;
    total: number;
    paymentType: PAYMENT_TYPE;
    paidAmount: number;
    paymentCount: number;
    paymentStatus: PAYMENT_STATUS;
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
    paymentMethod: PAYMENT_METHOD;
    paymentDate: string;
    reference: string | null;
    notes: string | null;
}

export interface DailyEntryDetail {
    id: number;
    entryDate: string;
    isQuickSaleEntry : boolean;

    customerId: number;
    customerName: string;
    customerType: CUSTOMER_TYPE;

    subtotal: number;
    discount: number;
    tax: number;
    total: number;

    paymentType: PAYMENT_TYPE;
    paymentStatus: PAYMENT_STATUS;

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
      type: CUSTOMER_TYPE;
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